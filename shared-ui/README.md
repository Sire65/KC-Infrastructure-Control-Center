# KC Shared UI

Zentrale, kleine Bausteinbibliothek fuer KC-Programme.

Ziel: Rundinstrumente, LEDs, Statusringe und weitere Dashboard-Komponenten nur einmal pflegen und in den Programmen austauschbar halten.

## Struktur

- `kc-ui.js` – gemeinsame JavaScript-Komponenten
- `kc-ui.css` – gemeinsames Styling
- `manifest.json` – Versionsstand und verfuegbare Komponenten

## Nutzung

Ein Programm bindet `kc-ui.css` und `kc-ui.js` ein und erzeugt die Instrumente ueber `KCUI`.

Beispiel:

```html
<link rel="stylesheet" href="./shared/kc-ui.css">
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
<script src="./shared/kc-ui.js"></script>
```

```js
KCUI.gauge(document.getElementById('latencyGauge'), {
  value: 42,
  min: 0,
  max: 250,
  unit: 'ms',
  label: 'Antwortzeit'
});
```

## Austauschregel

Programme sollen keine eigenen Gauge-Designs mehr duplizieren. Neue Versionen werden zuerst hier gepflegt und danach gezielt in die jeweiligen Programme uebernommen bzw. angebunden.

Aktuelle Bibliotheksversion: `0.1.0`.
