"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 11 (November 2027): Martinsgans am Pass im Restaurant.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr11.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "11"
THEMA = "martinsgans"
TITEL = "Martinsgans am Pass"

WEINROT = "#7a1f2b"
BEIGE = "#f3ead8"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
STAHL = "#c3cbcf"
STAHL_DUNKEL = "#8f9a9f"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("bon", "An der Bonleiste hängt ein Zettel weniger", (88, 38, 23)),
    ("lampe", "Eine Wärmelampe ist aus", (180, 92, 24)),
    ("mond", "Vollmond statt Mondsichel", (306, 40, 16)),
    ("laterne", "Eine Laterne leuchtet blau statt rot", (350, 84, 16)),
    ("kloss", "Auf dem Teller liegt ein Kloß weniger", (124, 158, 13)),
    ("apfel", "Auf der Platte fehlt ein Bratapfel", (160, 159, 13)),
    ("schuessel", "Die Wirsingschüssel ist golden statt rot", (296, 158, 27)),
    ("klingel", "Die Klingel ist silbern statt golden", (362, 161, 17)),
    ("tuch", "Das Geschirrtuch hat blaue Streifen", (40, 205, 27)),
    ("griff", "An der mittleren Tür fehlt der Griff", (200, 207, 20)),
]


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Wand, Fliesen hinter dem Pass, Decke, Boden
    a(f'<rect width="400" height="300" fill="{BEIGE}"/>')
    a('<rect x="0" y="112" width="400" height="62" fill="#dfe7ea"/>')
    for x in range(0, 401, 25):
        a(f'<line x1="{x}" y1="112" x2="{x}" y2="174" stroke="#c4d0d4" stroke-width="1"/>')
    for y in (133, 154):
        a(f'<line x1="0" y1="{y}" x2="400" y2="{y}" stroke="#c4d0d4" stroke-width="1"/>')
    a(f'<rect x="0" y="0" width="400" height="8" fill="{HOLZ_DUNKEL}"/>')
    a('<rect x="0" y="288" width="400" height="12" fill="#6d6560"/>')

    # Bonleiste mit Zetteln (nur Striche, keine Schrift)
    a(f'<rect x="12" y="17" width="142" height="6" rx="2" fill="{STAHL_DUNKEL}"/>')
    zettel = [22, 50, 106, 128] if "bon" in f else [22, 50, 78, 106, 128]
    for x in zettel:
        a(f'<rect x="{x}" y="21" width="20" height="34" fill="#fffdf6" stroke="#d6cfbf"/>')
        for y in (29, 35, 41):
            a(f'<line x1="{x + 4}" y1="{y}" x2="{x + 16}" y2="{y}" stroke="#9aa5aa" stroke-width="2"/>')
        a(f'<line x1="{x + 4}" y1="47" x2="{x + 11}" y2="47" stroke="{WEINROT}" stroke-width="2"/>')

    # Zwei Wärmelampen über dem Pass
    for x in (180, 240):
        a(f'<line x1="{x}" y1="8" x2="{x}" y2="72" stroke="{LINIE}" stroke-width="2"/>')
        an = not (x == 180 and "lampe" in f)
        if an:
            a(f'<ellipse cx="{x}" cy="96" rx="20" ry="9" fill="#ffb347" opacity="0.55"/>')
        a(f'<path d="M{x - 8} 72 L{x + 8} 72 L{x + 18} 90 L{x - 18} 90 Z" fill="{WEINROT}"/>')
        a(f'<ellipse cx="{x}" cy="91" rx="14" ry="4" fill="{"#ff7a2a" if an else "#777"}"/>')

    # Fenster: Nacht, Mond, Dächer, Laternen
    a('<rect x="285" y="18" width="103" height="100" fill="#1f2f57"/>')
    for sx, sy in ((340, 30), (372, 46), (330, 58), (360, 24)):
        a(f'<circle cx="{sx}" cy="{sy}" r="1.6" fill="#fff6c9"/>')
    a('<circle cx="306" cy="40" r="11" fill="#f6e7a6"/>')
    if "mond" not in f:
        a('<circle cx="312" cy="35" r="10" fill="#1f2f57"/>')
    a('<path d="M285 118 L285 104 L300 96 L312 104 L312 100 L330 100 L330 106 L345 98 L360 106 '
      'L372 100 L388 108 L388 118 Z" fill="#14203d"/>')
    laternen = [(325, 92, GOLD), (350, 84, "#3f7fbf" if "laterne" in f else "#d2453a"), (372, 94, "#e8902f")]
    for x, y, farbe in laternen:
        a(f'<line x1="{x - 6}" y1="118" x2="{x}" y2="{y - 12}" stroke="#5a4636" stroke-width="2"/>')
        a(f'<circle cx="{x}" cy="{y}" r="11" fill="{farbe}" opacity="0.35"/>')
        a(f'<circle cx="{x}" cy="{y}" r="7.5" fill="{farbe}"/>')
        a(f'<line x1="{x}" y1="{y - 7}" x2="{x}" y2="{y - 12}" stroke="#5a4636" stroke-width="1.5"/>')
    a('<rect x="285" y="18" width="103" height="100" fill="none" stroke="#fbf8f1" stroke-width="5"/>')

    # Pass (Edelstahl-Theke) mit Türen, Griffen und Geschirrtuch
    a(f'<rect x="0" y="182" width="400" height="106" fill="#aeb6bb"/>')
    a(f'<rect x="0" y="172" width="400" height="10" fill="{STAHL}"/>')
    a(f'<line x1="0" y1="182" x2="400" y2="182" stroke="{STAHL_DUNKEL}" stroke-width="2"/>')
    for x in (20, 145, 270):
        a(f'<rect x="{x}" y="195" width="110" height="85" rx="3" fill="none" stroke="{STAHL_DUNKEL}" stroke-width="2"/>')
        if not (x == 145 and "griff" in f):
            a(f'<rect x="{x + 40}" y="203" width="30" height="7" rx="3" fill="#6d777c"/>')
    a('<rect x="26" y="179" width="28" height="48" rx="2" fill="#fbf8f1" stroke="#d6cfbf"/>')
    streifen = "#2f6f8f" if "tuch" in f else WEINROT
    for y in (188, 196, 212, 220):
        a(f'<rect x="26" y="{y}" width="28" height="4" fill="{streifen}"/>')
    a(f'<rect x="24" y="178" width="32" height="4" rx="2" fill="{STAHL_DUNKEL}"/>')

    # Sauciere links
    a('<path d="M14 160 L56 160 Q54 172 35 172 Q16 172 14 160 Z" fill="#fbf8f1" stroke="#c9c2b2"/>')
    a('<path d="M56 160 l10 -5" stroke="#c9c2b2" stroke-width="3" stroke-linecap="round"/>')
    a('<path d="M14 162 q-7 0 -6 6" fill="none" stroke="#c9c2b2" stroke-width="3"/>')
    a('<ellipse cx="35" cy="160" rx="21" ry="3" fill="#7a4a24"/>')

    # Teller mit Rotkohl und Klößen
    a('<ellipse cx="104" cy="168" rx="36" ry="8" fill="#fbf8f1" stroke="#c9c2b2"/>')
    a('<ellipse cx="90" cy="161" rx="15" ry="8" fill="#6b2a5e"/>')
    a('<path d="M80 160 q5 -4 10 0 q5 -4 10 0" fill="none" stroke="#8d3f7c" stroke-width="2"/>')
    kloesse = [108] if "kloss" in f else [108, 124]
    for x in kloesse:
        a(f'<circle cx="{x}" cy="158" r="8" fill="#e6cc8e" stroke="#a8884a" stroke-width="1.5"/>')

    # Platte mit Martinsgans und Bratäpfeln
    a(f'<ellipse cx="205" cy="168" rx="56" ry="9" fill="#fbf8f1" stroke="{GOLD}" stroke-width="3"/>')
    a('<ellipse cx="205" cy="150" rx="32" ry="17" fill="#b8743a"/>')
    a('<ellipse cx="198" cy="143" rx="16" ry="6" fill="#d39a5a"/>')
    for s in (-1, 1):
        x = 205 + s * 28
        a(f'<ellipse cx="{x}" cy="158" rx="9" ry="6" fill="#a2622d"/>')
        a(f'<line x1="{x}" y1="158" x2="{x + s * 9}" y2="149" stroke="#efe3c8" stroke-width="3"/>')
        a(f'<path d="M{x + s * 9 - 4} 148 l2 -4 l2 3 l2 -3 l2 4 z" fill="#fff"/>')
    a('<path d="M200 135 l8 -4 M204 133 l1 -5 M206 134 l5 -1" stroke="#5b7a46" stroke-width="2" stroke-linecap="round"/>')
    aepfel = [250] if "apfel" in f else [160, 250]
    for x in aepfel:
        a(f'<circle cx="{x}" cy="161" r="8" fill="#b8362b"/>'
          f'<line x1="{x}" y1="153" x2="{x + 1}" y2="149" stroke="{HOLZ_DUNKEL}" stroke-width="2"/>')

    # Wirsingschüssel
    a('<circle cx="288" cy="146" r="9" fill="#7fa64a"/><circle cx="304" cy="145" r="10" fill="#8db556"/>'
      '<circle cx="296" cy="140" r="9" fill="#9bc163"/>')
    a('<path d="M288 140 q4 4 8 0 q4 4 8 0" fill="none" stroke="#5e8434" stroke-width="1.5"/>')
    schuessel = GOLD if "schuessel" in f else WEINROT
    a(f'<path d="M272 150 L320 150 Q318 172 296 172 Q274 172 272 150 Z" fill="{schuessel}"/>')

    # Service-Klingel
    a('<rect x="346" y="166" width="32" height="6" rx="2" fill="#4a4a4a"/>')
    klingel = "#b9c3c7" if "klingel" in f else GOLD
    a(f'<path d="M349 166 a13 13 0 0 1 26 0 z" fill="{klingel}"/>')
    a('<rect x="359" y="148" width="6" height="5" rx="1" fill="#4a4a4a"/>')
    return "".join(t)


