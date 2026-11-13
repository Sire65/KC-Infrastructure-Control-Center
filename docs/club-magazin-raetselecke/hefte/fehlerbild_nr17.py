"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 17 (Mai 2028): Maibaum und Biergarten.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr17.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "17"
THEMA = "biergarten"
TITEL = "Maibaum und Biergarten"

WEINROT = "#7a1f2b"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
GRUEN = "#4f8a3a"
GRUEN_DUNKEL = "#3f6e3a"
BIER = "#e8b23a"
ROT = "#c8362b"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("vogel", "Am Himmel fliegt ein Vogel weniger", (176, 24, 11)),
    ("band", "Am Maibaumkranz fehlt ein Band", (84, 88, 15)),
    ("schild", "Am Maibaum: Stern- statt Herzschild", (60, 152, 17)),
    ("bluete", "Am Kastanienbaum fehlt eine Blüte", (366, 70, 11)),
    ("lampion", "Ein Lampion ist grün statt orange", (190, 143, 13)),
    ("schaum", "Ein Bierkrug hat keinen Schaum", (160, 166, 12)),
    ("henkel", "Einem Bierkrug fehlt der Henkel", (284, 185, 11)),
    ("radieschen", "Auf dem Brett liegt ein Radieschen weniger", (232, 188, 11)),
    ("brezel", "Auf dem Teller fehlt die Brezel", (132, 189, 13)),
    ("bein", "Der Bank fehlt ein Bein", (303, 268, 13)),
]


def krug(cx, schaum, henkel):
    t = []
    if henkel:
        t.append(f'<path d="M{cx + 10} 176 q10 0 10 9 q0 9 -10 9" fill="none" stroke="#dfe9ec" stroke-width="4"/>')
    t.append(f'<rect x="{cx - 10}" y="170" width="20" height="30" rx="2" fill="{BIER}" stroke="#dfe9ec" stroke-width="2"/>')
    t.append(f'<line x1="{cx - 4}" y1="176" x2="{cx - 4}" y2="196" stroke="#f6d77a" stroke-width="2"/>')
    if schaum:
        t.append(f'<path d="M{cx - 11} 172 q-2 -8 5 -8 q3 -6 9 -2 q6 -4 8 3 q4 2 0 7 Z" fill="#fff"/>')
    return "".join(t)


def brezel(cx, cy, s, farbe, breite):
    return (f'<path d="M{cx - s} {cy + s} C{cx - 2.4 * s} {cy - 0.4 * s} {cx - s} {cy - 1.8 * s} {cx} {cy - 0.6 * s} '
            f'C{cx + s} {cy - 1.8 * s} {cx + 2.4 * s} {cy - 0.4 * s} {cx + s} {cy + s} '
            f'M{cx - s} {cy + s} L{cx + 0.4 * s} {cy - 0.2 * s} M{cx + s} {cy + s} L{cx - 0.4 * s} {cy - 0.2 * s}" '
            f'fill="none" stroke="{farbe}" stroke-width="{breite}" stroke-linecap="round"/>')


def herz(cx, cy, s, farbe):
    return (f'<path d="M{cx} {cy + s} C{cx - 2 * s} {cy - s / 2} {cx - s} {cy - 1.6 * s} '
            f'{cx} {cy - 0.6 * s} C{cx + s} {cy - 1.6 * s} {cx + 2 * s} {cy - s / 2} {cx} {cy + s}Z" fill="{farbe}"/>')


