-- KICC-F-107 (Wunsch Hansi 18.10.2026: „nur geänderte Daten spiegeln oder sichern“ – Supabase-Egress unter 5 GB):
-- 1) kc_db_mirror_fingerprint: nur Zeilenzahl + Prüfsumme einer Tabelle (gleiche Berechnung wie kc_db_mirror_snapshot,
--    inklusive Schwärzung) – die Daten verlassen die Datenbank nicht. Spiegel- und Backup-Arbeiter fragen zuerst diesen
--    Fingerabdruck und holen die Tabelle nur ab, wenn sie sich geändert hat.
-- 2) kc_db_mirror_snapshot_text: wie kc_db_mirror_snapshot, aber ohne das Feld „rows“ – bisher kam jede Tabelle doppelt
--    (rows + payload_text) über die Leitung, genutzt wird nur payload_text.
-- Beide nur für service_role. Rücknahme: drop function public.kc_db_mirror_fingerprint(text), public.kc_db_mirror_snapshot_text(text);
create or replace function public.kc_db_mirror_snapshot_text(p_table_name text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
begin
  return public.kc_db_mirror_snapshot(p_table_name) - 'rows';
end $function$;

create or replace function public.kc_db_mirror_fingerprint(p_table_name text)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare s jsonb;
begin
  s := public.kc_db_mirror_snapshot(p_table_name);
  return jsonb_build_object('table', p_table_name, 'row_count', s->'row_count', 'content_hash', s->'content_hash');
end $function$;

revoke all on function public.kc_db_mirror_snapshot_text(text) from public, anon, authenticated;
revoke all on function public.kc_db_mirror_fingerprint(text) from public, anon, authenticated;
grant execute on function public.kc_db_mirror_snapshot_text(text) to service_role;
grant execute on function public.kc_db_mirror_fingerprint(text) to service_role;
