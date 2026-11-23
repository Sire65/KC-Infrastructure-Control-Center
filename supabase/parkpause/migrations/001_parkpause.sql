-- ParkPause (KICC-PARKPAUSE-APP) – Schema, Zugriffsregeln und Funktionen
-- Eigenes Supabase-Projekt. Keine Verbindung zu KC- oder Sparkassen-Systemen.
-- Alle Aenderungen laufen ueber Funktionen (security definer) mit Pruefung;
-- Tabellen sind fuer Mitglieder nur lesbar (Ausnahme: Admin-Stammdaten, eigene Push-Abos).

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------- Tabellen
create table if not exists pp_settings (
  id int primary key default 1 check (id = 1),
  app_name text not null default 'ParkPause',
  color text not null default '#1F4E8C',
  logo text,                                   -- data-URL, vom Admin hochgeladen
  scheme text not null default 'ebene-raum' check (scheme in ('ebene-raum','ebene','fortlaufend')),
  show_names boolean not null default true,
  frist_std int not null default 24 check (frist_std between 1 and 168),
  nach_frist text not null default 'verfallen' check (nach_frist in ('verfallen','auto')),
  max_tage int not null default 21 check (max_tage between 1 and 365),
  vorlauf int not null default 90 check (vorlauf between 1 and 365),
  updated_at timestamptz not null default now()
);
insert into pp_settings (id) values (1) on conflict do nothing;

-- Einladungscode: fuer Mitglieder nicht lesbar
create table if not exists pp_secret (
  id int primary key default 1 check (id = 1),
  invite_code text not null
);
insert into pp_secret (id, invite_code)
  values (1, upper(substr(md5(random()::text), 1, 8))) on conflict do nothing;

create table if not exists pp_levels (
  id uuid primary key default gen_random_uuid(),
  kz text not null check (length(kz) between 1 and 4),
  name text not null check (length(name) between 1 and 30),
  sort int not null default 0
);
create table if not exists pp_rooms (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references pp_levels(id) on delete cascade,
  kz text not null check (length(kz) between 1 and 3),
  name text not null check (length(name) between 1 and 30),
  sort int not null default 0,
  count int not null default 10 check (count between 0 and 200)
);
create table if not exists pp_spots (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references pp_rooms(id) on delete cascade,
  idx int not null,
  type text not null default 'miete' check (type in ('miete','fest','gesperrt')),
  fest_label text check (length(fest_label) <= 30),
  merkmal text check (merkmal in ('E-Laden','breit','Motorrad')),
  label_override text check (length(label_override) <= 12),
  unique (room_id, idx)
);

create table if not exists pp_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudonym text not null check (length(pseudonym) between 3 and 20),
  is_admin boolean not null default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists pp_profiles_pseudonym_uq on pp_profiles (lower(pseudonym));

-- Private Angaben: nur die Person selbst
create table if not exists pp_private (
  id uuid primary key references pp_profiles(id) on delete cascade,
  kennz text check (length(kennz) <= 14)
);

create table if not exists pp_owners (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references pp_spots(id) on delete cascade,
  user_id uuid not null references pp_profiles(id) on delete cascade,
  ab date not null,
  bis date,
  check (bis is null or bis >= ab),
  exclude using gist (spot_id with =, daterange(ab, coalesce(bis, 'infinity'::date), '[]') with &&)
);

create table if not exists pp_releases (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references pp_spots(id) on delete cascade,
  owner_id uuid not null references pp_profiles(id) on delete cascade,
  von date not null,
  bis date not null,
  ab date,                                      -- erst ab diesem Tag reservierbar
  aktiv boolean not null default true,
  created_at timestamptz not null default now(),
  check (bis >= von),
  exclude using gist (spot_id with =, daterange(von, bis, '[]') with &&)
);

