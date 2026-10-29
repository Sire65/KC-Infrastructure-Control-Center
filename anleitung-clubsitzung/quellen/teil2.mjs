// Teil 4 (2.751.0): Am Abend – Clubabend Live: Aktentasche, 📤 Unterlagen freigeben (und wie es beim Mitglied ankommt), Anwesenheit, Tagesordnung,
// ✅ Zum Schluss, als Letztes die Live-Abstimmung über den nächsten Termin (Klaus + Handy eines Mitglieds) · Teil 5: Hilfe – Hansi eine Nachricht schreiben
import { launch, seite, bild, tipp, speichern, SZENEN } from "./basis.mjs";
import { zustand, ABEND, TREFFEN } from "./demo.mjs";
const { S, antworten, eingang } = zustand();
// Stand vom Mittag: Sitzung vorbereitet, Einladung raus, Tasche gepackt (wie in Teil 1 aufgenommen)
const k = antworten("klaus"), sz = k.buero_sitzung();
k.buero_speichern({ anwesend: sz.standard.anwesend, anmerkung: sz.anmerkungVorschlag, tagesordnung: [...sz.standard.tagesordnung.slice(0, 5), { t: "Ausflug im Frühjahr: Spargelhof", art: "vorschlag", id: "V3" }, { t: "Termine 2027 festlegen", art: "eigen" }, sz.standard.tagesordnung[5]], zeilen: 5 });
k.buero_einladung({});
k.buero_speichern({ ...k.buero_sitzung().vorbereitung, teil: "vor" }); // Donnerstag: Sitzung vorbereitet (Teil 3)
k.aktentasche_aendern({ op: "packen", keys: ["tagesordnung", "protokoll:PR1", "protokoll:PR0", "vorschlag:V1", "vorschlag:V2", "teilnehmer", "aufgaben"] });
k.aktentasche_aendern({ op: "mitnehmen", titel: "Muster der neuen Schilder" }); k.aktentasche_aendern({ op: "mitnehmen", titel: "Getränkeproben" });
k.aktentasche_aendern({ op: "status", status: "gepackt" });
k.buero_einladung({ nur_offen: true }); // am Mittwoch erinnert (Teil 3)
const b = await launch();
const p = await seite(b, { zeit: ABEND, antworten: k, treffen: TREFFEN, aufgabe: true });
// 2.750.0: am Abend fragt die App beim Start „Clubabend öffnen?“ – die Kachel bleibt der zweite Weg
await p.locator("#buAufgabeBlatt").waitFor({ timeout: 20000 });
await bild(p, "c01-frage", '#buAufgabeBlatt [data-w="ja"]');
await tipp(p, '#buAufgabeBlatt [data-w="ja"]'); await p.waitForTimeout(1500);
await bild(p, "c02-clubabend", "#caBlatt .ca-tasche");
// KC-CLUB-CLUBABEND-ABSCHLUSS (2.751.0): Unterlagen während der Sitzung freigeben – in die Eingangskörbe der Mitglieder
await bild(p, "c02b-freigeben", '#caBlatt [data-k="frei"]');
await tipp(p, '#caBlatt [data-k="frei"]'); await p.waitForTimeout(2000);
await p.locator('#atFreiBlatt label:has-text("Tagesordnung") input').check(); await p.locator('#atFreiBlatt label:has-text("Zusagen") input').check();
await p.locator('#atFreiBlatt label:has-text("Tagesordnung")').evaluate((e) => e.scrollIntoView({ block: "start" })); await p.locator("#atFreiBlatt .blatt-innen").evaluate((e) => e.scrollBy(0, -40));
await bild(p, "c02c-frei-wahl", ['#atFreiBlatt label:has-text("Tagesordnung") input', '#atFreiBlatt label:has-text("Zusagen") input']);
await p.locator("#atFreiAn").evaluate((e) => e.scrollIntoView({ block: "center" }));
await bild(p, "c02d-frei-an", "#atFreiAn > .hl-chips");
await p.locator("#atFreiNotiz").click(); await p.locator("#atFreiNotiz").pressSequentially("Unterlagen zur heutigen Sitzung – zum Nachlesen.", { delay: 15 });
await p.locator("#atFreiLos").evaluate((e) => e.scrollIntoView({ block: "center" }));
await bild(p, "c02e-frei-senden", ["#atFreiReg", "#atFreiLos"]);
await tipp(p, "#atFreiLos"); await p.waitForTimeout(600);
await bild(p, "c02f-frei-frage", 'button:has-text("📤 Senden"):visible');
await p.locator('button:has-text("📤 Senden"):visible').last().click(); await p.waitForTimeout(9000);
await bild(p, "c02g-frei-gesendet");
await p.evaluate(() => $("atBlatt")?.remove()); await p.waitForTimeout(500);
// so kommt es beim Mitglied an (Erika)
const m = await seite(b, { zeit: ABEND, antworten: { ...antworten("erika"), ...eingang() }, treffen: TREFFEN });
await m.waitForTimeout(7000);
await bild(m, "c02h-mitglied-hinweis", 'button:has-text("Ja, ansehen")');
await tipp(m, 'button:has-text("Ja, ansehen")'); await m.waitForTimeout(4000);
await bild(m, "c02i-mitglied-ansehen", "#egVorschau");
await m.locator('#egBlatt [data-w="ab"]').scrollIntoViewIfNeeded();
await bild(m, "c02j-mitglied-frage", ['#egBlatt [data-w="ab"]', '#egBlatt [data-w="weg"]']);
await tipp(m, '#egBlatt [data-w="ab"]'); await m.waitForTimeout(800);
await bild(m, "c02k-mitglied-ablegen", ["#awOrdner", "#awReg"]);
await p.locator('#caBlatt details[data-ca="top"]').evaluate((e) => e.scrollIntoView({ block: "start" }));
await bild(p, "c03-top", '#caBlatt details[data-ca="top"]');
await tipp(p, '#caBlatt details[data-ca="da"] summary'); await p.waitForTimeout(500);
await p.locator('#caBlatt details[data-ca="da"]').evaluate((e) => e.scrollIntoView({ block: "start" }));
await bild(p, "c04-anwesend", "#caBlatt .ca-legende");
await bild(p, "c05-anwesend-leute", ['#caBlatt [data-da="P4"]', '#caBlatt [data-da="P8"]']);
await tipp(p, '#caBlatt [data-da="P4"]'); await p.waitForTimeout(900);
await tipp(p, '#caBlatt [data-da="P8"]'); await p.waitForTimeout(900);
await bild(p, "c06-anwesend-nach", ['#caBlatt [data-da="P4"]', '#caBlatt [data-da="P8"]']);
await p.locator('#caBlatt details[data-ca="top"]').evaluate((e) => e.scrollIntoView({ block: "start" }));
await tipp(p, '#caBlatt [data-top="0"]'); await p.waitForTimeout(900);
await tipp(p, '#caBlatt [data-top="1"]'); await p.waitForTimeout(900);
await p.locator('#caBlatt details[data-ca="top"]').evaluate((e) => e.scrollIntoView({ block: "start" }));
await bild(p, "c07-top-abgehakt", ['#caBlatt [data-top="0"]', '#caBlatt [data-top="1"]']);
// ✅ Zum Schluss: Abhak-Liste, als Letztes der nächste Termin
await p.evaluate(() => { const d = document.querySelector('#caBlatt details[data-ca="ab"]'); d.open = true; }); await p.waitForTimeout(400);
await p.locator('#caBlatt details[data-ca="ab"]').evaluate((e) => e.scrollIntoView({ block: "start" }));
await bild(p, "c07b-schluss", '#caBlatt details[data-ca="ab"]');
await tipp(p, '#caBlatt [data-ab="anwesend"]'); await p.waitForTimeout(900);
await tipp(p, '#caBlatt [data-ab="aufgaben"]'); await p.waitForTimeout(900);
await p.locator('#caBlatt details[data-ca="ab"]').evaluate((e) => e.scrollIntoView({ block: "start" }));
await bild(p, "c07c-schluss-abgehakt", ['#caBlatt [data-ab="anwesend"]', '#caBlatt [data-ab="aufgaben"]']);
await bild(p, "c08-termin-knopf", '#caBlatt [data-abk="termin"]');
await tipp(p, '#caBlatt [data-abk="termin"]'); await p.waitForTimeout(1200);
await bild(p, "c09-lt-form", ["#ltDatum", "#ltZeit", "#ltOrt"]);
await bild(p, "c10-lt-start", '#ltStartBlatt button:has-text("Live-Abstimmung starten")');
await tipp(p, '#ltStartBlatt button:has-text("Live-Abstimmung starten")'); await p.waitForTimeout(1500);
await bild(p, "c11-lt-leiter-leer", "#ltBlatt .lt-zahlen");
// Handy eines Mitglieds (Erika)
const e = await seite(b, { zeit: ABEND, antworten: antworten("erika"), treffen: TREFFEN });
await e.evaluate(() => ltHolen()); await e.waitForTimeout(1500);
await bild(e, "c12-mitglied", "#ltBlatt .lt-wahl");
await tipp(e, '#ltBlatt button:has-text("Ich kann")'); await e.waitForTimeout(800);
S.live.zahlen = { ja: 9, vielleicht: 1, nein: 1 };
S.live.namen = { ja: ["Bernd", "Erika", "Hans-Joachim", "Klara", "Klaus", "Lena", "Paul", "Uwe", "Moni"], vielleicht: ["Jens"], nein: ["Rita"] };
await e.evaluate(() => ltHolen()); await e.waitForTimeout(1000);
await bild(e, "c13-mitglied-ja", '#ltBlatt button:has-text("Ich kann")');
await p.evaluate(() => ltHolen()); await p.waitForTimeout(1200);
await p.locator("#ltBlatt .lt-zahlen").evaluate((x) => x.scrollIntoView({ block: "start" }));
await bild(p, "c14-leiter-ergebnis", ["#ltBlatt .lt-zahlen", "#ltBlatt .lt-namen"]);
await tipp(p, '#ltBlatt summary:has-text("Alternative")');
await p.locator("#ltAltDatum").evaluate((x) => x.scrollIntoView({ block: "center" }));
await bild(p, "c15-alternative", ["#ltAltDatum", '#ltBlatt button:has-text("Diesen Termin zur Abstimmung")']);
await tipp(p, '#ltBlatt summary:has-text("Alternative")');
await p.locator('#ltBlatt button:has-text("Termin annehmen")').evaluate((x) => x.scrollIntoView({ block: "center" }));
await bild(p, "c16-annehmen", '#ltBlatt button:has-text("Termin annehmen")');
await tipp(p, '#ltBlatt button:has-text("Termin annehmen")'); await p.waitForTimeout(700);
await bild(p, "c17-festlegen-frage", 'button:has-text("Festlegen")');
await tipp(p, 'button:has-text("Festlegen")'); await p.waitForTimeout(1500);
await bild(p, "c18-festgelegt");
await e.evaluate(() => ltHolen()); await e.waitForTimeout(1500);
await bild(e, "c19-mitglied-kalender", 'button:has-text("in meinen Kalender")');
// Teil 4: Hansi um Hilfe bitten (Büro → Nachricht & Mail → Hansi → Nachricht in der App)
const h = await seite(b, { zeit: "2026-10-30T12:40:00+01:00", antworten: k });
await tipp(h, '#raster .kachel[data-id="buero"]'); await h.waitForTimeout(1500);
const p2 = h;
await p2.locator("#v-buero .bu-post").evaluate((x) => x.scrollIntoView({ block: "center" }));
await bild(p2, "d01-post", "#v-buero .bu-post");
await tipp(p2, "#v-buero .bu-post"); await p2.waitForTimeout(1000);
await bild(p2, "d02-wer", '#buTelListe [data-p="P9"]');
await tipp(p2, '#buTelListe [data-p="P9"]'); await p2.waitForTimeout(1000);
await bild(p2, "d03-wie", '#buTelBlatt [data-w="app"]');
await tipp(p2, '#buTelBlatt [data-w="app"]'); await p2.waitForTimeout(1500);
await p2.locator("#text").click(); await p2.locator("#text").pressSequentially("Hallo Hansi, bei der Clubsitzung ist mir noch etwas unklar. Kannst du mich bitte kurz unterstützen? Danke, Klaus", { delay: 15 });
await bild(p2, "d04-nachricht", "#text");
await b.close();
speichern("szenen-2.json");
