-- KICC-F-104: Aufraeumregel fuer wachsende Protokoll-Tabellen (Auftrag Betreiber 15.10.2026)
-- Anlass: Jeder taegliche Backup-Satz enthaelt diese Tabellen komplett; ohne Aufraeumen wachsen Datenbank und Backups stetig.
--   * kicc_program_flow_events: Messwerte des Programm-Datenflusses (KICC) – nach 30 Tagen loeschen.
--     (Die vorhandene Funktion kicc_prune_program_flow_events() mit 15 Minuten war nie eingeplant und bleibt ungenutzt.)
--     Einmal-Codes kicc_program_flow_nonces nach 1 Tag.
--   * kc_communication_requests: Versandauftraege nach 180 Tagen, nur abgeschlossene (Status gesendet/angezeigt/
--     geoeffnet/bestaetigt/zugestellt/abgebrochen/fehlgeschlagen). Zustellmeldungen (kc_communication_delivery_events)
--     gehen per ON DELETE CASCADE mit. Offene oder wartende Auftraege bleiben immer.
-- Nicht angefasst:
--   * kc_club_protokoll: hat eine eigene Regel in der Club-App (Laerm 60 Tage, sonst 365 Tage, max. 50.000 Zeilen).
--   * kc_dp_sync_operations: Abgleich-Protokoll von DP2; Geraete holen Aenderungen ab einer Folgenummer nach.
--     Loeschen koennte lange offline gewesene Geraete stoeren – erst mit DP2 klaeren.
-- Je Lauf hoechstens 5000 Zeilen je Tabelle. Ergebnis im Audit (kc_db_mirror_audit, action protokolle_aufgeraeumt).
-- Ruecknahme: select cron.unschedule('kc-protokolle-aufraeumen'); drop function kc_internal.kc_protokolle_aufraeumen();

create or replace function kc_internal.kc_protokolle_aufraeumen()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
set statement_timeout to '60s'
as $function$
declare
  v_flow int := 0; v_nonce int := 0; v_req int := 0; v_res jsonb;
begin
  delete from public.kicc_program_flow_events
   where id in (select id from public.kicc_program_flow_events where received_at < now() - interval '30 days' limit 5000);
  get diagnostics v_flow = row_count;

  delete from public.kicc_program_flow_nonces where created_at < now() - interval '1 day';
  get diagnostics v_nonce = row_count;

  delete from public.kc_communication_requests
   where id in (select id from public.kc_communication_requests
                 where created_at < now() - interval '180 days'
                   and status in ('sent','delivered','displayed','opened','acknowledged','cancelled','failed','dead_lettered')
                 limit 5000);
  get diagnostics v_req = row_count;

  v_res := jsonb_build_object('kicc_program_flow_events', v_flow, 'kicc_program_flow_nonces', v_nonce,
                              'kc_communication_requests', v_req,
                              'regel', jsonb_build_object('flow_tage', 30, 'nonce_tage', 1, 'versand_tage', 180));
  if v_flow + v_nonce + v_req > 0 then
    insert into public.kc_db_mirror_audit(severity, action, detail, metadata)
    values ('info', 'protokolle_aufgeraeumt',
            format('Protokolle aufgeräumt: %s Datenfluss-Messwerte (> 30 Tage), %s Einmal-Codes, %s Versandaufträge (> 180 Tage)', v_flow, v_nonce, v_req),
            v_res);
  end if;
  return v_res;
end
$function$;

revoke all on function kc_internal.kc_protokolle_aufraeumen() from public, anon, authenticated;

select cron.schedule('kc-protokolle-aufraeumen', '35 3 * * *', 'select kc_internal.kc_protokolle_aufraeumen();');
