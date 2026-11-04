// Vertragstests wie in der Club-App: Versionsvertrag, Service Worker, keine Geheimnisse, Sicherheitsregeln.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const lies = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");

test("Versionsvertrag: app.js, sw.js, version.json und index.html nennen dieselbe Version", () => {
  const app = lies("app.js").match(/const APP_VERSION = "([^"]+)"/)[1];
  const sw = lies("sw.js").match(/const VERSION = "([^"]+)"/)[1];
  const vj = JSON.parse(lies("version.json")).version;
  assert.equal(sw, app);
  assert.equal(vj, app);
  const idx = lies("index.html");
  const vs = [...idx.matchAll(/\?v=([0-9.]+)/g)].map((m) => m[1]);
  assert.ok(vs.length >= 4);
  assert.ok(vs.every((v) => v === app), "alle ?v= in index.html = " + app);
  assert.ok(idx.includes(`data-v="${app}"`));
});

test("Service Worker speichert alle Programmdateien der Version", () => {
  const sw = lies("sw.js");
  for (const f of ["styles.css", "logik.js", "daten.js", "app.js", "frootie.svg", "manifest.webmanifest"]) assert.ok(sw.includes(f), f);
  for (const f of ["frootie.svg", "icon-192.png", "icon-512.png", "manifest.webmanifest"]) assert.ok(fs.existsSync(path.join(__dirname, "..", f)), f + " fehlt");
});

test("Sicherheit: Content-Security-Policy ohne fremde Skripte, keine Schlüssel im Code", () => {
  const idx = lies("index.html");
  assert.match(idx, /Content-Security-Policy/);
  assert.match(idx, /script-src 'self';/);
  for (const f of ["app.js", "logik.js", "daten.js", "sw.js", "index.html"]) {
    const t = lies(f);
    assert.doesNotMatch(t, /eyJ[a-zA-Z0-9_-]{20,}/, f + ": JWT im Code");
    assert.doesNotMatch(t, /(sk|service_role)[_-][a-zA-Z0-9]{16,}/, f + ": Schlüssel im Code");
    assert.doesNotMatch(t, /innerHTML\s*=\s*[^`$]*\+\s*\w+\.value/, f + ": Eingabe ungeprüft ins HTML");
  }
});

test("Jede Ansicht hat einen Frootie-Hilfetext oder ist eine Unterseite", () => {
  const app = lies("app.js");
  const tipps = app.match(/const FROOTIE_TIPPS = \{([\s\S]*?)\n  \};/)[1];
  for (const k of ["dienst", "wuensche", "krank", "urlaub", "stechuhr", "hygiene", "rezepte", "quiz", "plan", "hygregeln", "ma", "regeln"]) assert.ok(new RegExp(`\\b${k}:`).test(tipps), "Hilfetext fehlt: " + k);
});
