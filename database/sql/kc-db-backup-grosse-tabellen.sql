-- KICC-F-105 (Freigabe Betreiber 16.10.2026): grosse Tabellen nicht im gleichzeitigen Backup-Stoss sichern.
-- Anlass: 15./16.10. liefen kc_club_protokoll und kc_communication_requests beim gleichzeitigen Lesen durch
-- 11 Worker in das 60-s-Limit (bis 56 s, einzeln < 0,5 s) und mussten nachgeholt werden.
-- Neu: kc_db_backup_daily() schickt Tabellen ab 2 MB (hoechstens 15) nicht im Stoss mit, sondern merkt sie im
-- Dispatch-Audit als "spaeter" vor. Der naechste Lauf von kc_db_backup_nachholen() (10 min spaeter, ohne Last)
-- sichert sie in denselben Satz – als geplanter Schritt (info, action backup_spaeter_gesichert), nicht als Fehler.
-- Erwartete Tabellenzahl des Satzes bleibt die volle Zahl (Abschluss und Restore-Test unveraendert).
-- Ruecknahme: vorherige Fassungen aus database/sql/kc-db-backup-nachholen.sql und dem Stand vor KICC-F-105 einspielen.

create or replace function public.kc_db_backup_daily()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'vault', 'net'
as $function$
declare
  v_token text;
  v_set uuid := gen_random_uuid();
  v_tabellen text[];
  v_zurueck text[];
  v_gross text[];
  v_stoss text[];
  v_total int;
  v_reqs jsonb := '[]'::jsonb;
  v_req bigint;
  i int := 1;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name='kc_db_mirror_worker_token' limit 1;
  if v_token is null then raise exception 'backup worker token unavailable'; end if;

  with gespiegelt as (
    select distinct r.metrics->>'table' as t from public.kc_db_mirror_runs r
     where r.run_type = 'snapshot' and r.status = 'ok' and r.finished_at > now() - interval '2 days'
  ), kandidaten as (
    select tr.table_name, (tr.updated_at > now() - interval '24 hours' and not exists (select 1 from gespiegelt g where g.t = tr.table_name)) as neu_ohne_spiegel
      from public.kc_db_mirror_table_rules tr
     where tr.backup_enabled and tr.mirror_enabled and tr.sensitivity <> 'secret'
  )
  select coalesce(array_agg(table_name order by table_name) filter (where not neu_ohne_spiegel), '{}'::text[]),
         coalesce(array_agg(table_name order by table_name) filter (where neu_ohne_spiegel), '{}'::text[])
    into v_tabellen, v_zurueck from kandidaten;

  if cardinality(v_zurueck) > 0 then
    insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
    values('info','backup_table_deferred','Neue Tabelle(n) erst nach dem ersten Spiegellauf im Backup',jsonb_build_object('tables',to_jsonb(v_zurueck),'backup_set',v_set));
  end if;

  v_total := cardinality(v_tabellen);
  if v_total = 0 then return jsonb_build_object('backup_set', null, 'status', 'nothing_to_backup'); end if;

  -- KICC-F-105: grosse Tabellen (>= 2 MB, hoechstens 15) erst im ruhigen Nachlauf sichern
  select coalesce(array_agg(t order by groesse desc), '{}'::text[]) into v_gross
    from (select t, pg_total_relation_size(format('public.%I', t)::regclass) as groesse
            from unnest(v_tabellen) t
           where to_regclass(format('public.%I', t)) is not null
             and pg_total_relation_size(format('public.%I', t)::regclass) >= 2 * 1024 * 1024
           order by 2 desc limit 15) g;
  select coalesce(array_agg(t order by t), '{}'::text[]) into v_stoss from unnest(v_tabellen) t where t <> all(v_gross);

  while i <= cardinality(v_stoss) loop
    select net.http_post(
      url:='https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-db-backup-worker',
      body:=jsonb_build_object('mode','backup','backup_set',v_set::text,'expected_total',v_total,'tables',to_jsonb(v_stoss[i:i+24])),
      headers:=jsonb_build_object('Content-Type','application/json','x-kc-mirror-token',v_token), timeout_milliseconds:=60000) into v_req;
    v_reqs := v_reqs || to_jsonb(v_req);
    i := i + 25;
  end loop;

  insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
  values('info','immutable_backup_dispatched','Daily immutable Neon backup dispatched',jsonb_build_object('backup_set',v_set,'tables',v_total,'requests',v_reqs,'deferred',to_jsonb(v_zurueck),'spaeter',to_jsonb(v_gross)));
  return jsonb_build_object('backup_set',v_set,'tables',v_total,'request_ids',v_reqs,'deferred',to_jsonb(v_zurueck),'spaeter',to_jsonb(v_gross));
end $function$;