def stern(cx, cy, r, farbe, zacken=5):
    pkte = []
    for i in range(2 * zacken):
        rr = r if i % 2 == 0 else r * 0.45
        w = math.radians(-90 + i * 180 / zacken)
        pkte.append(f"{cx + rr * math.cos(w):.1f},{cy + rr * math.sin(w):.1f}")
    return f'<polygon points="{" ".join(pkte)}" fill="{farbe}"/>'


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Himmel, Vögel, Kiesboden
    a('<rect width="400" height="300" fill="#cfe6f2"/>')
    a('<rect x="0" y="206" width="400" height="94" fill="#e2d3b0"/>')
    for x, y in ((150, 32), (176, 24), (204, 36)):
        if (x, y) == (176, 24) and "vogel" in f:
            continue
        a(f'<path d="M{x - 7} {y - 3} q4 -4 7 2 q3 -6 7 -2" fill="none" stroke="{LINIE}" stroke-width="2" stroke-linecap="round"/>')

    # Kastanienbaum
    a(f'<rect x="330" y="120" width="16" height="92" fill="{HOLZ_DUNKEL}"/>')
    for cx, cy, rx, ry in ((300, 90, 42, 36), (360, 70, 44, 42), (330, 45, 46, 32), (370, 112, 30, 22), (300, 120, 30, 18)):
        a(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{GRUEN}"/>')
    for x, y in ((290, 64), (326, 34), (366, 70), (304, 104), (350, 108), (388, 40)):
        if (x, y) == (366, 70) and "bluete" in f:
            continue
        a(f'<ellipse cx="{x}" cy="{y}" rx="4" ry="8" fill="#fbf8f1"/><circle cx="{x}" cy="{y + 2}" r="1.5" fill="#e98a9a"/>')

    # Maibaum mit Krone, Kranz, Bändern und Schild
    a('<rect x="56" y="34" width="8" height="240" fill="#e9dcc0"/>')
    for y in range(80, 270, 22):
        a(f'<path d="M56 {y} L64 {y - 8} L64 {y - 2} L56 {y + 6} Z" fill="#3a6ea8"/>')
    for cx, cy, r in ((60, 22, 12), (49, 30, 9), (71, 30, 9), (60, 34, 8)):
        a(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{GRUEN_DUNKEL}"/>')
    for x, farbe in ((38, ROT), (50, "#f6c94c"), (70, "#3a6ea8"), (82, GRUEN)):
        if x == 82 and "band" in f:
            continue
        a(f'<path d="M{x} 66 q-5 9 0 18 q5 9 0 18 q-3 4 0 8" fill="none" stroke="{farbe}" stroke-width="4" stroke-linecap="round"/>')
    a(f'<ellipse cx="60" cy="64" rx="26" ry="6" fill="none" stroke="{GRUEN}" stroke-width="6"/>')
    a(f'<rect x="44" y="136" width="32" height="32" rx="3" fill="#fbf8f1" stroke="{HOLZ_DUNKEL}" stroke-width="2"/>')
    a(stern(60, 152, 11, ROT) if "schild" in f else herz(60, 154, 7, ROT))

    # Lampion-Kette vom Maibaum zum Baum
    a('<path d="M64 104 Q167 150 270 110" fill="none" stroke="#555" stroke-width="1.5"/>')
    for x in (110, 150, 190, 230):
        tt = (x - 64) / 206
        y = 104 * (1 - tt) ** 2 + 300 * tt * (1 - tt) + 110 * tt ** 2
        farbe = "#5aa05a" if (x == 190 and "lampion" in f) else "#ec8a2b"
        a(f'<line x1="{x}" y1="{y:.1f}" x2="{x}" y2="{y + 5:.1f}" stroke="#555" stroke-width="1.5"/>')
        a(f'<ellipse cx="{x}" cy="{y + 14:.1f}" rx="9" ry="10" fill="{farbe}"/>')
        a(f'<rect x="{x - 5}" y="{y + 3:.1f}" width="10" height="3" fill="{LINIE}"/><rect x="{x - 5}" y="{y + 23:.1f}" width="10" height="3" fill="{LINIE}"/>')

    # Fass am Baum
    a(f'<rect x="352" y="226" width="38" height="50" rx="8" fill="{HOLZ}"/>')
    for y in (236, 266):
        a(f'<rect x="352" y="{y}" width="38" height="4" fill="#555"/>')

    # Biertisch und Bank
    for x in (140, 280):
        a(f'<rect x="{x}" y="206" width="6" height="46" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="118" y="200" width="186" height="8" fill="{HOLZ}"/>')
    a(f'<rect x="108" y="250" width="206" height="7" fill="{HOLZ}"/>')
    for x in (118, 210, 300):
        if x == 300 and "bein" in f:
            continue
        a(f'<rect x="{x}" y="257" width="6" height="25" fill="{HOLZ_DUNKEL}"/>')

    # Brezel auf dem Teller
    a('<ellipse cx="132" cy="198" rx="12" ry="3" fill="#fff" stroke="#c8bfb8"/>')
    if "brezel" not in f:
        a(brezel(132, 188, 6, "#a8693a", 4))
    # Krüge
    a(krug(160, "schaum" not in f, True))
    a(krug(268, True, "henkel" not in f))
    # Brett mit Radieschen
    a(f'<rect x="196" y="194" width="48" height="6" rx="2" fill="#c49a6c"/>')
    for x in (208, 220, 232):
        if x == 232 and "radieschen" in f:
            continue
        a(f'<path d="M{x} 184 l-3 -7 M{x} 184 l3 -7" stroke="{GRUEN}" stroke-width="2"/>')
        a(f'<circle cx="{x}" cy="189" r="5" fill="#d2304a"/><circle cx="{x - 1.5}" cy="187.5" r="1.5" fill="#f6b0bc"/>')
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
