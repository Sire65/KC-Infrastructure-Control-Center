-- KICC-F-103: Aufbewahrungsregel fuer das Neon-Backup-Archiv (Projekt purple-hat-23047492, KC Core Mirror)
-- Anlass: Branch-Limit 1 GiB, Archiv ohne Aufbewahrung (Stand 15.10.2026: 322 MB, +18–36 MB/Tag).
-- Regel: behalten werden
--   * alle Saetze der letzten `tage` Tage (Standard 7, harte Untergrenze 7 Tage im Trigger),
--   * der neueste geprueft-ok Satz (immer),
--   * je Kalenderwoche der neueste ok-Satz der letzten `wochen` Wochen (Standard 4),
--   * je Monat der neueste ok-Satz der letzten `monate` Monate (Standard 3).
-- Stand 26.10.2026 (KC-NEON-PRUEFUNG, Freigabe Hansi „Setze B auch um“): im Betrieb wochen = 2, monate = 1 (vorher 4/3) – Spiegel bleibt
--   unter 1 GiB; per update auf kc_backup_retention_policy gesetzt. Rückweg: update … set wochen = 4, monate = 3 where id = 'primary';
-- Variante B, Freigabe Betreiber 15.10.2026. Taegliche Saetze ueber 14 Tage haelt zusaetzlich die Frankfurt-Sicherung.
-- Alles andere (auch unvollstaendige running/error-Saetze ausserhalb der Tagesfrist) darf geloescht werden.
-- Loeschen nur, wenn kc_backup_retention_policy.aktiv = true; sonst nur Probelauf mit Protokoll.
-- Der Schutz-Trigger bleibt aktiv: DELETE ist nur innerhalb von kc_backup_retention_anwenden() fuer genau die
-- freigegebenen Saetze moeglich und nie fuer Saetze juenger als 7 Tage oder den neuesten ok-Satz.
-- Ruecknahme: urspruengliche kc_backup_block_mutation() einspielen (siehe Ende), Funktionen/Tabellen droppen.

create table if not exists public.kc_backup_retention_policy (
  id text primary key default 'primary',
  aktiv boolean not null default false,
  tage int not null default 7 check (tage >= 7),
  wochen int not null default 4 check (wochen >= 0),
  monate int not null default 3 check (monate >= 0),
  updated_at timestamptz not null default now()
);
insert into public.kc_backup_retention_policy(id) values ('primary') on conflict (id) do nothing;

create table if not exists public.kc_backup_retention_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  ausgefuehrt boolean not null,
  loeschen int not null,
  behalten int not null,
  bytes bigint not null,
  detail jsonb not null
);

create or replace function public.kc_backup_retention_plan()
returns table(backup_set uuid, started_at timestamptz, status text, table_count int, aktion text, grund text)
language sql stable set search_path to 'public' as $$
  with p as (select * from public.kc_backup_retention_policy where id = 'primary'),
  ok as (select b.backup_set, b.started_at from public.kc_backup_sets b where b.status = 'ok'),
  neuester as (select o.backup_set from ok o order by o.started_at desc limit 1),
  woche as (select distinct on (date_trunc('week', o.started_at)) o.backup_set from ok o, p
             where o.started_at > now() - make_interval(days => p.wochen * 7)
             order by date_trunc('week', o.started_at), o.started_at desc),
  monat as (select distinct on (date_trunc('month', o.started_at)) o.backup_set from ok o, p
             where o.started_at > now() - make_interval(months => p.monate)
             order by date_trunc('month', o.started_at), o.started_at desc)
  select b.backup_set, b.started_at, b.status, b.table_count,
    case when b.started_at > now() - make_interval(days => p.tage) or b.backup_set in (select backup_set from neuester)
              or b.backup_set in (select backup_set from woche) or b.backup_set in (select backup_set from monat)
         then 'behalten' else 'loeschen' end,
    case when b.started_at > now() - make_interval(days => p.tage) then 'letzte ' || p.tage || ' Tage'
         when b.backup_set in (select backup_set from neuester) then 'neuester geprüfter Satz'
         when b.backup_set in (select backup_set from woche) then 'Wochensatz'
         when b.backup_set in (select backup_set from monat) then 'Monatssatz'
         when b.status <> 'ok' then 'unvollständig/fehlerhaft, älter als ' || p.tage || ' Tage'
         else 'abgelaufen' end
  from public.kc_backup_sets b, p
  order by b.started_at;
$$;

