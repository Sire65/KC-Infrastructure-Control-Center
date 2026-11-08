"""Baut den Prototyp der Rätsel-Ecke (index.html) für das Club-Magazin.

Ablauf: Fehlerbild und Kreuzwort neu erzeugen und prüfen, dann alles in EINE
HTML-Datei einbetten (läuft offline, ohne Server, ohne fremde Dienste).

Aufruf:  python3 bauen.py
"""
import json
from pathlib import Path

import fehlerbild
import kreuzwort

HIER = Path(__file__).resolve().parent


def svg_ohne_rahmen(name):
    s = (HIER / name).read_text(encoding="utf-8")
    return s[s.index(">", s.index("<svg")) + 1: s.rindex("</svg>")]


def main():
    fehlerbild.main()
    kreuzwort.main()
    kw = json.loads((HIER / "kreuzwort.json").read_text(encoding="utf-8"))
    fb = json.loads((HIER / "fehlerbild.json").read_text(encoding="utf-8"))
    html = (HIER / "vorlage.html").read_text(encoding="utf-8")
    html = (html.replace("/*KREUZWORT*/null", json.dumps(kw, ensure_ascii=False))
                .replace("/*FEHLER*/null", json.dumps(fb, ensure_ascii=False))
                .replace("<!--BILD_A-->", svg_ohne_rahmen("fehlerbild-a.svg"))
                .replace("<!--BILD_B-->", svg_ohne_rahmen("fehlerbild-b.svg")))
    assert "/*KREUZWORT*/" not in html and "<!--BILD_" not in html
    (HIER / "index.html").write_text(html, encoding="utf-8")
    print("index.html gebaut")


if __name__ == "__main__":
    main()
