#!/usr/bin/env bash
# Alle Kapitel nacheinander neu erzeugen (Stimme → Aufnahme → Handy + Beamer). Nacheinander, damit die Aufnahme flüssig bleibt.
set -e
for k in "$@"; do
  echo "=== $k"; python3 vo.py $k.json 2>&1 | grep -v "Missing phoneme"
  node aufnahme.mjs $k.json 2>&1 | grep -E "⚠️|Bilder|Fehler" || true
  node bau.mjs $k.json 2>&1 | grep -E "fertig|Error" || true
done
echo ALLES FERTIG
