-- KICC-F-111 (Wunsch Hansi 28.10.2026 „Ja“): Spiegel-Welle schickt ein Paket, dessen Arbeiter nicht startete, gleich noch einmal.
-- Anlass: Lauf 28.10. 17:10 Uhr – 4 von 13 Paketen bekamen von Supabase „503 BOOT_ERROR – Function failed to start“; 43 Tabellen blieben
-- auf dem Stand von 11:10, der Wächter meldete gelb, das Nachholen (10 Tabellen je halbe Stunde) brauchte rund 3 Stunden.
-- Neu: Jeder Minutenlauf von kc-db-mirror-welle (Minute 11–22 der Spiegel-Stunden) sieht zuerst nach, ob ein schon geschicktes Paket mit
-- Serverfehler (5xx), Zeitüberschreitung oder Netzfehler zurückkam, und schickt es noch einmal – höchstens 2 Wiederholungen je Paket und
-- 2 je Minute (damit nicht wieder zu viele Arbeiter gleichzeitig starten). Auch die 3 sofort geschickten Pakete stehen jetzt in der Liste.
-- Antworten liest die Welle nur aus net._http_response (eigene Tabelle, keine Supabase-Protokolle – KC-SPARSAM-PROTOKOLLE).
-- Das Nachholen um :25/:55 bleibt als Sicherheitsnetz. Rücknahme: kc-db-mirror-welle.sql (vorige Fassung beider Funktionen) einspielen;
-- die Spalte versuche darf bleiben.

alter table kc_internal.kc_db_mirror_welle add column if not exists versuche int not null default 0;

create or replace function public.kc_neon_low_compute_cycle()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
 v_until timestamptz; v_count int := 0; v_reqs jsonb := '[]'::jsonb; v_pakete jsonb; p jsonb; v_req bigint;
 v_jetzt timestamptz := now(); i int := 0; v_vorgemerkt int := 0;
 c_je_welle constant int := 3;
begin
 select maintenance_until into v_until from public.kc_neon_compute_policy where id='primary';
 if now()<coalesce(v_until,'infinity'::timestamptz) then
   return jsonb_build_object('status','maintenance','compute_opened',false,'until',v_until);
 end if;
 update kc_internal.kc_db_mirror_welle set verworfen = true where gesendet_at is null and not verworfen;
 v_pakete := public.kc_db_mirror_pakete_vorbereiten();
 for p in select value from jsonb_array_elements(v_pakete) loop
   v_req := null;
   if i < c_je_welle then
     v_req := public.kc_db_mirror_dispatch(array(select jsonb_array_elements_text(p)));
     v_reqs := v_reqs || to_jsonb(v_req);
   else
     v_vorgemerkt := v_vorgemerkt + 1;
   end if;
   -- KICC-F-111: auch die sofort geschickten Pakete (gesendet_at gesetzt), damit die Welle sie bei Serverfehler wiederholen kann
   insert into kc_internal.kc_db_mirror_welle(nr, zyklus, paket, faellig_ab, gesendet_at, request_id, verworfen, versuche)
   values (i, v_jetzt, array(select jsonb_array_elements_text(p)), v_jetzt + (i / c_je_welle) * interval '1 minute' - interval '10 seconds',
           case when v_req is null then null else now() end, v_req, false, 0)
   on conflict (nr) do update set zyklus = excluded.zyklus, paket = excluded.paket, faellig_ab = excluded.faellig_ab,
     gesendet_at = excluded.gesendet_at, request_id = excluded.request_id, verworfen = false, versuche = 0;
   v_count := v_count + jsonb_array_length(p);
   i := i + 1;
 end loop;
 if v_count=0 then return jsonb_build_object('status','nothing_to_mirror','compute_opened',false); end if;
 update public.kc_neon_compute_policy set mode='low_compute_active',updated_at=now() where id='primary';
 return jsonb_build_object('status','mirror_dispatched','compute_opened',true,'tables',v_count,'requests',v_reqs,'pakete',i,'vorgemerkt',v_vorgemerkt);
end $function$;

create or replace function kc_internal.kc_db_mirror_welle_senden()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
 w record; v_req bigint; v_reqs jsonb := '[]'::jsonb; v_wdh jsonb := '[]'::jsonb;
begin
 -- 1) KICC-F-111: Pakete mit Serverfehler, Zeitüberschreitung oder Netzfehler noch einmal schicken (je Paket höchstens 2-mal, je Minute 2)
 for w in
   select x.nr, x.paket, x.versuche, r.status_code from kc_internal.kc_db_mirror_welle x
     join net._http_response r on r.id = x.request_id
    where x.gesendet_at is not null and not x.verworfen and x.versuche < 2 and x.zyklus > now() - interval '1 hour'
      and (coalesce(r.status_code, 0) >= 500 or coalesce(r.timed_out, false) or r.error_msg is not null)
    order by x.nr limit 2 for update of x skip locked
 loop
   v_req := public.kc_db_mirror_dispatch(w.paket);
   update kc_internal.kc_db_mirror_welle set gesendet_at = now(), request_id = v_req, versuche = versuche + 1 where nr = w.nr;
   v_wdh := v_wdh || to_jsonb(w.nr);
   insert into public.kc_db_mirror_audit(severity, action, detail, metadata)
   values ('info', 'mirror_welle_wiederholt', format('Spiegel-Welle: Paket %s (%s Tabellen) kam mit Fehler %s zurück und wird noch einmal geschickt (Versuch %s).',
           w.nr, cardinality(w.paket), coalesce(w.status_code::text, 'ohne Antwort'), w.versuche + 2),
           jsonb_build_object('nr', w.nr, 'tabellen', to_jsonb(w.paket), 'status', w.status_code, 'request_id', v_req));
 end loop;
 -- 2) wie bisher: fällige Pakete schicken (je Minute 3)
 for w in
   select nr, paket from kc_internal.kc_db_mirror_welle
    where gesendet_at is null and not verworfen and faellig_ab <= now() and zyklus > now() - interval '1 hour'
    order by nr limit 3 for update skip locked
 loop
   v_req := public.kc_db_mirror_dispatch(w.paket);
   update kc_internal.kc_db_mirror_welle set gesendet_at = now(), request_id = v_req where nr = w.nr;
   v_reqs := v_reqs || to_jsonb(v_req);
 end loop;
 return jsonb_build_object('gesendet', jsonb_array_length(v_reqs), 'requests', v_reqs, 'wiederholt', v_wdh);
end $function$;
revoke all on function kc_internal.kc_db_mirror_welle_senden() from public;
