// ParkPause – Web-Push fuer frisch erzeugte Mitteilungen.
// Die App ruft die Funktion nach einer Aktion mit den IDs der Mitteilungen auf, die diese
// Aktion erzeugt hat. Gesendet wird nur, was der Aufrufer selbst ausgeloest hat
// (actor_id), was hoechstens 5 Minuten alt und noch nicht gesendet ist.
// Geheimnisse (nur als Funktions-Secrets): VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(jwt);
  if (!who?.user) return reply(401, { error: "Bitte anmelden." });
  let ids: string[] = [];
  try { ids = ((await req.json()).ids ?? []).filter((x: unknown) => typeof x === "string").slice(0, 50); } catch { /* leer */ }
  if (!ids.length) return reply(200, { sent: 0 });
  const since = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data: notes } = await admin.from("pp_notes").select("id, user_id, text")
    .in("id", ids).eq("actor_id", who.user.id).eq("pushed", false).gte("created_at", since);
  const { data: st } = await admin.from("pp_settings").select("app_name").eq("id", 1).single();
  let sent = 0;
  for (const n of notes ?? []) {
    const { data: subs } = await admin.from("pp_push").select("endpoint, p256dh, auth").eq("user_id", n.user_id);
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: st?.app_name ?? "ParkPause", body: n.text }), { TTL: 86400 });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await admin.from("pp_push").delete().eq("endpoint", s.endpoint);
      }
    }
    await admin.from("pp_notes").update({ pushed: true }).eq("id", n.id);
  }
  return reply(200, { sent });
});
