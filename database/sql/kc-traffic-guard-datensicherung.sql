-- KICC-F-113 (Wunsch Hansi 01.11.2026 „Ja mach alle drei“): Lastwächter meldet die geplante nächtliche Datensicherung nicht mehr als ROT.
-- Anlass: jede Nacht ca. 02:03 Uhr „KRITISCHE Datenbanklast … Vermutliche Ursache (geplant): Datensicherung (20 Tabellenläufe)“ – seit 29.10. ROT
-- (35.000–37.000 Ergebniszeilen / 15 Min.), weil die Sicherung mit der Datenbank wächst. Ursache war jedes Mal richtig erkannt.
-- Neu NUR für Ergebniszeilen-ROT: gebremst, wenn die EINZIGE erkannte Ursache „datensicherung“ ist und weniger als 80.000 Zeilen / 15 Min.
-- Alles andere bleibt: ROT aus anderer Ursache oder ab 80.000 Zeilen geht immer raus; Aufruf-Last (calls) unverändert (KICC-F-106/110).
-- Rückweg: Zeile „br := …“ im zweiten Block wieder auf  s.level = 'warning' AND (g OR coalesce((v.ursache->>'geplant')::boolean, false))  setzen.

create or replace function public.kc_traffic_guard_ursache_merken(p_sample_id bigint, p_row_sample_id bigint)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
DECLARE
  s record; v record; u jsonb; g boolean; br boolean; v_vorher int := 0;
  v_last jsonb := NULL; v_rows jsonb := NULL;
BEGIN
  SELECT * INTO s FROM public.kc_traffic_guard_samples WHERE id = p_sample_id;
  IF s.id IS NOT NULL AND s.level IN ('warning','critical') THEN
    SELECT * INTO v FROM public.kc_traffic_guard_samples WHERE measured_at < s.measured_at ORDER BY measured_at DESC, id DESC LIMIT 1;
    u := coalesce(s.ursache, public.kc_traffic_guard_ursache(coalesce(v.measured_at, s.measured_at - interval '15 minutes') - interval '2 minutes', s.calls_15m, s.baseline_15m, s.measured_at));
    IF s.ursache IS NULL THEN
      UPDATE public.kc_traffic_guard_samples SET ursache = u, detail = s.detail || ' ' || (u->>'text') WHERE id = s.id;
    END IF;
    g := coalesce((u->>'geplant')::boolean, false);
    SELECT count(*) INTO v_vorher FROM (
      SELECT x.level FROM public.kc_traffic_guard_samples x
       WHERE x.measured_at < s.measured_at AND x.measured_at > s.measured_at - interval '40 minutes'
       ORDER BY x.measured_at DESC, x.id DESC LIMIT 2) z
     WHERE z.level IN ('warning','critical');
    br := CASE WHEN s.level = 'critical' THEN
            g AND s.calls_15m < 40000 AND (
              coalesce((u->>'anteil')::numeric, 0) >= 0.8
              OR (v_vorher < 2 AND (coalesce(u->'quellen', '[]'::jsonb) ?| array['neue_version','notpaket','rundnachricht','live_chat'])))
          ELSE g OR coalesce((v.ursache->>'geplant')::boolean, false) END;
    v_last := pg_catalog.jsonb_build_object('geplant', g, 'gebremst', br, 'text', u->>'text', 'vorher_auffaellig', v_vorher,
      'detail', s.detail || CASE WHEN s.ursache IS NULL THEN ' ' || (u->>'text') ELSE '' END);
  END IF;

  SELECT * INTO s FROM public.kc_traffic_guard_row_samples WHERE id = p_row_sample_id;
  IF s.id IS NOT NULL AND s.level IN ('warning','critical') THEN
    SELECT * INTO v FROM public.kc_traffic_guard_row_samples WHERE measured_at < s.measured_at ORDER BY measured_at DESC, id DESC LIMIT 1;
    u := coalesce(s.ursache, public.kc_traffic_guard_ursache(coalesce(v.measured_at, s.measured_at - interval '15 minutes') - interval '2 minutes', NULL, NULL, s.measured_at));
    IF s.ursache IS NULL THEN
      UPDATE public.kc_traffic_guard_row_samples SET ursache = u, detail = s.detail || ' ' || (u->>'text') WHERE id = s.id;
    END IF;
    g := coalesce((u->>'geplant')::boolean, false);
    -- KICC-F-113: Ergebniszeilen-ROT nur gebremst, wenn allein die geplante Datensicherung die Ursache ist (unter 80.000 Zeilen / 15 Min.)
    br := (s.level = 'warning' AND (g OR coalesce((v.ursache->>'geplant')::boolean, false)))
       OR (s.level = 'critical' AND g AND coalesce(s.rows_15m, 0) < 80000 AND coalesce(u->'quellen', '[]'::jsonb) = '["datensicherung"]'::jsonb);
    v_rows := pg_catalog.jsonb_build_object('geplant', g, 'gebremst', br, 'text', u->>'text',
      'detail', s.detail || CASE WHEN s.ursache IS NULL THEN ' ' || (u->>'text') ELSE '' END);
  END IF;
  RETURN pg_catalog.jsonb_build_object('last', v_last, 'zeilen', v_rows);
END;
$function$;
