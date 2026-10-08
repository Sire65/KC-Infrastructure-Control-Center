-- KICC-F-096 · Zugriffs-Waechter (Supabase KC Core, ptblnpiroqftcvlsrhac)
-- Liest neue Sitzungen/Konten aus auth.* (nur lesend, kein Trigger im Login-Pfad),
-- erkennt neue Geraete, neue Konten und Login-Haeufungen und meldet ueber den
-- bestehenden KC-Communicator-Scheduler (kc_communication_scheduled_jobs).
-- Daten liegen in kc_internal (nicht per API erreichbar, nicht gespiegelt).
--
-- STAND 2026-10-08: vollstaendig in KC Core eingespielt (Migrationen kicc_access_watch_f096_*).
-- Ereignisse werden bewusst nicht automatisch geloescht (geringes Volumen); Aufbewahrung ggf. spaeter separat.

create table if not exists kc_internal.kc_access_watch_state(
  id text primary key default 'primary',
  last_session_at timestamptz,
  last_user_at timestamptz,
  baseline_at timestamptz,
  last_run_at timestamptz,
  last_error text,
  enabled boolean not null default true
);
create table if not exists kc_internal.kc_access_known_devices(
  user_id uuid not null,
  device_key text not null,
  device_label text,
  first_seen timestamptz not null,
  last_seen timestamptz not null,
  last_ip inet,
  sessions integer not null default 1,
  primary key(user_id, device_key)
);
create table if not exists kc_internal.kc_access_events(
  id bigserial primary key,
  happened_at timestamptz not null default now(),
  kind text not null check (kind in ('baseline','new_device','new_user','session_burst','watch_error')),
  severity text not null check (severity in ('info','warning','critical')),
  user_id uuid,
  email text,
  ip inet,
  device_label text,
  device_key text,
  detail jsonb not null default '{}'::jsonb,
  job_id uuid
);
create index if not exists kc_access_events_happened_idx on kc_internal.kc_access_events(happened_at desc);

alter table kc_internal.kc_access_watch_state enable row level security;
alter table kc_internal.kc_access_known_devices enable row level security;
alter table kc_internal.kc_access_events enable row level security;
revoke all on kc_internal.kc_access_watch_state, kc_internal.kc_access_known_devices, kc_internal.kc_access_events from public, anon, authenticated;

-- Geraete-Schluessel: User-Agent ohne Versionsnummern, damit Browser-Updates keinen Alarm ausloesen.
create or replace function kc_internal.kc_access_device_key(p_ua text)
returns text language sql immutable
set search_path = pg_catalog
as $$
  select md5(coalesce(nullif(btrim(regexp_replace(regexp_replace(lower(coalesce(p_ua,'')), '[0-9]+([._][0-9]+)*', '#', 'g'), '\s+', ' ', 'g')), ''), 'unknown'))
$$;

-- Meldung ueber den bestehenden Communicator (Push + E-Mail) an aktive KC-System-Check-Operatoren.
create or replace function kc_internal.kc_access_notify(p_subject text, p_message text, p_priority text)
returns uuid language plpgsql security definer
set search_path = pg_catalog, public, kc_internal
as $$
declare v_id uuid; v_org text; v_people jsonb;
begin
  select min(l.org_id), jsonb_agg(distinct l.person_id)
    into v_org, v_people
  from public.kc_system_check_operators o
  join public.kc_core_user_links l on l.user_id = o.user_id and l.active
  where o.active;
  if v_people is null or jsonb_array_length(v_people) = 0 then
    return null;
  end if;
  insert into public.kc_communication_scheduled_jobs(org_id, subject, message, mode, audience, priority, scheduled_for)
  values (v_org, p_subject, p_message, 'both', jsonb_build_object('type','persons','personIds',v_people), p_priority, now())
  returning id into v_id;
  return v_id;
end $$;

