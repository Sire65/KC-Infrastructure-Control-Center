-- 15.10.2026: Bereichsbeschriftung im Spiegel-/Backup-Register korrigiert (Freigabe Betreiber).
-- KC-Verwaltung (interner Name "KC_MANAGER") und PC Manager (Kassen) sind zwei Programme.
-- Verwaltung: Speicher, Mitgliedschaften, Schutz/Protokoll, Abgleich, Diagnose.
-- PC Manager: Artikel, Rezepte, Ausgabematerial, Produktion, Lager, Kassen-Live-Daten.
-- Nur die Spalte `area` (Beschriftung) aendert sich; Spiegel/Backup/Einstufung bleiben unveraendert.

update public.kc_db_mirror_table_rules set area = 'PC Manager'
 where table_name ~ '^kc_manager_(article|recipe|serving|production|inventory|stock)' or table_name like 'kc_pos_%';

update public.kc_db_mirror_table_rules set area = 'KC-Verwaltung'
 where table_name like 'kc_manager_%' and table_name !~ '^kc_manager_(article|recipe|serving|production|inventory|stock)';

-- Automatische Aufnahme: neue kc_manager_*-Tabellen nach demselben Schema beschriften.
do $$
declare d text;
begin
  d := pg_get_functiondef('kc_internal.kc_db_mirror_abdeckung_check()'::regprocedure);
  if position($q$when t like 'kc_manager_%' then 'PC Manager'$q$ in d) = 0 then
    raise exception 'Muster in kc_db_mirror_abdeckung_check nicht gefunden';
  end if;
  d := replace(d, $q$when t like 'kc_manager_%' then 'PC Manager'$q$,
    $q$when t ~ '^kc_manager_(article|recipe|serving|production|inventory|stock)' or t like 'kc_pos_%' then 'PC Manager' when t like 'kc_manager_%' then 'KC-Verwaltung'$q$);
  execute d;
end $$;

insert into public.kc_db_mirror_audit(severity, action, detail, metadata)
values ('info', 'mirror_bereiche_korrigiert',
        'Bereiche KC-Verwaltung und PC Manager im Spiegel-Register getrennt (nur Beschriftung, Freigabe Betreiber 15.10.2026)',
        jsonb_build_object('verwaltung', 'kc_manager_* ohne Artikel/Rezepte/Lager', 'pc_manager', 'Artikel, Rezepte, Ausgabematerial, Produktion, Lager, kc_pos_*'));
