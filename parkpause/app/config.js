// ParkPause – Verbindung zum eigenen Supabase-Projekt.
// Der "publishable"/anon-Schluessel ist zum Einbau in Web-Apps gedacht und darf oeffentlich sein:
// Er gibt nur das frei, was die Zugriffsregeln (RLS) der Datenbank erlauben.
// Der geheime Service-Schluessel gehoert NIE hierher.
window.PP_CONFIG = {
  supabaseUrl: "",      // z. B. https://abcd1234.supabase.co
  supabaseKey: "",      // Publishable key (sb_publishable_…) oder anon key
  vapidPublic: "",      // oeffentlicher Push-Schluessel (VAPID)
};
