"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 18 (Juni 2028): Kirschernte.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr18.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "18"
THEMA = "kirschernte"
TITEL = "Kirschernte im Obstgarten"

WEINROT = "#7a1f2b"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
GRUEN = "#4f8a3a"
WIESE = "#8fbf6a"
KIRSCHE = "#b5162b"
STROH = "#e3c26a"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("ballon", "Am Heißluftballon fehlt der Korb", (330, 79, 11)),
    ("vogel", "Im Kirschbaum fehlt der Vogel", (58, 40, 14)),
    ("kirschen", "Ein Kirschenpaar ist gelb statt rot", (151, 67, 12)),
    ("sprosse", "Der Leiter fehlt eine Sprosse", (193, 183, 13)),
    ("eimer", "Der Eimer an der Leiter ist grün statt blau", (227, 238, 14)),
    ("korb", "Der Kirschkorb hat keinen Henkel", (85, 236, 18)),
    ("kuchen", "Der Kirschkuchen hat kein Teiggitter", (280, 188, 20)),
    ("glas", "Dem Marmeladenglas fehlt der Deckel", (325, 168, 11)),
    ("hut", "Am Strohhut fehlt das rote Band", (369, 190, 13)),
    ("blume", "Im Gras blüht eine Blume weniger", (150, 282, 11)),
]


def kirschen(x, y, farbe=KIRSCHE):
    return (f'<path d="M{x - 3} {y + 4} Q{x - 2} {y - 4} {x + 1} {y - 7} M{x + 4} {y + 5} Q{x + 3} {y - 3} {x + 1} {y - 7}" '
            f'fill="none" stroke="{LINIE}" stroke-width="1.2"/>'
            f'<circle cx="{x - 3}" cy="{y + 5}" r="4" fill="{farbe}"/><circle cx="{x + 4}" cy="{y + 6}" r="4" fill="{farbe}"/>')