create table if not exists pp_res (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references pp_releases(id) on delete cascade,
  spot_id uuid not null references pp_spots(id) on delete cascade,
  user_id uuid not null references pp_profiles(id) on delete cascade,
  von date not null,
  bis date not null,
  status text not null default 'angefragt'
    check (status in ('angefragt','bestaetigt','abgelehnt','storniert','verfallen','beendet')),
  kennz text not null check (length(kennz) between 1 and 14),
  msg text check (length(msg) <= 120),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  check (bis >= von),
  exclude using gist (spot_id with =, daterange(von, bis, '[]') with &&)
    where (status in ('angefragt','bestaetigt'))
);

create table if not exists pp_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references pp_profiles(id) on delete cascade,
  actor_id uuid,
  text text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false,
  pushed boolean not null default false
);
create index if not exists pp_notes_user on pp_notes (user_id, created_at desc);

create table if not exists pp_push (
  endpoint text primary key,
  user_id uuid not null references pp_profiles(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- Hilfen
create or replace function pp_today() returns date language sql stable
  as $$ select (now() at time zone 'Europe/Berlin')::date $$;

create or replace function pp_is_member() returns boolean language sql stable security definer set search_path = public
  as $$ select exists (select 1 from pp_profiles where id = auth.uid()) $$;

create or replace function pp_is_admin() returns boolean language sql stable security definer set search_path = public
  as $$ select coalesce((select is_admin from pp_profiles where id = auth.uid()), false) $$;

create or replace function pp_owner_on(p_spot uuid, p_day date) returns uuid language sql stable security definer set search_path = public
  as $$ select user_id from pp_owners where spot_id = p_spot and ab <= p_day and (bis is null or bis >= p_day) limit 1 $$;

create or replace function pp_label(p_spot uuid) returns text language sql stable security definer set search_path = public as $$
  with s as (
    select sp.id, sp.idx, sp.label_override, r.kz rkz, l.kz lkz, l.id lid,
      row_number() over (order by l.sort, l.kz, r.sort, r.kz, sp.idx) run,
      row_number() over (partition by l.id order by r.sort, r.kz, sp.idx) inl
    from pp_spots sp join pp_rooms r on r.id = sp.room_id join pp_levels l on l.id = r.level_id
  )
  select coalesce(s.label_override, case st.scheme
    when 'fortlaufend' then s.run::text
    when 'ebene' then s.lkz || '-' || lpad(s.inl::text, 2, '0')
    else s.lkz || s.rkz || '-' || lpad(s.idx::text, 2, '0') end)
  from s, pp_settings st where s.id = p_spot
$$;

create or replace function pp_note(p_user uuid, p_text text) returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if p_user is null then return null; end if;
  insert into pp_notes (user_id, actor_id, text) values (p_user, auth.uid(), p_text) returning id into v;
  return v;
end $$;

create or replace function pp_fmt(d date) returns text language sql immutable as $$ select to_char(d, 'DD.MM.') $$;
create or replace function pp_rng(a date, b date) returns text language sql immutable
  as $$ select case when a = b then pp_fmt(a) else pp_fmt(a) || '–' || pp_fmt(b) end $$;

-- Raum-Platzanzahl -> Plaetze anlegen/entfernen
create or replace function pp_sync_spots() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into pp_spots (room_id, idx)
    select new.id, g from generate_series(1, new.count) g
    on conflict (room_id, idx) do nothing;
  delete from pp_spots where room_id = new.id and idx > new.count;
  return new;
end $$;
drop trigger if exists pp_rooms_sync on pp_rooms;
create trigger pp_rooms_sync after insert or update of count on pp_rooms
  for each row execute function pp_sync_spots();

-- ---------------------------------------------------------------- Zugriffsregeln
alter table pp_settings enable row level security;
alter table pp_secret   enable row level security;
alter table pp_levels   enable row level security;
alter table pp_rooms    enable row level security;
alter table pp_spots    enable row level security;
alter table pp_profiles enable row level security;
alter table pp_private  enable row level security;
alter table pp_owners   enable row level security;
alter table pp_releases enable row level security;
alter table pp_res      enable row level security;
alter table pp_notes    enable row level security;
alter table pp_push     enable row level security;

revoke all on pp_settings, pp_secret, pp_levels, pp_rooms, pp_spots, pp_profiles, pp_private,
  pp_owners, pp_releases, pp_res, pp_notes, pp_push from anon, authenticated;
grant select on pp_settings, pp_levels, pp_rooms, pp_spots, pp_profiles, pp_owners, pp_releases, pp_res, pp_notes to authenticated;
grant insert, update, delete on pp_levels, pp_rooms, pp_spots to authenticated;
grant update on pp_settings to authenticated;
grant select, insert, update on pp_private to authenticated;
grant select, insert, delete on pp_push to authenticated;

drop policy if exists m_read on pp_settings;  create policy m_read on pp_settings for select to authenticated using (pp_is_member());
drop policy if exists a_upd  on pp_settings;  create policy a_upd  on pp_settings for update to authenticated using (pp_is_admin()) with check (pp_is_admin());
drop policy if exists m_read on pp_levels;    create policy m_read on pp_levels   for select to authenticated using (pp_is_member());
drop policy if exists a_all  on pp_levels;    create policy a_all  on pp_levels   for all to authenticated using (pp_is_admin()) with check (pp_is_admin());
drop policy if exists m_read on pp_rooms;     create policy m_read on pp_rooms    for select to authenticated using (pp_is_member());
drop policy if exists a_all  on pp_rooms;     create policy a_all  on pp_rooms    for all to authenticated using (pp_is_admin()) with check (pp_is_admin());
drop policy if exists m_read on pp_spots;     create policy m_read on pp_spots    for select to authenticated using (pp_is_member());
drop policy if exists a_all  on pp_spots;     create policy a_all  on pp_spots    for all to authenticated using (pp_is_admin()) with check (pp_is_admin());
drop policy if exists m_read on pp_profiles;  create policy m_read on pp_profiles for select to authenticated using (pp_is_member());
drop policy if exists own    on pp_private;   create policy own    on pp_private  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists m_read on pp_owners;    create policy m_read on pp_owners   for select to authenticated using (pp_is_member());
drop policy if exists m_read on pp_releases;  create policy m_read on pp_releases for select to authenticated using (pp_is_member());
-- Reservierungen: nur Gast und Platzinhaber sehen Einzelheiten; Belegung fuer alle ueber pp_occupancy()
drop policy if exists own    on pp_res;       create policy own    on pp_res      for select to authenticated
  using (user_id = auth.uid() or pp_owner_on(spot_id, von) = auth.uid());
drop policy if exists own    on pp_notes;     create policy own    on pp_notes    for select to authenticated using (user_id = auth.uid());
drop policy if exists own    on pp_push;      create policy own    on pp_push     for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and pp_is_member());

-- Belegung ohne Personenbezug (fuer den Lageplan)
create or replace function pp_occupancy() returns table (spot_id uuid, von date, bis date, status text)
  language sql stable security definer set search_path = public as $$
  select r.spot_id, r.von, r.bis, r.status from pp_res r
  where pp_is_member() and r.status in ('angefragt','bestaetigt') and r.bis >= pp_today() - 1
$$;

-- ---------------------------------------------------------------- Ablaeufe
create or replace function pp_housekeeping() returns void language plpgsql security definer set search_path = public as $$
declare r record; st pp_settings;
begin
  select * into st from pp_settings where id = 1;
  for r in select * from pp_res where status = 'angefragt'
      and (created_at < now() - make_interval(hours => st.frist_std) or von < pp_today()) for update skip locked loop
    if st.nach_frist = 'auto' and r.bis >= pp_today() then
      update pp_res set status = 'bestaetigt', decided_at = now() where id = r.id;
      perform pp_note(r.user_id, 'Platz ' || pp_label(r.spot_id) || ' (' || pp_rng(r.von, r.bis) || ') wurde automatisch bestätigt.');
    else
      update pp_res set status = 'verfallen', decided_at = now() where id = r.id;
      perform pp_note(r.user_id, 'Ihre Anfrage für Platz ' || pp_label(r.spot_id) || ' (' || pp_rng(r.von, r.bis) || ') wurde nicht rechtzeitig beantwortet.');
    end if;
  end loop;
  update pp_res set status = 'beendet' where status = 'bestaetigt' and bis < pp_today();
end $$;

-- Gaeste ab einem Tag ausplanen (Platz wird nicht mehr freigegeben)
create or replace function pp_cut_guests(p_release uuid, p_from date, p_why text) returns uuid[] language plpgsql security definer set search_path = public as $$
declare r record; ids uuid[] := '{}';
begin
  for r in select * from pp_res where release_id = p_release and status in ('angefragt','bestaetigt') and bis >= p_from loop
    if r.von >= p_from then
      update pp_res set status = 'storniert', decided_at = now() where id = r.id;
      ids := ids || pp_note(r.user_id, 'Ihre Reservierung für Platz ' || pp_label(r.spot_id) || ' (' || pp_rng(r.von, r.bis) || ') entfällt: ' || p_why);
    else
      update pp_res set bis = p_from - 1 where id = r.id;
      ids := ids || pp_note(r.user_id, 'Ihre Reservierung für Platz ' || pp_label(r.spot_id) || ' endet früher, am ' || pp_fmt(p_from - 1) || '. ' || p_why);
    end if;
  end loop;
  return ids;
end $$;

-- Freigaben eines Inhabers ab einem Tag beenden
create or replace function pp_end_releases(p_spot uuid, p_owner uuid, p_from date, p_why text) returns uuid[] language plpgsql security definer set search_path = public as $$
declare f record; ids uuid[] := '{}';
begin
  for f in select * from pp_releases where spot_id = p_spot and owner_id = p_owner and bis >= p_from loop
    ids := ids || pp_cut_guests(f.id, p_from, p_why);
    if f.von >= p_from then delete from pp_releases where id = f.id;
    else update pp_releases set bis = p_from - 1 where id = f.id; end if;
  end loop;
  return ids;
end $$;

create or replace function pp_require_member() returns void language plpgsql stable security definer set search_path = public as $$
begin if not pp_is_member() then raise exception 'Bitte zuerst anmelden.'; end if; end $$;

-- Eigenen Stellplatz eintragen (Selbstanmeldung)
create or replace function pp_claim_spot(p_spot uuid, p_ab date) returns void language plpgsql security definer set search_path = public as $$
declare s pp_spots;
begin
  perform pp_require_member();
  select * into s from pp_spots where id = p_spot;
  if s.id is null then raise exception 'Diesen Platz gibt es nicht.'; end if;
  if s.type <> 'miete' then raise exception 'Dieser Platz ist ein Festplatz oder gesperrt.'; end if;
  if p_ab is null or p_ab < pp_today() - 365 then raise exception 'Bitte ein gültiges Datum wählen.'; end if;
  if exists (select 1 from pp_owners where spot_id = p_spot and coalesce(bis, 'infinity') >= p_ab) then
    raise exception 'Platz % ist ab diesem Tag schon jemandem zugeordnet. Der bisherige Mieter muss ihn erst in der App abgeben, sonst hilft der Admin.', pp_label(p_spot);
  end if;
  insert into pp_owners (spot_id, user_id, ab) values (p_spot, auth.uid(), p_ab);
  update pp_profiles set onboarded = true where id = auth.uid();
end $$;

-- Eigenen Stellplatz abgeben (Kuendigung, Wechsel)
create or replace function pp_leave_spot(p_spot uuid, p_last date) returns uuid[] language plpgsql security definer set search_path = public as $$
declare o pp_owners; ids uuid[];
begin
  perform pp_require_member();
  select * into o from pp_owners where spot_id = p_spot and user_id = auth.uid() and coalesce(bis, 'infinity') >= pp_today() order by ab desc limit 1;
  if o.id is null then raise exception 'Dieser Platz ist dir nicht zugeordnet.'; end if;
  if p_last < pp_today() - 1 then raise exception 'Der letzte Tag darf nicht in der Vergangenheit liegen.'; end if;
  ids := pp_end_releases(p_spot, auth.uid(), p_last + 1, 'Der Platz wechselt den Mieter.');
  if p_last < o.ab then delete from pp_owners where id = o.id;
  else update pp_owners set bis = p_last where id = o.id; end if;
  return ids;
end $$;

create or replace function pp_set_onboarded() returns void language sql security definer set search_path = public
  as $$ update pp_profiles set onboarded = true where id = auth.uid() $$;

-- Freigaben
create or replace function pp_release_add(p_spot uuid, p_von date, p_bis date, p_ab date) returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid; d date;
begin
  perform pp_require_member();
  if p_von is null or p_bis is null or p_bis < p_von then raise exception 'Bitte Von und Bis prüfen.'; end if;
  if p_von < pp_today() then raise exception 'Der Zeitraum beginnt in der Vergangenheit.'; end if;
  if p_bis > pp_today() + 400 then raise exception 'Höchstens etwa ein Jahr im Voraus.'; end if;
  if p_ab is not null and p_ab > p_von then raise exception '„Reservierbar ab“ muss vor dem Beginn liegen.'; end if;
  d := p_von;
  while d <= p_bis loop
    if pp_owner_on(p_spot, d) is distinct from auth.uid() then raise exception 'Am % bist du nicht Mieter dieses Platzes.', to_char(d, 'DD.MM.YYYY'); end if;
    d := d + 1;
  end loop;
  insert into pp_releases (spot_id, owner_id, von, bis, ab) values (p_spot, auth.uid(), p_von, p_bis, p_ab) returning id into v;
  return v;
exception when exclusion_violation then raise exception 'Überschneidet sich mit einer vorhandenen Freigabe.';
end $$;

create or replace function pp_release_set_active(p_id uuid, p_aktiv boolean) returns uuid[] language plpgsql security definer set search_path = public as $$
declare f pp_releases; ids uuid[] := '{}'; r record;
begin
  select * into f from pp_releases where id = p_id and owner_id = auth.uid();
  if f.id is null then raise exception 'Freigabe nicht gefunden.'; end if;
  if not p_aktiv then
    if exists (select 1 from pp_res where release_id = p_id and status = 'bestaetigt' and bis >= pp_today()) then
      raise exception 'Diese Freigabe hat bestätigte Gäste. Nutze „Früher zurück“.';
    end if;
    for r in select * from pp_res where release_id = p_id and status = 'angefragt' loop
      update pp_res set status = 'abgelehnt', decided_at = now() where id = r.id;
      ids := ids || pp_note(r.user_id, 'Die Freigabe für Platz ' || pp_label(r.spot_id) || ' wurde zurückgezogen. Ihre Anfrage (' || pp_rng(r.von, r.bis) || ') ist damit abgelehnt.');
    end loop;
  end if;
  update pp_releases set aktiv = p_aktiv where id = p_id;
  return ids;
end $$;

create or replace function pp_release_shorten(p_id uuid, p_back date) returns uuid[] language plpgsql security definer set search_path = public as $$
declare f pp_releases; ids uuid[];
begin
  select * into f from pp_releases where id = p_id and owner_id = auth.uid();
  if f.id is null then raise exception 'Freigabe nicht gefunden.'; end if;
  if p_back is null or p_back < greatest(f.von, pp_today()) or p_back > f.bis then raise exception 'Bitte einen Tag innerhalb der Freigabe wählen.'; end if;
  ids := pp_cut_guests(p_id, p_back, 'Der Inhaber ist früher zurück.');
  if p_back <= f.von then delete from pp_releases where id = p_id; else update pp_releases set bis = p_back - 1 where id = p_id; end if;
  return ids;
end $$;

create or replace function pp_release_delete(p_id uuid) returns uuid[] language plpgsql security definer set search_path = public as $$
declare f pp_releases; ids uuid[];
begin
  select * into f from pp_releases where id = p_id and owner_id = auth.uid();
  if f.id is null then raise exception 'Freigabe nicht gefunden.'; end if;
  ids := pp_cut_guests(p_id, greatest(f.von, pp_today()), 'Der Inhaber braucht den Platz selbst.');
  if f.von >= pp_today() then delete from pp_releases where id = p_id;
  else update pp_releases set bis = pp_today() - 1 where id = p_id; end if;
  return ids;
end $$;

-- Reservieren
create or replace function pp_request(p_spot uuid, p_von date, p_bis date, p_kennz text, p_msg text) returns uuid[] language plpgsql security definer set search_path = public as $$
declare st pp_settings; f pp_releases; v pp_res; owner uuid; me pp_profiles;
begin
  perform pp_require_member();
  perform pp_housekeeping();
  select * into st from pp_settings where id = 1;
  select * into me from pp_profiles where id = auth.uid();
  if p_von is null or p_bis is null or p_bis < p_von then raise exception 'Bitte Von und Bis prüfen.'; end if;
  if p_von < pp_today() then raise exception 'Der Zeitraum beginnt in der Vergangenheit.'; end if;
  if p_von > pp_today() + st.vorlauf then raise exception 'So weit im Voraus geht es nicht (höchstens % Tage).', st.vorlauf; end if;
  if p_bis - p_von + 1 > st.max_tage then raise exception 'Höchstens % Tage am Stück.', st.max_tage; end if;
  if coalesce(trim(p_kennz), '') = '' then raise exception 'Bitte das Kennzeichen angeben.'; end if;
  select * into f from pp_releases where spot_id = p_spot and von <= p_von and bis >= p_bis and aktiv and (ab is null or ab <= pp_today());
  if f.id is null then raise exception 'Dieser Zeitraum ist für den Platz nicht freigegeben.'; end if;
  owner := pp_owner_on(p_spot, p_von);
  if owner = auth.uid() then raise exception 'Das ist dein eigener Platz.'; end if;
  if exists (select 1 from pp_res where user_id = auth.uid() and status in ('angefragt','bestaetigt')
             and daterange(von, bis, '[]') && daterange(p_von, p_bis, '[]')) then
    raise exception 'Du hast in diesem Zeitraum schon einen Platz.';
  end if;
  begin
    insert into pp_res (release_id, spot_id, user_id, von, bis, kennz, msg)
      values (f.id, p_spot, auth.uid(), p_von, p_bis, upper(trim(p_kennz)), nullif(trim(p_msg), '')) returning * into v;
  exception when exclusion_violation then raise exception 'Ein Teil des Zeitraums ist gerade schon angefragt oder vergeben.';
  end;
  insert into pp_private (id, kennz) values (auth.uid(), upper(trim(p_kennz))) on conflict (id) do update set kennz = coalesce(pp_private.kennz, excluded.kennz);
  return array[pp_note(owner, me.pseudonym || ' möchte Platz ' || pp_label(p_spot) || ' vom ' || pp_fmt(p_von) || ' bis ' || pp_fmt(p_bis) || '. Bitte freischalten oder ablehnen.')];
end $$;

create or replace function pp_decide(p_res uuid, p_ok boolean) returns uuid[] language plpgsql security definer set search_path = public as $$
declare r pp_res;
begin
  perform pp_require_member();
  select * into r from pp_res where id = p_res for update;
  if r.id is null or pp_owner_on(r.spot_id, r.von) is distinct from auth.uid() then raise exception 'Diese Anfrage gehört nicht zu deinem Platz.'; end if;
  if r.status <> 'angefragt' then raise exception 'Die Anfrage ist schon entschieden.'; end if;
  update pp_res set status = case when p_ok then 'bestaetigt' else 'abgelehnt' end, decided_at = now() where id = p_res;
  return array[pp_note(r.user_id, case when p_ok
    then 'Platz ' || pp_label(r.spot_id) || ' ist für Sie freigeschaltet: ' || pp_rng(r.von, r.bis) || '.'
    else 'Ihre Anfrage für Platz ' || pp_label(r.spot_id) || ' (' || pp_rng(r.von, r.bis) || ') wurde abgelehnt.' end)];
end $$;

create or replace function pp_cancel(p_res uuid) returns uuid[] language plpgsql security definer set search_path = public as $$
declare r pp_res; me pp_profiles;
begin
  select * into r from pp_res where id = p_res and user_id = auth.uid() for update;
  if r.id is null then raise exception 'Reservierung nicht gefunden.'; end if;
  if r.status not in ('angefragt','bestaetigt') then raise exception 'Diese Reservierung ist nicht mehr aktiv.'; end if;
  select * into me from pp_profiles where id = auth.uid();
  update pp_res set status = 'storniert', decided_at = now() where id = p_res;
  return array[pp_note(pp_owner_on(r.spot_id, r.von), me.pseudonym || ' hat Platz ' || pp_label(r.spot_id) || ' (' || pp_rng(r.von, r.bis) || ') storniert. Die Tage sind wieder frei.')];
end $$;

create or replace function pp_notes_read() returns void language sql security definer set search_path = public
  as $$ update pp_notes set read = true where user_id = auth.uid() and not read $$;

create or replace function pp_set_kennz(p_kennz text) returns void language sql security definer set search_path = public
  as $$ insert into pp_private (id, kennz) values (auth.uid(), nullif(upper(trim(p_kennz)), ''))
        on conflict (id) do update set kennz = excluded.kennz $$;

-- Alles einer Person entfernen (Meine Daten loeschen / Admin entfernt Mitglied)
create or replace function pp_wipe_user(p_user uuid, p_why text) returns uuid[] language plpgsql security definer set search_path = public as $$
declare ids uuid[] := '{}'; r record; nm text; o record;
begin
  select pseudonym into nm from pp_profiles where id = p_user;
  -- eigene Reservierungen: Inhaber informieren
  for r in select * from pp_res where user_id = p_user and status in ('angefragt','bestaetigt') and bis >= pp_today() loop
    ids := ids || pp_note(pp_owner_on(r.spot_id, r.von), nm || ' nimmt nicht mehr teil. Platz ' || pp_label(r.spot_id) || ' (' || pp_rng(r.von, r.bis) || ') ist wieder frei.');
  end loop;
  -- eigene Plaetze: Gaeste informieren, Freigaben beenden
  for o in select distinct spot_id from pp_owners where user_id = p_user loop
    ids := ids || pp_end_releases(o.spot_id, p_user, pp_today(), p_why);
  end loop;
  delete from auth.users where id = p_user;   -- loescht per Kaskade Profil, Zuordnungen, Freigaben, Reservierungen, Mitteilungen, Push
  -- nur Mitteilungen an andere bleiben (fuer Push)
  ids := array(select x from unnest(ids) x where x in (select id from pp_notes));
  return ids;
end $$;

create or replace function pp_delete_me() returns uuid[] language plpgsql security definer set search_path = public as $$
declare ids uuid[];
begin
  perform pp_require_member();
  if (select is_admin from pp_profiles where id = auth.uid())
     and (select count(*) from pp_profiles where is_admin) = 1 and (select count(*) from pp_profiles) > 1 then
    raise exception 'Du bist der einzige Admin. Ernenne erst jemand anderen zum Admin.';
  end if;
  ids := pp_wipe_user(auth.uid(), 'Der Inhaber nimmt nicht mehr teil.');
  return ids;
end $$;

-- ---------------------------------------------------------------- Admin
create or replace function pp_require_admin() returns void language plpgsql stable security definer set search_path = public as $$
begin if not pp_is_admin() then raise exception 'Nur für Admins.'; end if; end $$;

create or replace function pp_admin_invite(p_new text) returns text language plpgsql security definer set search_path = public as $$
declare v text;
begin
  perform pp_require_admin();
  if p_new is not null then
    if length(trim(p_new)) < 6 then raise exception 'Der Code braucht mindestens 6 Zeichen.'; end if;
    update pp_secret set invite_code = upper(trim(p_new)) where id = 1;
  end if;
  select invite_code into v from pp_secret where id = 1;
  return v;
end $$;

create or replace function pp_admin_set_admin(p_user uuid, p_on boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  perform pp_require_admin();
  if not p_on and p_user = auth.uid() then raise exception 'Du kannst dir die Admin-Rechte nicht selbst nehmen.'; end if;
  update pp_profiles set is_admin = p_on where id = p_user;
end $$;

-- Besitzerwechsel zum Stichtag (oder Platz frei machen: p_user null)
create or replace function pp_admin_set_owner(p_spot uuid, p_user uuid, p_ab date, p_handover boolean) returns uuid[] language plpgsql security definer set search_path = public as $$
declare o record; ids uuid[] := '{}'; f record; nm text;
begin
  perform pp_require_admin();
  if p_ab is null then raise exception 'Bitte den Stichtag wählen.'; end if;
  for o in select * from pp_owners where spot_id = p_spot and coalesce(bis, 'infinity') >= p_ab loop
    if p_handover and p_user is not null then
      for f in select * from pp_releases where spot_id = p_spot and owner_id = o.user_id and bis >= p_ab loop
        if f.von >= p_ab then update pp_releases set owner_id = p_user where id = f.id;
        else
          update pp_releases set bis = p_ab - 1 where id = f.id;
          with nf as (insert into pp_releases (spot_id, owner_id, von, bis, ab, aktiv) values (p_spot, p_user, p_ab, f.bis, f.ab, f.aktiv) returning id)
            update pp_res set release_id = (select id from nf) where release_id = f.id and von >= p_ab;
        end if;
      end loop;
    else
      ids := ids || pp_end_releases(p_spot, o.user_id, p_ab, 'Der Platz bekommt einen neuen Mieter.');
    end if;
    if o.ab >= p_ab then delete from pp_owners where id = o.id; else update pp_owners set bis = p_ab - 1 where id = o.id; end if;
    if o.user_id is distinct from p_user then
      ids := ids || pp_note(o.user_id, 'Platz ' || pp_label(p_spot) || ' ist ab ' || pp_fmt(p_ab) || ' nicht mehr dir zugeordnet (Änderung durch den Admin).');
    end if;
  end loop;
  if p_user is not null then
    insert into pp_owners (spot_id, user_id, ab) values (p_spot, p_user, p_ab);
    update pp_profiles set onboarded = true where id = p_user;
    ids := ids || pp_note(p_user, 'Ab ' || pp_fmt(p_ab) || ' ist dir Platz ' || pp_label(p_spot) || ' zugeordnet.');
  end if;
  return ids;
end $$;

create or replace function pp_admin_remove_user(p_user uuid) returns uuid[] language plpgsql security definer set search_path = public as $$
begin
  perform pp_require_admin();
  if p_user = auth.uid() then raise exception 'Zum Entfernen des eigenen Kontos „Meine Daten löschen“ nutzen.'; end if;
  return pp_wipe_user(p_user, 'Der Inhaber nimmt nicht mehr teil.');
end $$;

-- Erstausstattung der Garage (nur wenn noch leer): 2 Ebenen, je 2 Raeume, 85 Plaetze
create or replace function pp_admin_seed_layout() returns void language plpgsql security definer set search_path = public as $$
declare l1 uuid; l2 uuid;
begin
  perform pp_require_admin();
  if exists (select 1 from pp_levels) then return; end if;
  insert into pp_levels (kz, name, sort) values ('U1', 'Ebene −1', 1) returning id into l1;
  insert into pp_levels (kz, name, sort) values ('U2', 'Ebene −2', 2) returning id into l2;
  insert into pp_rooms (level_id, kz, name, sort, count) values (l1, 'A', 'Raum A', 1, 24), (l1, 'B', 'Raum B', 2, 20), (l2, 'A', 'Raum A', 1, 22), (l2, 'B', 'Raum B', 2, 19);
end $$;

-- Funktionsrechte: nur angemeldete Nutzer, keine anonymen Aufrufe
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'pp\_%' loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end $$;
-- interne Bausteine nicht direkt aufrufbar
revoke execute on function pp_note(uuid, text), pp_cut_guests(uuid, date, text), pp_end_releases(uuid, uuid, date, text),
  pp_wipe_user(uuid, text), pp_sync_spots() from authenticated;
