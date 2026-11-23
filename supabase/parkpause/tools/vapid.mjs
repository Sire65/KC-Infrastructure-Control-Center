// Erzeugt ein VAPID-Schluesselpaar fuer Web-Push (ParkPause).
// Ausgabe: oeffentlicher Schluessel (kommt in parkpause/app/config.js) und privater Schluessel
// (NUR als Supabase-Funktions-Secret VAPID_PRIVATE hinterlegen, nie ins Repository).
// Aufruf: node supabase/parkpause/tools/vapid.mjs
import { generateKeyPairSync } from "node:crypto";
const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pub = publicKey.export({ format: "jwk" }), priv = privateKey.export({ format: "jwk" });
const b = (s) => Buffer.from(s, "base64url");
const raw = Buffer.concat([Buffer.from([4]), b(pub.x), b(pub.y)]).toString("base64url");
console.log("VAPID_PUBLIC=" + raw);
console.log("VAPID_PRIVATE=" + priv.d);
