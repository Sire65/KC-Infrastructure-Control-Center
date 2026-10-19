-- KICC-F-110 (Wunsch Hansi 19.10.2026 „Ja so machen“): Lastwächter kennt Club-Aktivität als geplante Ursache.
-- Anlass: Meldung 18:33 Uhr (16.423 SQL-Aufrufe / 15 Min., „Ursache unbekannt“) – tatsächlich: Protokoll veröffentlicht
-- (Benachrichtigung an 14 Mitglieder), Anklopfen + Live-Chat mit zwei Mitgliedern, App-Update. Wie Notfall-Paket / neue Version gilt jetzt:
--   rundnachricht: Veröffentlichung oder Versand an >= 5 Empfänger (details.versand.gesendet) – auch 15 Min. vor dem Messfenster,
--                  weil die Empfänger danach die App öffnen;
--   live_chat:     Anklopfen bzw. angenommenes Anklopfen oder >= 3 gesendete Nachrichten im Fenster.
-- Gebremst (keine Mail) wird ROT weiter nur unter 40.000 Aufrufen und wenn nicht schon die zwei Messungen davor auffällig waren
-- (KICC-F-106). Ab 40.000 oder bei anhaltender Last kommt die Meldung wie bisher.
-- Rücknahme: Fassungen aus kc-traffic-guard-nach-update.sql (ursache_merken) und dem Stand vor KICC-F-110 (ursache) einspielen.

create or replace function public.kc_traffic_guard_ursache(p_seit timestamp with time zone, p_wert numeric, p_basis numeric, p_bis timestamp with time zone default null::timestamp with time zone)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
DECLARE
  v_np int := 0;
  v_np_abfragen bigint := 0;
  v_np_grund text;
  v_starts int := 0;
  v_alt int := 0;
  v_backup int := 0;
  v_restore int := 0;
  v_rund int := 0;
  v_rund_empf int := 0;
  v_klopf int := 0;
  v_chat int := 0;
  v_tageswechsel boolean;
  v_teile text[] := '{}';
  v_quellen text[] := '{}';
  v_schaetzung numeric := 0;
  v_anteil numeric;
  v_geplant boolean := false;
  v_sonst text;
  v_text text;
  v_bis timestamptz := coalesce(p_bis, pg_catalog.now());
