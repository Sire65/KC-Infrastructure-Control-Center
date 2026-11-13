"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 21 (September 2028): Kartoffelfeuer auf dem Acker.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr21.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "21"
THEMA = "kartoffelfeuer"
TITEL = "Kartoffelfeuer auf dem Acker"

WEINROT = "#7a1f2b"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
ACKER = "#a07850"
KARTOFFEL = "#d9b36a"
STROH = "#e3c26a"
STAHL = "#8aa0a8"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("drachen", "Der Drachen hat keinen Schwanz", (240, 88, 18)),
    ("muehle", "Die Windmühle hat einen Flügel weniger", (59, 89, 15)),
    ("hut", "Die Vogelscheuche hat keinen Hut", (150, 66, 14)),
    ("flicken", "Am Hemd fehlt der gelbe Flicken", (160, 130, 11)),
    ("kraehe", "Auf dem Arm sitzt keine Krähe", (184, 98, 12)),
    ("acker", "Auf dem Acker liegt eine Kartoffel weniger", (100, 182, 11)),
    ("rad", "Die Schubkarre hat kein Rad", (112, 266, 13)),
    ("glut", "In der Glut liegt eine Kartoffel weniger", (246, 254, 11)),
    ("becher", "Auf dem Baumstumpf fehlt der Becher", (316, 214, 11)),
    ("gabel", "Die Grabegabel hat drei statt vier Zinken", (254, 284, 13)),
]


def kartoffel(cx, cy, farbe=KARTOFFEL):
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="7" ry="5" fill="{farbe}" stroke="#a8823e" stroke-width="1"/>'
            f'<circle cx="{cx - 2}" cy="{cy - 1}" r="0.9" fill="#a8823e"/><circle cx="{cx + 3}" cy="{cy + 1}" r="0.9" fill="#a8823e"/>')


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Himmel, Drachen
    a('<rect width="400" height="300" fill="#d8e8f0"/>')
    a('<line x1="240" y1="44" x2="398" y2="150" stroke="#777" stroke-width="1"/>')
    a('<polygon points="240,16 258,40 240,72 222,40" fill="#d2453a"/>')
    a('<polygon points="240,16 258,40 240,40" fill="#f6c94c"/><polygon points="240,40 222,40 240,72" fill="#f6c94c"/>')
    if "drachen" not in f:
        a('<path d="M240 72 q-8 8 0 16 q8 8 0 16" fill="none" stroke="#555" stroke-width="1.2"/>')
        for y in (80, 96):
            a(f'<path d="M234 {y - 4} L246 {y + 4} L246 {y - 4} L234 {y + 4} Z" fill="#3a6ea8"/>')

    # Hügel mit Windmühle
    a('<path d="M0 132 Q80 104 170 120 Q260 100 400 124 L400 140 L0 140 Z" fill="#9cbf7a"/>')
    a('<path d="M60 128 L64 84 L76 84 L80 128 Z" fill="#fbf8f1"/><path d="M60 86 L70 72 L80 86 Z" fill="#8a4a3a"/>')
    for w in (45, 225, 315, 135):
        if w == 135 and "muehle" in f:
            continue
        r = math.radians(w)
        x2, y2 = 70 + 30 * math.cos(r), 78 + 30 * math.sin(r)
        a(f'<line x1="70" y1="78" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{HOLZ_DUNKEL}" stroke-width="5"/>')
    a(f'<circle cx="70" cy="78" r="3" fill="{LINIE}"/>')

    # Herbstbaum
    a(f'<rect x="352" y="80" width="14" height="124" fill="{HOLZ_DUNKEL}"/>')
    for cx, cy, rx, ry, farbe in ((340, 70, 30, 26, "#d9822b"), (380, 60, 30, 30, "#c8562b"), (360, 36, 30, 22, "#e3a33a"), (372, 96, 26, 16, "#d9822b")):
        a(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{farbe}"/>')

    # Acker mit Furchen
    a(f'<rect x="0" y="136" width="400" height="164" fill="{ACKER}"/>')
    for y in range(150, 300, 16):
        a(f'<path d="M0 {y} Q200 {y - 6} 400 {y}" fill="none" stroke="#8a6440" stroke-width="3"/>')
    for x, y in ((40, 178), (70, 186), (100, 182)):
        if x == 100 and "acker" in f:
            continue
        a(kartoffel(x, y))

    # Vogelscheuche
    a(f'<rect x="147" y="70" width="6" height="150" fill="{HOLZ}"/>')
    a(f'<rect x="112" y="106" width="76" height="6" fill="{HOLZ}"/>')
    a('<path d="M128 104 L172 104 L176 152 L124 152 Z" fill="#5b7fb0"/>')
    a('<path d="M128 104 L112 104 L112 116 L128 118 Z M172 104 L188 104 L188 116 L172 118 Z" fill="#5b7fb0"/>')
    a(f'<path d="M112 116 l-6 6 M112 116 l-2 8 M188 116 l6 6 M188 116 l2 8" stroke="{STROH}" stroke-width="2"/>')
    a('<path d="M138 104 L138 152 M162 104 L162 152" stroke="#4a6a98" stroke-width="1.5"/>')
    if "flicken" not in f:
        a('<rect x="154" y="124" width="12" height="12" fill="#f6c94c" stroke="#a8823e" stroke-width="1" stroke-dasharray="2 2"/>')
    a('<circle cx="150" cy="86" r="13" fill="#d9c08a"/>')
    a(f'<circle cx="145" cy="84" r="1.6" fill="{LINIE}"/><circle cx="155" cy="84" r="1.6" fill="{LINIE}"/>')
    a(f'<path d="M144 91 q6 4 12 0" fill="none" stroke="{LINIE}" stroke-width="1.5"/>')
    if "hut" not in f:
        a(f'<rect x="132" y="72" width="36" height="5" rx="2" fill="{HOLZ_DUNKEL}"/>')
        a(f'<path d="M140 73 L142 56 L158 56 L160 73 Z" fill="{HOLZ_DUNKEL}"/><rect x="141" y="66" width="18" height="4" fill="{WEINROT}"/>')
    if "kraehe" not in f:
        a(f'<ellipse cx="184" cy="99" rx="9" ry="6" fill="#2d2d3a"/><circle cx="191" cy="92" r="5" fill="#2d2d3a"/>')
        a('<path d="M195 91 l6 2 l-6 2 z" fill="#555"/><path d="M176 99 l-8 -2 l4 6 z" fill="#2d2d3a"/>')
        a(f'<path d="M183 105 v2 M187 105 v2" stroke="{LINIE}" stroke-width="1.5"/>')

    # Schubkarre mit Kartoffeln
    a(f'<path d="M30 248 L56 254 M56 254 L60 274 M90 260 L84 274" stroke="{HOLZ_DUNKEL}" stroke-width="4" stroke-linecap="round" fill="none"/>')
    for x, y in ((62, 236), (76, 233), (90, 236), (70, 228), (84, 228)):
        a(kartoffel(x, y))
    a('<path d="M50 238 L112 238 L100 262 L60 262 Z" fill="#4f8a3a"/>')
    if "rad" not in f:
        a(f'<circle cx="112" cy="266" r="10" fill="{LINIE}"/><circle cx="112" cy="266" r="3.5" fill="{STAHL}"/>')

    # Kartoffelfeuer
    for x, y in ((226, 214), (232, 196), (226, 178)):
        a(f'<circle cx="{x}" cy="{y}" r="{8 if y > 190 else 10}" fill="#e9e2d6" opacity="0.8"/>')
    a(f'<ellipse cx="230" cy="256" rx="34" ry="9" fill="#5a3b26"/>')
    for rx, ry, farbe in ((14, 22, "#ec8a2b"), (8, 14, "#f6c94c")):
        a(f'<ellipse cx="230" cy="{250 - ry}" rx="{rx}" ry="{ry}" fill="{farbe}"/>')
    a(f'<path d="M206 252 L254 240 M206 240 L254 252" stroke="{HOLZ_DUNKEL}" stroke-width="6" stroke-linecap="round"/>')
    for x, y in ((214, 256), (230, 259), (246, 255)):
        if x == 246 and "glut" in f:
            continue
        a(kartoffel(x, y, "#6f5030"))

    # Baumstumpf mit Becher
    a(f'<rect x="300" y="222" width="34" height="26" fill="{HOLZ}"/><ellipse cx="317" cy="222" rx="17" ry="5" fill="#c49a6c"/>')
    a(f'<ellipse cx="317" cy="222" rx="10" ry="3" fill="none" stroke="{HOLZ}" stroke-width="1"/>')
    if "becher" not in f:
        a(f'<rect x="309" y="206" width="14" height="16" rx="2" fill="#3a6ea8"/>')
        a(f'<path d="M323 210 q6 0 5 5 q-1 4 -5 3" fill="none" stroke="#3a6ea8" stroke-width="2"/>')

    # Grabegabel auf dem Boden
    a(f'<line x1="150" y1="285" x2="234" y2="285" stroke="{HOLZ}" stroke-width="5" stroke-linecap="round"/>')
    a(f'<path d="M142 279 L150 279 L150 291 L142 291 Z" fill="none" stroke="{HOLZ}" stroke-width="3"/>')
    a(f'<rect x="234" y="276" width="5" height="18" fill="{STAHL}"/>')
    zinken = (278, 284, 290) if "gabel" in f else (277, 282, 287, 292)
    for y in zinken:
        a(f'<line x1="239" y1="{y}" x2="268" y2="{y}" stroke="{STAHL}" stroke-width="2.5" stroke-linecap="round"/>')
    return "".join(t)


def svg(inhalt, titel):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" '
            f'aria-label="{titel}"><title>{titel}</title>{inhalt}</svg>\n')