create or replace function public.kc_backup_retention_anwenden(p_ausfuehren boolean default false)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_aktiv boolean; v_ids uuid[]; v_behalten int; v_bytes bigint; v_snaps bigint := 0; v_run boolean;
begin
  select aktiv into v_aktiv from public.kc_backup_retention_policy where id = 'primary';
  select coalesce(array_agg(r.backup_set order by r.started_at) filter (where r.aktion = 'loeschen'), '{}'),
         count(*) filter (where r.aktion = 'behalten')
    into v_ids, v_behalten from public.kc_backup_retention_plan() r;
  select coalesce(sum(pg_column_size(s.payload)), 0) into v_bytes from public.kc_backup_snapshots s where s.backup_set = any(v_ids);
  v_run := p_ausfuehren and coalesce(v_aktiv, false) and cardinality(v_ids) > 0;
  if v_run then
    perform set_config('kc.backup_retention', array_to_string(v_ids, ','), true);
    delete from public.kc_backup_verifications where backup_set = any(v_ids);
    delete from public.kc_backup_snapshots where backup_set = any(v_ids);
    get diagnostics v_snaps = row_count;
    delete from public.kc_backup_sets where backup_set = any(v_ids);
    perform set_config('kc.backup_retention', '', true);
  end if;
  insert into public.kc_backup_retention_log(ausgefuehrt, loeschen, behalten, bytes, detail)
  values (v_run, cardinality(v_ids), v_behalten, v_bytes,
          jsonb_build_object('sets', to_jsonb(v_ids), 'snapshots_geloescht', v_snaps, 'aktiv', coalesce(v_aktiv, false), 'angefordert', p_ausfuehren));
  return jsonb_build_object('ausgefuehrt', v_run, 'aktiv', coalesce(v_aktiv, false), 'loeschen', cardinality(v_ids),
                            'behalten', v_behalten, 'bytes', v_bytes, 'snapshots_geloescht', v_snaps);
end $$;

-- Schutz-Trigger: unveraendert bis auf den kontrollierten DELETE-Pfad der Aufbewahrungsregel.
create or replace function public.kc_backup_block_mutation()
returns trigger language plpgsql as $function$
BEGIN
  IF TG_OP='TRUNCATE' THEN RAISE EXCEPTION 'KC backup archive is immutable: TRUNCATE is not permitted on %', TG_TABLE_NAME USING ERRCODE='55000'; END IF;
  IF TG_TABLE_NAME='kc_backup_sets' AND TG_OP='UPDATE' THEN
    IF OLD.status='running' AND NEW.backup_set=OLD.backup_set AND NEW.started_at=OLD.started_at AND NEW.table_count>=OLD.table_count AND NEW.ok_count>=OLD.ok_count AND NEW.total_rows>=OLD.total_rows AND NEW.total_bytes>=OLD.total_bytes AND NEW.status IN ('running','ok','error') THEN RETURN NEW; END IF;
  END IF;
  -- KICC-F-103: nur ueber kc_backup_retention_anwenden(), nur freigegebene Saetze, nie juenger als 7 Tage, nie der neueste ok-Satz
  IF TG_OP='DELETE'
     AND OLD.backup_set::text = ANY(string_to_array(coalesce(current_setting('kc.backup_retention', true), ''), ','))
     AND EXISTS (SELECT 1 FROM public.kc_backup_sets s WHERE s.backup_set = OLD.backup_set AND s.started_at < now() - interval '7 days')
     AND OLD.backup_set IS DISTINCT FROM (SELECT s.backup_set FROM public.kc_backup_sets s WHERE s.status='ok' ORDER BY s.started_at DESC LIMIT 1)
  THEN RETURN OLD; END IF;
  RAISE EXCEPTION 'KC backup archive is immutable: % is not permitted on %', TG_OP, TG_TABLE_NAME USING ERRCODE='55000';
END; $function$;

-- Ruecknahme des Triggers (Originalfassung bis 15.10.2026):
-- CREATE OR REPLACE FUNCTION public.kc_backup_block_mutation() RETURNS trigger LANGUAGE plpgsql AS $function$ BEGIN IF TG_OP='TRUNCATE' THEN RAISE EXCEPTION 'KC backup archive is immutable: TRUNCATE is not permitted on %', TG_TABLE_NAME USING ERRCODE='55000'; END IF; IF TG_TABLE_NAME='kc_backup_sets' AND TG_OP='UPDATE' THEN IF OLD.status='running' AND NEW.backup_set=OLD.backup_set AND NEW.started_at=OLD.started_at AND NEW.table_count>=OLD.table_count AND NEW.ok_count>=OLD.ok_count AND NEW.total_rows>=OLD.total_rows AND NEW.total_bytes>=OLD.total_bytes AND NEW.status IN ('running','ok','error') THEN RETURN NEW; END IF; END IF; RAISE EXCEPTION 'KC backup archive is immutable: % is not permitted on %', TG_OP, TG_TABLE_NAME USING ERRCODE='55000'; END; $function$;
