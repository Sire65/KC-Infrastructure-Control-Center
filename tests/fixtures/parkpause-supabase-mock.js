// Attrappe von supabase-js fuer den Oberflaechentest der ParkPause-App (keine echte Verbindung).
(() => {
  const T = new Date(); const iso = (d) => d.toISOString().slice(0, 10); const add = (n) => { const d = new Date(T); d.setDate(d.getDate() + n); return iso(d); };
  const ME = "u-me", BOB = "u-bob", EVA = "u-eva";
  const db = { pp_settings: [{ id: 1, app_name: "ParkPause", color: "#1F4E8C", logo: null, scheme: "ebene-raum", show_names: true, frist_std: 24, nach_frist: "verfallen", max_tage: 21, vorlauf: 90 }],
    pp_levels: [{ id: "L1", kz: "U1", name: "Ebene −1", sort: 1 }, { id: "L2", kz: "U2", name: "Ebene −2", sort: 2 }],
    pp_rooms: [{ id: "R1", level_id: "L1", kz: "A", name: "Raum A", sort: 1, count: 12 }, { id: "R2", level_id: "L2", kz: "A", name: "Raum A", sort: 1, count: 8 }],
    pp_spots: [], pp_owners: [], pp_releases: [], pp_res: [], pp_notes: [], pp_private: [{ id: ME, kennz: "S-ME 1" }], pp_push: [],
    pp_profiles: [{ id: ME, pseudonym: "Blauer Golf", is_admin: true, onboarded: true, created_at: T.toISOString() }, { id: BOB, pseudonym: "Biber", is_admin: false, onboarded: true, created_at: T.toISOString() }, { id: EVA, pseudonym: "Eule", is_admin: false, onboarded: true, created_at: T.toISOString() }] };
  db.pp_rooms.forEach((r) => { for (let i = 1; i <= r.count; i++) db.pp_spots.push({ id: r.id + "-" + i, room_id: r.id, idx: i, type: i === 1 ? "fest" : "miete", fest_label: i === 1 ? "Vorstand" : null, merkmal: i === 4 ? "E-Laden" : null, label_override: null }); });
  db.pp_owners.push({ id: "o1", spot_id: "R1-2", user_id: ME, ab: add(-100), bis: null }, { id: "o2", spot_id: "R1-3", user_id: BOB, ab: add(-100), bis: null });
  db.pp_releases.push({ id: "f1", spot_id: "R1-3", owner_id: BOB, von: add(0), bis: add(8), ab: null, aktiv: true }, { id: "f2", spot_id: "R1-2", owner_id: ME, von: add(2), bis: add(9), ab: null, aktiv: true });
  db.pp_res.push({ id: "x1", release_id: "f2", spot_id: "R1-2", user_id: EVA, von: add(3), bis: add(4), status: "angefragt", kennz: "E-VA 2", msg: "früh", created_at: T.toISOString() });
  db.pp_notes.push({ id: "n1", user_id: ME, text: "Eule möchte Platz U1A-02.", created_at: T.toISOString(), read: false });
  window.__calls = [];
  const q = (tbl) => { let rows = db[tbl] || []; let single = false, op = "select", patch = null;
    const b = { select() { return b; }, eq(k, v) { rows = rows.filter((r) => r[k] === v); return b; }, gte(k, v) { rows = rows.filter((r) => r[k] >= v); return b; },
      order() { return b; }, limit() { return b; }, maybeSingle() { single = "maybe"; return b; }, single() { single = true; return b; },
      insert(x) { op = "insert"; window.__calls.push(["insert", tbl, x]); return b; }, update(x) { op = "update"; patch = x; window.__calls.push(["update", tbl, x]); return b; }, delete() { op = "delete"; window.__calls.push(["delete", tbl]); return b; },
      then(res) { const data = op !== "select" ? null : single ? (rows[0] ?? null) : rows; return Promise.resolve({ data, error: null }).then(res); } };
    return b; };
  let session = null; const cbs = [];
  window.supabase = { createClient: () => ({
    auth: { onAuthStateChange(cb) { cbs.push(cb); setTimeout(() => cb("INITIAL_SESSION", session)); return { data: { subscription: { unsubscribe() {} } } }; },
      async signInWithPassword({ email }) { window.__calls.push(["login", email]); session = { user: { id: ME } }; cbs.forEach((c) => c("SIGNED_IN", session)); return { error: null }; },
      async signOut() { session = null; cbs.forEach((c) => c("SIGNED_OUT", null)); return {}; }, async updateUser() { return { error: null }; } },
    from: q,
    async rpc(name, args) { window.__calls.push(["rpc", name, args]); if (name === "pp_occupancy") return { data: db.pp_res.filter((r) => r.status === "angefragt" || r.status === "bestaetigt").map(({ spot_id, von, bis, status }) => ({ spot_id, von, bis, status })), error: null };
      if (name === "pp_admin_invite") return { data: "ABCD1234", error: null }; if (name === "pp_request") return { data: ["n9"], error: null }; return { data: null, error: null }; },
    functions: { async invoke(n, o) { window.__calls.push(["fn", n, o.body]); return { data: { ok: true, admin: false }, error: null }; } },
  }) };
})();
