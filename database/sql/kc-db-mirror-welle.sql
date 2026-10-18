-- KICC-F-108 (Wunsch Hansi 18.10.2026 „Ja umsetzen“): Spiegellauf alle 6 Stunden in Wellen statt alles auf einmal.
-- Anlass: Verlauf in der Admin-Zentrale zeigte alle 6 h rote Säulen „Fehlgeschlagene Hintergrund-Aufrufe“ – kc_neon_low_compute_cycle()
-- schickte 24 Spiegel-Anfragen gleichzeitig los; einzelne Arbeiter starteten nicht (503 BOOT_ERROR) und wurden erst um :25 nachgeholt.
-- Neu: 3 Pakete sofort, die übrigen in kc_internal.kc_db_mirror_welle vorgemerkt (je Minute 3). Job kc-db-mirror-welle (Minute 11–22
-- der Spiegel-Stunden) schickt sie ab. Es wird nichts weggelassen: dieselben Tabellen, dieselben Pakete, nur zeitlich verteilt.
-- Die Nachholung um :25 bleibt als Sicherheitsnetz. Kein DELETE: feste Plätze (nr) werden je Lauf überschrieben.
-- Rücknahme: vorige Fassung von kc_neon_low_compute_cycle() (alle Pakete sofort) einspielen, Job kc-db-mirror-welle entfernen.

create table if not exists kc_internal.kc_db_mirror_welle (
  nr int primary key,
  zyklus timestamptz not null,
  paket text[] not null,
  faellig_ab timestamptz not null,
  gesendet_at timestamptz,
  request_id bigint,
  verworfen boolean not null default false
);
revoke all on kc_internal.kc_db_mirror_welle from public;

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
 -- Reste eines früheren Laufs (sollte es nicht geben) gelten als überholt
 update kc_internal.kc_db_mirror_welle set verworfen = true where gesendet_at is null and not verworfen;
 v_pakete := public.kc_db_mirror_pakete_vorbereiten();
 for p in select value from jsonb_array_elements(v_pakete) loop
   if i < c_je_welle then
     v_req := public.kc_db_mirror_dispatch(array(select jsonb_array_elements_text(p)));
     v_reqs := v_reqs || to_jsonb(v_req);
   else
     insert into kc_internal.kc_db_mirror_welle(nr, zyklus, paket, faellig_ab, gesendet_at, request_id, verworfen)
     values (i, v_jetzt, array(select jsonb_array_elements_text(p)), v_jetzt + (i / c_je_welle) * interval '1 minute' - interval '10 seconds', null, null, false)
     on conflict (nr) do update set zyklus = excluded.zyklus, paket = excluded.paket, faellig_ab = excluded.faellig_ab,
       gesendet_at = null, request_id = null, verworfen = false;
     v_vorgemerkt := v_vorgemerkt + 1;
   end if;
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
 w record; v_req bigint; v_reqs jsonb := '[]'::jsonb;
begin
 for w in
   select nr, paket from kc_internal.kc_db_mirror_welle
    where gesendet_at is null and not verworfen and faellig_ab <= now() and zyklus > now() - interval '1 hour'
    order by nr limit 3 for update skip locked
 loop
   v_req := public.kc_db_mirror_dispatch(w.paket);
   update kc_internal.kc_db_mirror_welle set gesendet_at = now(), request_id = v_req where nr = w.nr;
   v_reqs := v_reqs || to_jsonb(v_req);
 end loop;
 return jsonb_build_object('gesendet', jsonb_array_length(v_reqs), 'requests', v_reqs);
end $function$;
revoke all on function kc_internal.kc_db_mirror_welle_senden() from public;

select cron.unschedule('kc-db-mirror-welle') where exists (select 1 from cron.job where jobname = 'kc-db-mirror-welle');
select cron.schedule('kc-db-mirror-welle', '11-22 0,6,12,18 * * *', 'select kc_internal.kc_db_mirror_welle_senden()');
