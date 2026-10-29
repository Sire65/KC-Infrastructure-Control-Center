-- KICC-F-112 (Wunsch Hansi 29.10.2026 „Ja bau beides ein“): Neon-Archiv behält wieder bis zu 14 Sätze (7 Tage + 4 Wochen + 3 Monate)
-- statt 10 (7 + 2 + 1, KC-NEON-PRUEFUNG 26.10.). Neon kostenlos jetzt 1 GB je Projekt (Changelog 02.10.2026).
-- Messung 29.10.: Datenbank 413 MB, Archiv 341 MB in 9 Sätzen, neuester Satz 32,5 MB → Prognose mit 14 Sätzen ≈ 620 MB (60 %).
-- Sicherung gegen Wachstum: Ist die Datenbank größer als 800 MiB, rechnet der Plan von selbst mit höchstens 2 Wochen- und
-- 1 Monatssatz (wie bisher) – die 7 Tagessätze und der neueste geprüfte Satz bleiben immer. Kein Löschen außerhalb des Plans,
-- der Schutz-Trigger bleibt unverändert. Rückweg: update public.kc_backup_retention_policy set wochen = 2, monate = 1 where id = 'primary';
-- (die Plan-Funktion darf bleiben, sie ändert ohne Platzmangel nichts gegenüber der vorigen Fassung).

create or replace function public.kc_backup_retention_plan()
 returns table(backup_set uuid, started_at timestamp with time zone, status text, table_count integer, aktion text, grund text)
 language sql
 stable
 set search_path to 'public'
as $function$
  with p0 as (select * from public.kc_backup_retention_policy where id = 'primary'),
  -- KICC-F-112: bei knappem Platz (> 800 MiB) höchstens 2 Wochen-/1 Monatssatz
  p as (select p0.tage,
               case when pg_database_size(current_database()) > 800 * 1048576 then least(p0.wochen, 2) else p0.wochen end as wochen,
               case when pg_database_size(current_database()) > 800 * 1048576 then least(p0.monate, 1) else p0.monate end as monate
          from p0),
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
$function$;

update public.kc_backup_retention_policy set wochen = 4, monate = 3, updated_at = now() where id = 'primary';