def svg(inhalt, titel):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" '
            f'aria-label="{titel}"><title>{titel}</title>{inhalt}</svg>\n')


def main():
    alle = frozenset(k for k, _, _ in FEHLER)
    a = szene()
    b = szene(alle)
    kreise = "".join(
        f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="#e0262f" stroke-width="3"/>'
        f'<text x="{x + r * 0.7:.0f}" y="{y - r * 0.7:.0f}" font-size="11" font-family="sans-serif" '
        f'font-weight="700" fill="#e0262f">{i + 1}</text>'
        for i, (_, _, (x, y, r)) in enumerate(FEHLER))
    basis = f"nr{NR}-{THEMA}"
    (HIER / f"{basis}-a.svg").write_text(svg(a, f"{TITEL} – Bild A"), encoding="utf-8")
    (HIER / f"{basis}-b.svg").write_text(svg(b, f"{TITEL} – Bild B"), encoding="utf-8")
    (HIER / f"{basis}-loesung.svg").write_text(
        svg(b + kreise, f"{TITEL} – Lösung mit 10 markierten Fehlern"), encoding="utf-8")
    (HIER / f"nr{NR}-fehlerbild.json").write_text(json.dumps(
        {"titel": "Finde die 10 Fehler", "thema": THEMA,
         "fehler": [[x, y, r, txt] for _, txt, (x, y, r) in FEHLER]},
        ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    # Selbstprüfung: genau 10, jeder Fehler allein wirksam, Kreise passend und ohne Überschneidung
    assert len(FEHLER) == 10
    for k, _, (x, y, r) in FEHLER:
        assert szene(frozenset([k])) != a, f"Fehler {k} ändert nichts"
        assert 12 <= r <= 28 and r <= x <= 400 - r and r <= y <= 300 - r, f"Kreis {k} unpassend"
    for i, (k1, _, (x1, y1, r1)) in enumerate(FEHLER):
        for k2, _, (x2, y2, r2) in FEHLER[i + 1:]:
            assert math.hypot(x1 - x2, y1 - y2) > r1 + r2, f"Kreise {k1}/{k2} überschneiden sich"
    print(f"Fehlerbild Nr. {NR}: 10 Fehler, alle wirksam")


if __name__ == "__main__":
    main()
