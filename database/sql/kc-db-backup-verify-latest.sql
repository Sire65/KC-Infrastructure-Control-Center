-- KICC-F-102: Restore-Test-Cron (Job 51, 06:30 UTC) nur als Sicherheitsnetz.
-- Der Backup-Worker startet den Restore-Test selbst, sobald ein Satz vollstaendig ist. Der Cron prueft nur noch,
-- wenn der neueste Satz noch keinen bestandenen Restore-Test hat (Rueckgabe null = uebersprungen).
-- Ruecknahme: vorherige Fassung ohne den Block "bereits bestanden" einspielen.
create or replace function public.kc_db_backup_verify_latest()
returns bigint
language plpgsql
security definer
set search_path to 'public', 'vault', 'net'
as $function$
declare v_token text; v_request bigint; v_set uuid;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name='kc_db_mirror_worker_token' limit 1;
  if v_token is null then raise exception 'backup worker token unavailable'; end if;
  select nullif(metadata->>'backup_set','')::uuid into v_set from public.kc_db_mirror_audit
   where action='immutable_backup_dispatched' order by happened_at desc limit 1;
  if v_set is null then raise exception 'no dispatched backup set found'; end if;
  -- bereits bestanden: nichts zu tun
  if exists (select 1 from public.kc_db_mirror_runs
              where run_type='restore_test' and status='ok' and metrics->>'backup_set'=v_set::text) then
    return null;
  end if;
  select net.http_post(url:='https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-db-backup-verify-v2',
    body:=jsonb_build_object('backup_set',v_set::text),
    headers:=jsonb_build_object('Content-Type','application/json','x-kc-mirror-token',v_token),
    timeout_milliseconds:=150000) into v_request;
  return v_request;
end $function$;
