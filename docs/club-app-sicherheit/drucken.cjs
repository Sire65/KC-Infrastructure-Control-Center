// HTML → PDF mit dem vorinstallierten Chromium (Playwright)
const { chromium } = require("playwright");
const path = require("node:path");
(async () => {
  const b = await chromium.launch();
  const s = await b.newPage();
  await s.goto("file://" + path.join(__dirname, "club-app-sicherheit.html"));
  await s.pdf({ path: path.join(__dirname, "Club-App-Sicherheit-und-Datenschutz.pdf"), format: "A4", printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
