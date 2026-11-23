// ParkPause – Registrierung mit Einladungscode und Passwort-Reset durch Admins.
// Laeuft mit dem Service-Schluessel des Projekts (nur serverseitig, nie im Browser).
// Bereitstellen mit verify_jwt = false: Die Registrierung ist ohne Konto erreichbar,
// der Admin-Reset prueft das Token selbst.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Anmeldename -> interne Adresse (wird nie angezeigt und nie angeschrieben)
async function loginEmail(pseudonym: string) {
  const data = new TextEncoder().encode(pseudonym.trim().toLowerCase());
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  const hex = Array.from(hash.slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
  return `pp-${hex}@parkpause.invalid`;
}
const PSEUDO = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,18}[\p{L}\p{N}]$/u;

async function register(body: Record<string, string>) {
  const code = String(body.code ?? "").trim().toUpperCase();
  const pseudonym = String(body.pseudonym ?? "").trim().replace(/\s+/g, " ");
  const password = String(body.password ?? "");
  if (!PSEUDO.test(pseudonym)) return reply(400, { error: "Das Pseudonym braucht 3 bis 20 Zeichen (Buchstaben, Ziffern, Leerzeichen, Punkt, Bindestrich)." });
  if (password.length < 8) return reply(400, { error: "Das Passwort braucht mindestens 8 Zeichen." });
  const { data: sec, error: e1 } = await admin.from("pp_secret").select("invite_code").eq("id", 1).single();
  if (e1 || !sec) return reply(500, { error: "Registrierung gerade nicht möglich." });
  if (!code || code !== sec.invite_code) {
    await new Promise((r) => setTimeout(r, 800)); // bremst Rateversuche
    return reply(403, { error: "Der Einladungscode stimmt nicht." });
  }
  const { data: taken } = await admin.from("pp_profiles").select("id").ilike("pseudonym", pseudonym.replace(/[%_\\]/g, "\\$&")).limit(1);
  if (taken && taken.length) return reply(409, { error: "Dieses Pseudonym ist schon vergeben." });
  const { count } = await admin.from("pp_profiles").select("id", { count: "exact", head: true });
  const { data: created, error: e2 } = await admin.auth.admin.createUser({
    email: await loginEmail(pseudonym), password, email_confirm: true, user_metadata: { app: "parkpause" },
  });
  if (e2 || !created.user) {
    const dup = /already|registered|exists/i.test(e2?.message ?? "");
    return reply(dup ? 409 : 500, { error: dup ? "Dieses Pseudonym ist schon vergeben." : "Konto konnte nicht angelegt werden." });
  }
  const { error: e3 } = await admin.from("pp_profiles").insert({ id: created.user.id, pseudonym, is_admin: (count ?? 0) === 0 });
  if (e3) {
    await admin.auth.admin.deleteUser(created.user.id);
    return reply(409, { error: "Dieses Pseudonym ist schon vergeben." });
  }
  return reply(200, { ok: true, admin: (count ?? 0) === 0 });
}

async function adminReset(req: Request, body: Record<string, string>) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(jwt);
  if (!who?.user) return reply(401, { error: "Bitte anmelden." });
  const { data: me } = await admin.from("pp_profiles").select("is_admin").eq("id", who.user.id).single();
  if (!me?.is_admin) return reply(403, { error: "Nur für Admins." });
  const target = String(body.user_id ?? "");
  const { data: prof } = await admin.from("pp_profiles").select("id").eq("id", target).single();
  if (!prof) return reply(404, { error: "Mitglied nicht gefunden." });
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const rnd = crypto.getRandomValues(new Uint8Array(10));
  const password = Array.from(rnd, (b) => alphabet[b % alphabet.length]).join("");
  const { error } = await admin.auth.admin.updateUserById(target, { password });
  if (error) return reply(500, { error: "Passwort konnte nicht gesetzt werden." });
  return reply(200, { ok: true, password });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Nur POST." });
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { return reply(400, { error: "Ungültige Anfrage." }); }
  if (body.action === "register") return register(body);
  if (body.action === "admin_reset") return adminReset(req, body);
  return reply(400, { error: "Unbekannte Aktion." });
});
