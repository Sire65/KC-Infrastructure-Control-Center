-- Wunschpläne aus dem Club-App-Eingang als wishes.txt-Zeilen (Name|Datum|Art|Zone|von|bis).
-- In Supabase (Projekt ptblnpiroqftcvlsrhac) ausführen, Ergebnis als wishes.txt speichern. NICHT ins Repo legen (personenbezogen).
select string_agg(line, E'\n' order by line) from (
 select split_part(p.display_name,' ',1)||' '||left(split_part(p.display_name,' ',2),1)||'|'||(e->>'date')||'|'||left(e->>'wishType',4)||'|'||(e->>'wishZone')||'|'||(e->>'start')||'|'||(e->>'end') line
 from public.kc_dp_wish_inbox w join public.kc_core_people p on p.person_id=w.person_id and p.org_id=w.org_id, jsonb_array_elements(w.entries) e
 where w.event_id='KC-WM-2026') x;
