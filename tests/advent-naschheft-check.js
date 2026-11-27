// KICC-ADVENT-NASCHHEFT: Prüft Daten und Heft. Aufruf: node tests/advent-naschheft-check.js
// Baut das HTML neu (ohne PDF) und prüft Seitenzahl, Anleitungen, Platzhalter/Fotos und – falls vorhanden – die PDFs.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs", "advent-naschereien");
let fehler = 0; const ok = (b, t) => { console.log((b ? "OK   " : "FEHL ") + t); if (!b) fehler++; };
execFileSync("python3", [path.join(DIR, "bauen.py"), "--nur-html"], { stdio: "pipe" });
const html = readFileSync(path.join(DIR, "naschereien.html"), "utf8");
const seiten = (html.match(/<section class="seite/g) || []).length;
const rezepte = (html.match(/<section class="seite rezept"/g) || []).length;
ok(seiten % 4 === 0, `Seitenzahl ${seiten} ist Vielfaches von 4 (Heftdruck)`);
ok(rezepte === 45, `45 Anleitungen (gefunden ${rezepte})`);
const club = JSON.parse(readFileSync(path.join(DIR, "daten", "club-app-advent.json"), "utf8"));
ok(club.nasch.length === 23 && club.bastel.length === 12, "Club-App: 23 Naschereien + 12 Basteln/Deko");
for (const t of ["Hexenhaus aus Butterkeksen", "Lokomotive aus Dominosteinen", "Lebkuchen-Kerze mit Mandel-Flamme", "Schneemann aus Pfeffernüssen", "Engel aus Nudeln (Baumschmuck)"])
  ok(html.includes(t), `enthält „${t}“`);
const erg = JSON.parse(readFileSync(path.join(DIR, "daten", "ergaenzungen.json"), "utf8")).eintraege;
ok(erg.length === 10 && erg.every((e) => /^https:\/\//.test(e.link) && e.s.length >= 4 && e.z.length >= 3), "10 Ergänzungen mit Quelle, Zutaten und Schritten");
const csv = readFileSync(path.join(DIR, "fotos", "quellen.csv"), "utf8").trim().split("\n");
ok(csv.length === 46, "quellen.csv: Kopfzeile + 45 Zeilen");
ok(existsSync(path.join(DIR, "fotos", "AUFTRAG-CHATGPT.md")), "ChatGPT-Auftrag vorhanden");
ok(!/lecker\.de\/.*\.(jpg|png|webp)/i.test(html), "keine Fotos von Rezeptseiten eingebunden");
const pdfSeiten = (f) => (readFileSync(f, "latin1").match(/\/Type\s*\/Page(?!s)/g) || []).length;
const a5 = path.join(DIR, "Weihnachtliche-Naschereien-A5.pdf"), heft = path.join(DIR, "Weihnachtliche-Naschereien-Heft-A4-Druck.pdf");
if (existsSync(a5)) ok(pdfSeiten(a5) === seiten, `A5-PDF hat ${seiten} Seiten`);
if (existsSync(heft)) ok(pdfSeiten(heft) === seiten / 2, `Heft-PDF hat ${seiten / 2} Druckseiten`);
console.log(fehler ? `${fehler} Fehler` : "Alles in Ordnung");
process.exitCode = fehler ? 1 : 0;
