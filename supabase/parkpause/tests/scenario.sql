-- Szenario-Test gegen eine lokale Postgres mit Supabase-Stubs (auth.users, auth.uid(), Rollen).
-- Erwartung: Ende mit "ALLE TESTS BESTANDEN". Jede Abweichung bricht mit Fehler ab.
\set ON_ERROR_STOP 1
create or replace function t_as(u uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', coalesce(u::text, ''), false); end $$;
create or replace function t_expect_error(sql text, needle text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then
    if position(needle in sqlerrm) = 0 then raise exception 'Falsche Meldung: % (erwartet: %)', sqlerrm, needle; end if;
    return;
  end;
  raise exception 'Fehler erwartet, aber durchgelaufen: %', sql;
end $$;
grant execute on function t_as(uuid), t_expect_error(text, text) to authenticated;

-- Mitglieder wie pp-auth sie anlegt
insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000c'), ('00000000-0000-0000-0000-00000000000d');
insert into pp_profiles (id, pseudonym, is_admin) values
  ('00000000-0000-0000-0000-00000000000a', 'Admina', true), ('00000000-0000-0000-0000-00000000000b', 'Biber', false),
  ('00000000-0000-0000-0000-00000000000c', 'Coala', false);
-- d hat ein Konto, aber kein Profil (z. B. fremde Selbstregistrierung)

set role authenticated;
select t_as('00000000-0000-0000-0000-00000000000a');
select pp_admin_seed_layout();
do $$ begin if (select count(*) from pp_spots) <> 85 then raise exception '85 Plätze erwartet'; end if; end $$;
do $$ begin if (select pp_label(id) from pp_spots s where idx = 7 and room_id = (select r.id from pp_rooms r join pp_levels l on l.id = r.level_id where l.kz='U1' and r.kz='A')) <> 'U1A-07' then raise exception 'Label falsch'; end if; end $$;
-- Admin markiert ersten Platz als Festplatz
update pp_spots set type = 'fest', fest_label = 'Vorstand' where idx = 1 and room_id = (select r.id from pp_rooms r join pp_levels l on l.id = r.level_id where l.kz='U1' and r.kz='A');

-- Fremdes Konto ohne Profil sieht nichts
select t_as('00000000-0000-0000-0000-00000000000d');
do $$ begin if (select count(*) from pp_spots) <> 0 or (select count(*) from pp_profiles) <> 0 then raise exception 'Nicht-Mitglied sieht Daten'; end if; end $$;
select t_expect_error($$select pp_claim_spot((select id from pp_spots limit 1), pp_today())$$, 'anmelden');

-- B traegt seinen Platz U1A-02 ein
select t_as('00000000-0000-0000-0000-00000000000b');
create temp table ids as select
  (select s.id from pp_spots s join pp_rooms r on r.id=s.room_id join pp_levels l on l.id=r.level_id where l.kz='U1' and r.kz='A' and s.idx=2) s2,
  (select s.id from pp_spots s join pp_rooms r on r.id=s.room_id join pp_levels l on l.id=r.level_id where l.kz='U1' and r.kz='A' and s.idx=1) s1;
grant select on ids to authenticated;
select t_expect_error($$select pp_claim_spot((select s1 from ids), pp_today())$$, 'Festplatz');
select pp_claim_spot((select s2 from ids), pp_today() - 30);
-- C kann denselben Platz nicht nehmen
select t_as('00000000-0000-0000-0000-00000000000c');
select t_expect_error($$select pp_claim_spot((select s2 from ids), pp_today())$$, 'schon jemandem');
-- C kann nicht fuer fremden Platz freigeben
select t_expect_error($$select pp_release_add((select s2 from ids), pp_today(), pp_today()+5, null)$$, 'nicht Mieter');
-- Direktes Schreiben in Tabellen ist gesperrt
select t_expect_error($$insert into pp_owners (spot_id, user_id, ab) values ((select s2 from ids), auth.uid(), pp_today())$$, 'permission denied');
update pp_spots set type='gesperrt';
select t_as('00000000-0000-0000-0000-00000000000a');
do $$ begin if exists (select 1 from pp_spots where type='gesperrt') then raise exception 'Nicht-Admin konnte Plätze ändern'; end if; end $$;
select t_as('00000000-0000-0000-0000-00000000000c');

-- B gibt frei, inkl. geplanter Freigabe
select t_as('00000000-0000-0000-0000-00000000000b');
select pp_release_add((select s2 from ids), pp_today(), pp_today()+9, null);
select pp_release_add((select s2 from ids), pp_today()+20, pp_today()+30, pp_today()+5);
select t_expect_error($$select pp_release_add((select s2 from ids), pp_today()+5, pp_today()+12, null)$$, 'Überschneidet');

-- C fragt an
select t_as('00000000-0000-0000-0000-00000000000c');
select t_expect_error($$select pp_request((select s2 from ids), pp_today()+21, pp_today()+22, 'X-1', null)$$, 'nicht freigegeben');
select t_expect_error($$select pp_request((select s2 from ids), pp_today()+8, pp_today()+12, 'X-1', null)$$, 'nicht freigegeben');
select pp_request((select s2 from ids), pp_today(), pp_today()+3, 's-cc 1', 'gegen 7 Uhr');
select t_expect_error($$select pp_request((select s2 from ids), pp_today()+3, pp_today()+4, 'X', null)$$, 'schon einen Platz');
do $$ begin if (select count(*) from pp_res) <> 1 then raise exception 'C sieht eigene Anfrage nicht'; end if; end $$;
do $$ begin if (select status from pp_occupancy() limit 1) <> 'angefragt' then raise exception 'Belegung fehlt'; end if; end $$;

-- A (Admin, nicht Inhaber) sieht keine Einzelheiten der Reservierung, aber die Belegung
select t_as('00000000-0000-0000-0000-00000000000a');
do $$ begin if (select count(*) from pp_res) <> 0 then raise exception 'Dritter sieht Reservierung'; end if;
  if (select count(*) from pp_occupancy()) <> 1 then raise exception 'Belegung für Dritte fehlt'; end if;
  if (select count(*) from pp_notes) <> 0 then raise exception 'Dritter sieht fremde Mitteilungen'; end if;
  if (select count(*) from pp_private) <> 0 then raise exception 'Dritter sieht Kennzeichen'; end if; end $$;
select t_expect_error($$select pp_decide((select spot_id from pp_occupancy() limit 1), true)$$, 'gehört nicht');

-- B sieht Anfrage + Mitteilung und schaltet frei
select t_as('00000000-0000-0000-0000-00000000000b');
do $$ begin if (select count(*) from pp_notes where text like 'Coala möchte Platz U1A-02%') <> 1 then raise exception 'Mitteilung an Inhaber fehlt'; end if; end $$;
select pp_decide((select id from pp_res limit 1), true);
select t_expect_error($$select pp_decide((select id from pp_res limit 1), true)$$, 'schon entschieden');
-- Freigabe pausieren geht nicht mit bestaetigten Gaesten
select t_expect_error($$select pp_release_set_active((select id from pp_releases where von = pp_today()), false)$$, 'bestätigte Gäste');
-- Frueher zurueck ab uebermorgen: Gast wird gekuerzt
select pp_release_shorten((select id from pp_releases where von = pp_today()), pp_today()+2);
select t_as('00000000-0000-0000-0000-00000000000c');
do $$ begin if (select bis from pp_res limit 1) <> pp_today()+1 then raise exception 'Gast nicht gekürzt'; end if;
  if (select count(*) from pp_notes where text like '%endet früher%') <> 1 then raise exception 'Gast nicht informiert'; end if;
  if (select count(*) from pp_notes where text like '%freigeschaltet%') <> 1 then raise exception 'Freischaltung nicht gemeldet'; end if; end $$;

-- Besitzerwechsel durch Admin: ab +25 bekommt C den Platz, Freigabe wird uebergeben
select t_as('00000000-0000-0000-0000-00000000000a');
select pp_admin_set_owner((select s2 from ids), '00000000-0000-0000-0000-00000000000c', pp_today()+25, true);
do $$ begin
  if (select count(*) from pp_owners where spot_id = (select s2 from ids)) <> 2 then raise exception 'Zuordnung falsch'; end if;
  if (select owner_id from pp_releases where spot_id = (select s2 from ids) and von = pp_today()+25) <> '00000000-0000-0000-0000-00000000000c' then raise exception 'Freigabe nicht übergeben'; end if; end $$;
-- Einladungscode nur fuer Admin
select length(pp_admin_invite(null)) >= 6 as invite_ok;
select t_as('00000000-0000-0000-0000-00000000000c');
select t_expect_error($$select pp_admin_invite(null)$$, 'Nur für Admins');
select t_expect_error($$select * from pp_secret$$, 'permission denied');

-- B gibt seinen Platz ab (Kuendigung) ab morgen: letzter Tag heute
select t_as('00000000-0000-0000-0000-00000000000b');
select pp_leave_spot((select s2 from ids), pp_today());
do $$ begin if (select bis from pp_owners where user_id = auth.uid()) <> pp_today() then raise exception 'Abgabe nicht gespeichert'; end if; end $$;

-- C storniert, dann loescht C alle Daten
select t_as('00000000-0000-0000-0000-00000000000c');
select pp_cancel((select id from pp_res where status = 'bestaetigt' limit 1));
select pp_delete_me();
reset role;
do $$ begin
  if exists (select 1 from auth.users where id = '00000000-0000-0000-0000-00000000000c') then raise exception 'Konto nicht gelöscht'; end if;
  if exists (select 1 from pp_owners where user_id = '00000000-0000-0000-0000-00000000000c') or exists (select 1 from pp_res where user_id = '00000000-0000-0000-0000-00000000000c')
     or exists (select 1 from pp_notes where user_id = '00000000-0000-0000-0000-00000000000c') then raise exception 'Reste von C vorhanden'; end if; end $$;
-- Housekeeping: alte Anfrage verfaellt
insert into pp_owners (spot_id, user_id, ab) values ((select s1 from ids), '00000000-0000-0000-0000-00000000000b', pp_today()-10);
with f as (insert into pp_releases (spot_id, owner_id, von, bis) values ((select s1 from ids), '00000000-0000-0000-0000-00000000000b', pp_today()+1, pp_today()+2) returning id)
insert into pp_res (release_id, spot_id, user_id, von, bis, kennz, created_at) select id, (select s1 from ids), '00000000-0000-0000-0000-00000000000a', pp_today()+1, pp_today()+2, 'A-1', now() - interval '30 hours' from f;
set role authenticated; select t_as('00000000-0000-0000-0000-00000000000a'); select pp_housekeeping(); reset role;
do $$ begin if (select status from pp_res where kennz = 'A-1') <> 'verfallen' then raise exception 'Frist nicht angewendet'; end if; end $$;
-- Einziger Admin darf sich nicht loeschen, solange andere da sind
set role authenticated; select t_as('00000000-0000-0000-0000-00000000000a');
select t_expect_error($$select pp_delete_me()$$, 'einzige Admin');
-- Anonym: keine Funktionen
reset role; set role anon;
select t_expect_error($$select pp_occupancy()$$, 'permission denied');
reset role;
select 'ALLE TESTS BESTANDEN' as ergebnis;
