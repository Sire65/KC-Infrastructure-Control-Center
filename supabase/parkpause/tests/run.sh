#!/usr/bin/env bash
# Lokaler Test der ParkPause-Datenbanklogik. Braucht eine leere Postgres (>= 15) mit btree_gist.
# Aufruf: PGURL=postgres://postgres@127.0.0.1:5499 supabase/parkpause/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")"
DB=pp_test_$$
psql "$PGURL/postgres" -qc "create database $DB"
trap 'psql "$PGURL/postgres" -qc "drop database $DB" >/dev/null' EXIT
psql "$PGURL/postgres" -qtc "select 1 from pg_roles where rolname='anon'" | grep -q 1 \
  || psql "$PGURL/$DB" -q -v ON_ERROR_STOP=1 -c "create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;"
sed '1d' supabase-stub.sql | psql "$PGURL/$DB" -q -v ON_ERROR_STOP=1 >/dev/null
psql "$PGURL/$DB" -q -v ON_ERROR_STOP=1 -f ../migrations/001_parkpause.sql >/dev/null 2>&1
psql "$PGURL/$DB" -q -v ON_ERROR_STOP=1 -f ../migrations/001_parkpause.sql >/dev/null 2>&1   # zweimal: muss wiederholbar sein
psql "$PGURL/$DB" -q -v ON_ERROR_STOP=1 -f scenario.sql 2>&1 | grep -E "BESTANDEN|ERROR|FEHLER" 