def blume(cx, cy, farbe):
    t = [f'<line x1="{cx}" y1="{cy}" x2="{cx}" y2="{cy + 12}" stroke="{GRUEN}" stroke-width="2"/>']
    for i in range(5):
        w = math.radians(i * 72)
        t.append(f'<circle cx="{cx + 4 * math.cos(w):.1f}" cy="{cy + 4 * math.sin(w):.1f}" r="3" fill="{farbe}"/>')
    t.append(f'<circle cx="{cx}" cy="{cy}" r="2" fill="#f6c94c"/>')
    return "".join(t)


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Himmel, Ballon, Hügel, Wiese
    a('<rect width="400" height="300" fill="#cfe6f2"/>')
    a('<ellipse cx="320" cy="196" rx="160" ry="40" fill="#a9cf86"/>')
    a(f'<rect x="0" y="190" width="400" height="110" fill="{WIESE}"/>')
    a('<path d="M330 66 Q310 48 312 36 A18 18 0 1 1 348 36 Q350 48 330 66 Z" fill="#d2453a"/>')
    a('<path d="M330 66 Q322 48 324 30 Q326 16 330 16 Q334 16 336 30 Q338 48 330 66 Z" fill="#f6c94c"/>')
    a(f'<path d="M326 66 L326 76 M334 66 L334 76" stroke="{LINIE}" stroke-width="1"/>')
    if "ballon" not in f:
        a(f'<rect x="325" y="75" width="10" height="9" rx="1" fill="{HOLZ}"/>')

    # Kirschbaum
    a(f'<path d="M110 240 L114 130 L100 108 M114 150 L140 112 L128 130 L130 240 Z" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="110" y="128" width="20" height="112" fill="{HOLZ_DUNKEL}"/>')
    for cx, cy, rx, ry in ((70, 80, 50, 40), (160, 80, 56, 44), (115, 50, 60, 36), (115, 112, 70, 26)):
        a(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{GRUEN}"/>')
    for x, y in ((40, 76), (92, 48), (150, 64), (186, 90), (78, 108), (132, 104), (176, 44), (52, 100), (116, 78)):
        a(kirschen(x, y, "#f2c12e" if ((x, y) == (150, 64) and "kirschen" in f) else KIRSCHE))
    if "vogel" not in f:
        a(f'<ellipse cx="58" cy="44" rx="10" ry="7" fill="#2d2d3a"/><circle cx="50" cy="37" r="5.5" fill="#2d2d3a"/>')
        a('<path d="M45 36 l-6 2 l6 2 z" fill="#f2b33d"/><circle cx="49" cy="36" r="1.2" fill="#fff"/>')
        a('<path d="M66 44 l9 -3 l-3 7 z" fill="#2d2d3a"/>')

    # Leiter mit Eimer
    for x0 in (200, 222):
        a(f'<line x1="{x0}" y1="272" x2="{x0 - 32}" y2="110" stroke="{HOLZ}" stroke-width="5" stroke-linecap="round"/>')
    for s in (0.1, 0.25, 0.4, 0.55, 0.7, 0.85):
        if s == 0.55 and "sprosse" in f:
            continue
        y = 272 - 162 * s
        a(f'<line x1="{200 - 32 * s:.1f}" y1="{y:.1f}" x2="{222 - 32 * s:.1f}" y2="{y:.1f}" stroke="{HOLZ}" stroke-width="4"/>')
    a(f'<path d="M213 224 Q227 214 239 226" fill="none" stroke="#555" stroke-width="1.5"/>')
    eimer = "#4f9a4a" if "eimer" in f else "#3a6ea8"
    a(f'<path d="M216 228 L238 228 L235 250 L219 250 Z" fill="{eimer}"/>')
    a(f'<ellipse cx="227" cy="228" rx="11" ry="3" fill="{KIRSCHE}"/>')

    # Korb mit Kirschen
    if "korb" not in f:
        a(f'<path d="M62 250 Q85 204 108 250" fill="none" stroke="{HOLZ_DUNKEL}" stroke-width="4"/>')
    for x in (70, 80, 90, 100, 75, 95, 85):
        a(f'<circle cx="{x}" cy="{246 if x in (75, 85, 95) else 250}" r="4.5" fill="{KIRSCHE}"/>')
    a(f'<path d="M58 250 L112 250 L104 276 L66 276 Z" fill="{STROH}" stroke="{HOLZ_DUNKEL}" stroke-width="1.5"/>')
    for y in (258, 267):
        a(f'<line x1="62" y1="{y}" x2="108" y2="{y}" stroke="{HOLZ}" stroke-width="1.5"/>')

    # Tisch mit Kuchen, Marmelade und Strohhut
    a(f'<rect x="250" y="200" width="146" height="8" fill="{HOLZ}"/>')
    for x in (258, 384):
        a(f'<rect x="{x}" y="208" width="6" height="66" fill="{HOLZ_DUNKEL}"/>')
    a('<ellipse cx="280" cy="198" rx="27" ry="4" fill="#fff" stroke="#c8bfb8"/>')
    a('<path d="M258 188 L258 194 Q280 202 302 194 L302 188 Z" fill="#d9a35e"/>')
    a(f'<ellipse cx="280" cy="188" rx="22" ry="7" fill="{KIRSCHE}"/>')
    if "kuchen" not in f:
        for dx in (-12, -4, 4, 12):
            a(f'<line x1="{280 + dx}" y1="{182 + abs(dx) / 4}" x2="{280 + dx}" y2="{194 - abs(dx) / 4}" stroke="#e8bf7a" stroke-width="2.5"/>')
        for dy in (-3, 3):
            a(f'<line x1="262" y1="{188 + dy}" x2="298" y2="{188 + dy}" stroke="#e8bf7a" stroke-width="2.5"/>')
    a('<rect x="316" y="174" width="18" height="25" rx="3" fill="#a3172c" stroke="#d6e1ea" stroke-width="1.5"/>')
    a('<rect x="319" y="182" width="12" height="9" fill="#fbf8f1"/>')
    if "glas" not in f:
        a('<rect x="314" y="166" width="22" height="8" rx="2" fill="#fff" stroke="#d2453a" stroke-width="1.5"/>')
        a('<path d="M318 166 v8 M322 166 v8 M326 166 v8 M330 166 v8" stroke="#d2453a" stroke-width="1.5"/>')
    a(f'<path d="M357 196 Q357 178 369 178 Q381 178 381 196 Z" fill="{STROH}"/>')
    if "hut" not in f:
        a(f'<rect x="357" y="188" width="24" height="5" fill="#d2453a"/>')
    a(f'<ellipse cx="369" cy="197" rx="21" ry="4" fill="{STROH}" stroke="{HOLZ}" stroke-width="1"/>')

    # Blumen in der Wiese
    for x, y, farbe in ((30, 276, "#fff"), (150, 280, "#e98a9a"), (238, 284, "#fff"), (320, 268, "#f6c94c"), (186, 262, "#fff")):
        if x == 150 and "blume" in f:
            continue
        a(blume(x, y, farbe))
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
