-- KICC-F-101: Backup-Saetze automatisch vervollstaendigen
-- Fehlende Tabellen eines laufenden Backup-Satzes (Worker-Startfehler, Zeitlimit)
-- werden in kleinen Paketen in denselben Satz nachgeladen. Der Worker ist
-- idempotent (on conflict do nothing) und schliesst den Satz selbst ab,
-- sobald alle Registry-Tabellen vorhanden sind (danach Restore-Test).
-- Ruecknahme: select cron.unschedule('kc-neon-backup-nachholen');
--             drop function public.kc_db_backup_nachholen();

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
  v_ergebnis jsonb := '[]'::jsonb;
  v_paketgroesse constant int := 5;
  v_max_pakete constant int := 3;
  v_max_versuche constant int := 8;
  i int;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name='kc_db_mirror_worker_token' limit 1;
  if v_token is null then raise exception 'backup worker token unavailable'; end if;

  for v_satz in
    select a.metadata->>'backup_set' as satz, a.happened_at
      from public.kc_db_mirror_audit a
     where a.action = 'immutable_backup_dispatched'
       and a.happened_at > now() - interval '20 hours'
       and a.happened_at < now() - interval '5 minutes'
     order by a.happened_at desc
  loop
    -- nicht ueberlappen: letzter Nachhol-Versuch muss mind. 5 min her sein
    if exists (select 1 from public.kc_db_mirror_audit n
                where n.action = 'backup_nachgeholt' and n.metadata->>'backup_set' = v_satz.satz
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
     where n.action in ('backup_nachgeholt','backup_nachholen_aufgegeben') and n.metadata->>'backup_set' = v_satz.satz;

    if v_versuche >= v_max_versuche then
      if not exists (select 1 from public.kc_db_mirror_audit n where n.action = 'backup_nachholen_aufgegeben' and n.metadata->>'backup_set' = v_satz.satz) then
        insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
        values('critical','backup_nachholen_aufgegeben','Backup-Satz nach mehreren Nachhol-Versuchen unvollstaendig',
               jsonb_build_object('backup_set',v_satz.satz,'missing',to_jsonb(v_fehlend)));
      end if;
      continue;
    end if;

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
    values('warning','backup_nachgeholt','Fehlende Tabellen in laufenden Backup-Satz nachgeladen',
           jsonb_build_object('backup_set',v_satz.satz,'missing',to_jsonb(v_fehlend),'missing_count',cardinality(v_fehlend),
                              'requests',v_reqs,'versuch',v_versuche + 1));
    v_ergebnis := v_ergebnis || jsonb_build_object('backup_set',v_satz.satz,'missing_count',cardinality(v_fehlend),'requests',v_reqs);
    -- pro Lauf nur einen Satz bearbeiten (geringe Last)
    exit;
  end loop;

  return jsonb_build_object('status', case when jsonb_array_length(v_ergebnis) = 0 then 'nichts_zu_tun' else 'nachgeholt' end, 'saetze', v_ergebnis);
end
$function$;

revoke all on function public.kc_db_backup_nachholen() from public, anon, authenticated;

select cron.schedule('kc-neon-backup-nachholen', '*/10 0-7 * * *', 'select public.kc_db_backup_nachholen();');