BEGIN
  SELECT count(*), coalesce(sum(nullif(p.details->>'db_abfragen','')::bigint),0), pg_catalog.string_agg(DISTINCT p.details->>'grund', ',')
    INTO v_np, v_np_abfragen, v_np_grund
    FROM public.kc_club_protokoll p
   WHERE p.aktion = 'notpaket_gebaut' AND p.zeit BETWEEN p_seit AND v_bis;
  SELECT count(*) FILTER (WHERE p.aktion = 'app_start'),
         count(*) FILTER (WHERE p.aktion IN ('fehler_alte_version','aenderungen_angesehen'))
    INTO v_starts, v_alt
    FROM public.kc_club_protokoll p
   WHERE p.zeit BETWEEN p_seit AND v_bis AND p.aktion IN ('app_start','fehler_alte_version','aenderungen_angesehen');
  SELECT count(*) FILTER (WHERE r.run_type IN ('backup','snapshot')), count(*) FILTER (WHERE r.run_type = 'restore_test')
    INTO v_backup, v_restore
    FROM public.kc_db_mirror_runs r
   WHERE r.started_at BETWEEN p_seit AND v_bis AND r.run_type IN ('backup','snapshot','restore_test');
  -- KICC-F-110: Rundnachrichten (auch kurz vor dem Fenster – die Empfänger öffnen danach die App) und Live-Chats
  SELECT count(*), coalesce(sum(nullif(p.details->'versand'->>'gesendet','')::int), 0)
    INTO v_rund, v_rund_empf
    FROM public.kc_club_protokoll p
   WHERE p.zeit BETWEEN p_seit - interval '15 minutes' AND v_bis
     AND (p.aktion LIKE '%veroeffentlicht' OR coalesce(nullif(p.details->'versand'->>'gesendet','')::int, 0) >= 5);
  SELECT count(*) FILTER (WHERE p.aktion IN ('angeklopft','anklopfen_angenommen')), count(*) FILTER (WHERE p.aktion = 'nachricht_gesendet')
    INTO v_klopf, v_chat
    FROM public.kc_club_protokoll p
   WHERE p.zeit BETWEEN p_seit AND v_bis AND p.aktion IN ('angeklopft','anklopfen_angenommen','nachricht_gesendet');
  v_tageswechsel := (v_bis AT TIME ZONE 'Europe/Berlin')::time < time '00:25';

  IF v_np > 0 THEN
    v_geplant := true;
    v_quellen := v_quellen || 'notpaket'::text;
    v_schaetzung := v_schaetzung + v_np_abfragen * 2;
    v_teile := v_teile || ('Neubau Notfall-Paket ('||v_np||'x, '||public.kc_traffic_guard_zahl(v_np_abfragen)||' Abfragen'
               ||CASE WHEN v_np_grund IS NOT NULL THEN ', '||pg_catalog.replace(v_np_grund,'_',' ') ELSE '' END||')');
  END IF;
  IF v_starts >= 5 OR v_alt >= 2 THEN
    v_geplant := true;
    v_quellen := v_quellen || 'neue_version'::text;
    v_schaetzung := v_schaetzung + v_starts * 140;
    v_teile := v_teile || (v_starts||' App-Starts'||CASE WHEN v_alt > 0 THEN ' nach neuer Version' ELSE '' END);
  ELSIF v_starts > 0 THEN
    v_schaetzung := v_schaetzung + v_starts * 140;
  END IF;
  IF v_rund > 0 THEN
    v_geplant := true;
    v_quellen := v_quellen || 'rundnachricht'::text;
    v_teile := v_teile || ('Veroeffentlichung/Rundnachricht'||CASE WHEN v_rund_empf > 0 THEN ' an '||v_rund_empf||' Mitglieder' ELSE '' END);
  END IF;
  IF v_klopf > 0 OR v_chat >= 3 THEN
    v_geplant := true;
    v_quellen := v_quellen || 'live_chat'::text;
    v_teile := v_teile || ('Live-Chat'||CASE WHEN v_klopf > 0 THEN ' mit Anklopfen' ELSE '' END||' ('||v_chat||' Nachrichten)');
  END IF;
  IF v_backup >= 5 OR v_restore > 0 THEN
    v_geplant := true;
    v_quellen := v_quellen || 'datensicherung'::text;
    v_teile := v_teile || ('Datensicherung ('||v_backup||' Tabellenlaeufe'||CASE WHEN v_restore > 0 THEN ', Ruecklesetest' ELSE '' END||')');
  END IF;
  IF v_tageswechsel AND v_np = 0 THEN
    v_geplant := true;
    v_quellen := v_quellen || 'tageswechsel'::text;
    v_teile := v_teile || 'Tageswechsel (naechtliche Aufgaben)'::text;
  END IF;

  IF v_schaetzung > 0 AND p_wert IS NOT NULL AND p_basis IS NOT NULL AND p_wert > p_basis THEN
    v_anteil := LEAST(1, pg_catalog.round(v_schaetzung / (p_wert - p_basis), 2));
  END IF;

  IF NOT v_geplant THEN
    SELECT pg_catalog.string_agg(z.aktion||' '||z.c, ', ' ORDER BY z.c DESC) INTO v_sonst
      FROM (SELECT p.aktion, count(*) c FROM public.kc_club_protokoll p
             WHERE p.zeit BETWEEN p_seit AND v_bis AND p.aktion NOT LIKE 'spur%' AND p.aktion NOT LIKE 'diagnose%'
             GROUP BY p.aktion ORDER BY count(*) DESC LIMIT 3) z;
    v_text := 'Ursache unbekannt – bitte pruefen.'||CASE WHEN v_sonst IS NOT NULL THEN ' Haeufigste Club-Aktionen: '||v_sonst||'.' ELSE '' END;
  ELSE
    v_text := 'Vermutliche Ursache (geplant): '||pg_catalog.array_to_string(v_teile, '; ')
              ||CASE WHEN v_anteil IS NOT NULL THEN ', erklaert etwa '||(v_anteil*100)::int||' % der Mehrlast' ELSE '' END||'.';
  END IF;

  RETURN pg_catalog.jsonb_build_object('geplant', v_geplant, 'anteil', v_anteil, 'quellen', pg_catalog.to_jsonb(v_quellen),
    'text', v_text, 'seit', p_seit, 'bis', v_bis);
END;
$function$;

-- KICC-F-110: Bremse für ROT kennt die neuen Quellen (sonst unverändert wie KICC-F-106)
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
    -- Ergebniszeilen-ROT wird nie gebremst.
    br := s.level = 'warning' AND (g OR coalesce((v.ursache->>'geplant')::boolean, false));
    v_rows := pg_catalog.jsonb_build_object('geplant', g, 'gebremst', br, 'text', u->>'text',
      'detail', s.detail || CASE WHEN s.ursache IS NULL THEN ' ' || (u->>'text') ELSE '' END);
  END IF;
  RETURN pg_catalog.jsonb_build_object('last', v_last, 'zeilen', v_rows);
END;
$function$;
