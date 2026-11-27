// KICC-ADVENT-NASCHHEFT: naschereien.html -> Weihnachtliche-Naschereien-A5.pdf (Playwright/Chromium, vorinstalliert)
// Prüft vorher, dass keine Seite überläuft (Text abgeschnitten) – sonst Abbruch.
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch();
  const s = await b.newPage();
  await s.goto("file://" + path.join(__dirname, "naschereien.html"));
  await s.evaluate(() => document.fonts.ready);
  const zuViel = await s.evaluate(() => [...document.querySelectorAll(".seite")].map((el, i) => {
    const f = el.querySelector(".fuss"); const grenze = f ? f.getBoundingClientRect().top : el.getBoundingClientRect().bottom;
    const tiefst = Math.max(...[...el.querySelectorAll(".tipp, .schritte, .zut, .liste, .q, .zeile, p, ul")].map((x) => x.getBoundingClientRect().bottom), 0);
    return tiefst > grenze + 0.5 ? `Seite ${i + 1}: ${Math.round(tiefst - grenze)} px zu lang` : null;
  }).filter(Boolean));
  if (zuViel.length) { console.error("Überlauf:\n" + zuViel.join("\n")); process.exitCode = 1; }
  await s.pdf({ path: path.join(__dirname, "Weihnachtliche-Naschereien-A5.pdf"), preferCSSPageSize: true, printBackground: true });
  await b.close();
  console.log("PDF A5 geschrieben" + (zuViel.length ? " (mit Überlauf!)" : ""));
})();
