-- KICC-F-106 (Wunsch Hansi 18.10.2026, Option 2): Lastwaechter warnt in der halben Stunde nach einem Update
-- nur noch, wenn die Last ungewoehnlich hoch bleibt.
-- Anlass: Mails 18.10. 05:48 (14.653) und 07:33 (26.309 SQL-Aufrufe / 15 Min.) – beide direkt nach Club-App-Updates
-- (alle Apps laden neu) bzw. erzwungenem Neubau des Notfall-Pakets. Die Bremse aus Traffic Guard v3 griff bei ROT
-- nur, wenn die bekannte Ursache >= 80 % der Mehrlast erklaert (05:48: 3 %, 07:33: 77 %) – App-Neustarts werden
-- in der Schaetzung zu niedrig angesetzt.
-- Neu fuer ROT (critical): zusaetzlich gebremst, wenn die Ursache „neue Version“ oder „Notfall-Paket“ ist,
-- die Last unter 40.000 / 15 Min. liegt und NICHT schon die beiden vorigen Messungen (= 30 Min.) auffaellig waren.
-- Bleibt die Last also laenger als eine halbe Stunde hoch, geht die Meldung raus. Ab 40.000 immer Meldung.
-- Unveraendert: GELB-Bremse, Ergebniszeilen-ROT wird nie gebremst, Ausfall dieses Schritts = alte Meldung.
-- Ruecknahme: vorherige Fassung (Bedingung nur anteil >= 0.8) einspielen.

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
    -- KICC-F-106: wie viele der beiden vorigen Messungen (30 Min.) waren schon auffaellig?
    SELECT count(*) INTO v_vorher FROM (
      SELECT x.level FROM public.kc_traffic_guard_samples x
       WHERE x.measured_at < s.measured_at AND x.measured_at > s.measured_at - interval '40 minutes'
       ORDER BY x.measured_at DESC, x.id DESC LIMIT 2) z
     WHERE z.level IN ('warning','critical');
    br := CASE WHEN s.level = 'critical' THEN
            g AND s.calls_15m < 40000 AND (
              coalesce((u->>'anteil')::numeric, 0) >= 0.8
              OR (v_vorher < 2 AND (coalesce(u->'quellen', '[]'::jsonb) ?| array['neue_version','notpaket'])))
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
    -- Ergebniszeilen-ROT wird nie gebremst.
    br := s.level = 'warning' AND (g OR coalesce((v.ursache->>'geplant')::boolean, false));
    v_rows := pg_catalog.jsonb_build_object('geplant', g, 'gebremst', br, 'text', u->>'text',
      'detail', s.detail || CASE WHEN s.ursache IS NULL THEN ' ' || (u->>'text') ELSE '' END);
  END IF;
  RETURN pg_catalog.jsonb_build_object('last', v_last, 'zeilen', v_rows);
END;
$function$;