create or replace function kc_internal.kc_access_watch()
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, kc_internal, auth
as $$
declare
  st kc_internal.kc_access_watch_state%rowtype;
  s record; u record;
  v_key text; v_new boolean; v_max_session timestamptz; v_max_user timestamptz;
  v_lines text[] := '{}'; v_users text[] := '{}'; v_job uuid; v_burst int; v_count int;
  v_when text;
begin
  insert into kc_internal.kc_access_watch_state(id) values ('primary') on conflict (id) do nothing;
  select * into st from kc_internal.kc_access_watch_state where id = 'primary' for update;
  if not st.enabled then
    return jsonb_build_object('status','disabled');
  end if;

  begin
    -- Erstlauf: vorhandene Geraete als bekannt uebernehmen, nichts alarmieren.
    if st.baseline_at is null then
      insert into kc_internal.kc_access_known_devices(user_id, device_key, device_label, first_seen, last_seen, last_ip, sessions)
      select x.user_id, kc_internal.kc_access_device_key(x.user_agent), left(max(x.user_agent),160), min(x.created_at), max(x.created_at),
             (array_agg(x.ip order by x.created_at desc))[1], count(*)
      from auth.sessions x
      group by x.user_id, kc_internal.kc_access_device_key(x.user_agent)
      on conflict do nothing;
      get diagnostics v_count = row_count;
      v_job := kc_internal.kc_access_notify(
        'KICC Zugriffs-Wächter aktiv',
        format(E'Der KICC Zugriffs-Wächter ist aktiv.\n\nBekannte Geräte übernommen: %s.\nAb jetzt wird gemeldet: neues Gerät/neuer Browser bei einer Anmeldung, neu angelegte Konten und gehäufte Anmeldungen.\n\nKC Infrastructure Control Center', v_count),
        'normal');
      insert into kc_internal.kc_access_events(kind, severity, detail, job_id)
      values ('baseline','info', jsonb_build_object('known_devices', v_count), v_job);
      update kc_internal.kc_access_watch_state
         set baseline_at = now(),
             last_session_at = coalesce((select max(created_at) from auth.sessions), now()),
             last_user_at = coalesce((select max(created_at) from auth.users), now()),
             last_run_at = now(), last_error = null
       where id = 'primary';
      return jsonb_build_object('status','baseline','known_devices',v_count,'job',v_job);
    end if;

    v_max_session := st.last_session_at;
    for s in
      select x.*, usr.email
      from auth.sessions x left join auth.users usr on usr.id = x.user_id
      where x.created_at > st.last_session_at
      order by x.created_at
    loop
      v_key := kc_internal.kc_access_device_key(s.user_agent);
      insert into kc_internal.kc_access_known_devices as d(user_id, device_key, device_label, first_seen, last_seen, last_ip, sessions)
      values (s.user_id, v_key, left(s.user_agent,160), s.created_at, s.created_at, s.ip, 1)
      on conflict (user_id, device_key) do update
        set last_seen = excluded.last_seen, last_ip = excluded.last_ip, sessions = d.sessions + 1
      returning (xmax = 0) into v_new;
      if v_new then
        v_when := to_char(s.created_at at time zone 'Europe/Berlin', 'DD.MM.YYYY HH24:MI');
        insert into kc_internal.kc_access_events(kind, severity, user_id, email, ip, device_label, device_key, detail)
        values ('new_device','critical', s.user_id, s.email, s.ip, left(s.user_agent,160), v_key, jsonb_build_object('session_created_at', s.created_at, 'aal', s.aal));
        v_lines := v_lines || format('%s · %s · IP %s · %s', v_when, coalesce(s.email,'?'), coalesce(host(s.ip),'?'), coalesce(left(s.user_agent,110),'unbekanntes Gerät'));
      end if;
      v_max_session := greatest(v_max_session, s.created_at);
    end loop;

    v_max_user := st.last_user_at;
    for u in select id, email, created_at from auth.users where created_at > st.last_user_at order by created_at loop
      insert into kc_internal.kc_access_events(kind, severity, user_id, email, detail)
      values ('new_user','critical', u.id, u.email, jsonb_build_object('created_at', u.created_at));
      v_users := v_users || format('%s · %s', to_char(u.created_at at time zone 'Europe/Berlin','DD.MM.YYYY HH24:MI'), coalesce(u.email,'?'));
      v_max_user := greatest(v_max_user, u.created_at);
    end loop;

    if cardinality(v_lines) > 0 then
      v_job := kc_internal.kc_access_notify(
        'KICC Sicherheitsalarm: Anmeldung von neuem Gerät',
        E'Es gab eine Anmeldung von einem bisher unbekannten Gerät oder Browser:\n\n' || array_to_string(v_lines[1:5], E'\n')
          || case when cardinality(v_lines) > 5 then format(E'\n… und %s weitere', cardinality(v_lines)-5) else '' end
          || E'\n\nWarst du das? Dann ist nichts zu tun.\nWenn nicht: sofort das Passwort ändern und in Supabase alle Sitzungen abmelden.\n\nKC Infrastructure Control Center',
        'critical');
      update kc_internal.kc_access_events set job_id = v_job where kind = 'new_device' and job_id is null;
    end if;

    if cardinality(v_users) > 0 then
      v_job := kc_internal.kc_access_notify(
        'KICC Sicherheitsalarm: neues Benutzerkonto',
        E'In KC Core wurde ein neues Benutzerkonto angelegt:\n\n' || array_to_string(v_users[1:5], E'\n')
          || E'\n\nWenn das nicht von dir stammt: Konto in Supabase sofort sperren.\n\nKC Infrastructure Control Center',
        'critical');
      update kc_internal.kc_access_events set job_id = v_job where kind = 'new_user' and job_id is null;
    end if;

    select count(*) into v_burst from auth.sessions where created_at > now() - interval '1 hour';
    if v_burst > 15 and not exists (
      select 1 from kc_internal.kc_access_events where kind = 'session_burst' and happened_at > now() - interval '6 hours'
    ) then
      v_job := kc_internal.kc_access_notify(
        'KICC Sicherheitswarnung: gehäufte Anmeldungen',
        format(E'In der letzten Stunde gab es %s neue Anmeldungen in KC Core. Das ist ungewöhnlich viel.\n\nBitte prüfen.\n\nKC Infrastructure Control Center', v_burst),
        'high');
      insert into kc_internal.kc_access_events(kind, severity, detail, job_id)
      values ('session_burst','warning', jsonb_build_object('sessions_last_hour', v_burst), v_job);
    end if;

    update kc_internal.kc_access_watch_state
       set last_session_at = v_max_session, last_user_at = v_max_user, last_run_at = now(), last_error = null
     where id = 'primary';
    return jsonb_build_object('status','ok','new_devices',cardinality(v_lines),'new_users',cardinality(v_users),'sessions_last_hour',v_burst);
  exception when others then
    update kc_internal.kc_access_watch_state set last_run_at = now(), last_error = left(sqlerrm, 300) where id = 'primary';
    insert into kc_internal.kc_access_events(kind, severity, detail) values ('watch_error','warning', jsonb_build_object('error', left(sqlerrm,300)));
    return jsonb_build_object('status','error','error',left(sqlerrm,300));
  end;
end $$;

revoke all on function kc_internal.kc_access_watch() from public, anon, authenticated;
revoke all on function kc_internal.kc_access_notify(text,text,text) from public, anon, authenticated;
revoke all on function kc_internal.kc_access_device_key(text) from public, anon, authenticated;

-- Aktivierung (pg_cron, jede Minute):
select cron.schedule('kicc-access-watch-minute', '* * * * *', 'select kc_internal.kc_access_watch();');

-- Abschalten ohne Loeschen: update kc_internal.kc_access_watch_state set enabled=false where id='primary';