def main():
    alle = frozenset(k for k, _, _ in FEHLER)
    a = szene()
    b = szene(alle)

    def nummer(i, x, y, r):
        # Ziffer rechts oben am Kreis, am Bildrand nach innen geklappt
        tx = x + r * 0.7 if x + r * 0.7 < 388 else x - r * 0.7 - 7
        ty = y - r * 0.7 if y - r * 0.7 > 11 else y + r * 0.7 + 9
        return (f'<text x="{tx:.0f}" y="{ty:.0f}" font-size="11" font-family="sans-serif" '
                f'font-weight="700" fill="#e0262f">{i + 1}</text>')

    kreise = "".join(
        f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="#e0262f" stroke-width="3"/>'
        + nummer(i, x, y, r)
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
    assert len({k for k, _, _ in FEHLER}) == 10, "Schlüssel doppelt"
    for k, _, (x, y, r) in FEHLER:
        assert szene(frozenset([k])) != a, f"Fehler {k} ändert nichts"
        assert 11 <= r <= 28 and r <= x <= 400 - r and r <= y <= 300 - r, f"Kreis {k} unpassend"
    for i, (k1, _, (x1, y1, r1)) in enumerate(FEHLER):
        for k2, _, (x2, y2, r2) in FEHLER[i + 1:]:
            assert math.hypot(x1 - x2, y1 - y2) > r1 + r2, f"Kreise {k1}/{k2} überschneiden sich"
    print(f"Fehlerbild Nr. {NR}: 10 Fehler, alle wirksam")


if __name__ == "__main__":
    main()