create or replace function public.kc_db_backup_nachholen()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'vault', 'net'
as $function$
declare
  v_token text;
  v_satz record;
  v_fehlend text[];
  v_versuche int;
  v_paket text[];
  v_req bigint;
  v_reqs jsonb;
  v_geplant boolean;
  v_ergebnis jsonb := '[]'::jsonb;
  v_paketgroesse constant int := 5;
  v_max_pakete constant int := 3;
  v_max_versuche constant int := 8;
  i int;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name='kc_db_mirror_worker_token' limit 1;
  if v_token is null then raise exception 'backup worker token unavailable'; end if;

  for v_satz in
    select a.metadata->>'backup_set' as satz, a.happened_at, coalesce(a.metadata->'spaeter', '[]'::jsonb) as spaeter
      from public.kc_db_mirror_audit a
     where a.action = 'immutable_backup_dispatched'
       and a.happened_at > now() - interval '20 hours'
       and a.happened_at < now() - interval '5 minutes'
     order by a.happened_at desc
  loop
    if exists (select 1 from public.kc_db_mirror_audit n
                where n.action in ('backup_nachgeholt','backup_spaeter_gesichert') and n.metadata->>'backup_set' = v_satz.satz
                  and n.happened_at > now() - interval '5 minutes') then
      continue;
    end if;

    select array_agg(tr.table_name order by tr.table_name) into v_fehlend
      from public.kc_db_mirror_table_rules tr
     where tr.backup_enabled and tr.mirror_enabled and tr.sensitivity <> 'secret'
       and not exists (select 1 from public.kc_db_mirror_runs r
                        where r.run_type = 'backup' and r.status = 'ok'
                          and r.started_at > v_satz.happened_at - interval '1 minute'
                          and r.metrics->>'backup_set' = v_satz.satz
                          and r.metrics->>'table' = tr.table_name);

    if v_fehlend is null then continue; end if;

    select count(*) into v_versuche from public.kc_db_mirror_audit n
     where n.action in ('backup_nachgeholt','backup_spaeter_gesichert','backup_nachholen_aufgegeben') and n.metadata->>'backup_set' = v_satz.satz;

    if v_versuche >= v_max_versuche then
      if not exists (select 1 from public.kc_db_mirror_audit n where n.action = 'backup_nachholen_aufgegeben' and n.metadata->>'backup_set' = v_satz.satz) then
        insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
        values('critical','backup_nachholen_aufgegeben','Backup-Satz nach mehreren Nachhol-Versuchen unvollstaendig',
               jsonb_build_object('backup_set',v_satz.satz,'missing',to_jsonb(v_fehlend)));
      end if;
      continue;
    end if;

    -- KICC-F-105: erster Lauf, und es fehlen nur die bewusst spaeter gesicherten grossen Tabellen -> geplanter Schritt
    v_geplant := v_versuche = 0 and jsonb_array_length(v_satz.spaeter) > 0
                 and not exists (select 1 from unnest(v_fehlend) f where not (v_satz.spaeter ? f));

    v_reqs := '[]'::jsonb;
    i := 1;
    while i <= least(cardinality(v_fehlend), v_paketgroesse * v_max_pakete) loop
      v_paket := v_fehlend[i:least(i + v_paketgroesse - 1, v_paketgroesse * v_max_pakete)];
      select net.http_post(
        url:='https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-db-backup-worker',
        body:=jsonb_build_object('mode','backup','backup_set',v_satz.satz,'tables',to_jsonb(v_paket)),
        headers:=jsonb_build_object('Content-Type','application/json','x-kc-mirror-token',v_token),
        timeout_milliseconds:=120000) into v_req;
      v_reqs := v_reqs || to_jsonb(v_req);
      i := i + v_paketgroesse;
    end loop;

    insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
    values(case when v_geplant then 'info' else 'warning' end,
           case when v_geplant then 'backup_spaeter_gesichert' else 'backup_nachgeholt' end,
           case when v_geplant then 'Grosse Tabellen wie geplant im ruhigen Nachlauf gesichert' else 'Fehlende Tabellen in laufenden Backup-Satz nachgeladen' end,
           jsonb_build_object('backup_set',v_satz.satz,'missing',to_jsonb(v_fehlend),'missing_count',cardinality(v_fehlend),
                              'requests',v_reqs,'versuch',v_versuche + 1,'geplant',v_geplant));
    v_ergebnis := v_ergebnis || jsonb_build_object('backup_set',v_satz.satz,'missing_count',cardinality(v_fehlend),'requests',v_reqs,'geplant',v_geplant);
    exit;
  end loop;

  return jsonb_build_object('status', case when jsonb_array_length(v_ergebnis) = 0 then 'nichts_zu_tun' else 'nachgeholt' end, 'saetze', v_ergebnis);
end
$function$;

revoke all on function public.kc_db_backup_nachholen() from public, anon, authenticated;
