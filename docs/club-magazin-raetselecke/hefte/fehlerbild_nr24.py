"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 24 (Dezember 2028): Grünkohl auf dem Weihnachtsmarkt.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr24.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "24"
THEMA = "weihnachtsmarkt"
TITEL = "Grünkohl auf dem Weihnachtsmarkt"

WEINROT = "#7a1f2b"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
TANNE = "#3f6e3a"
SCHNEE = "#f4f7fb"
NACHT = "#24345a"
KOHL = "#4f7a3a"
LEBKUCHEN = "#a0612e"
KARTOFFEL = "#e3c27a"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("himmel", "Am Himmel fehlt ein Stern", (370, 30, 11)),
    ("stern", "Auf dem Budendach fehlt der Stern", (220, 28, 14)),
    ("licht", "Ein Lämpchen der Lichterkette ist blau", (245, 100, 11)),
    ("herz", "Am Lebkuchenherz fehlt die Zuckerschrift", (150, 126, 15)),
    ("wurst", "Im Grünkohl fehlt die Mettwurst", (208, 147, 13)),
    ("kelle", "Im Kessel steckt keine Kelle", (253, 130, 13)),
    ("fuss", "Dem Kessel fehlt ein Fuß", (248, 201, 11)),
    ("tasse", "Eine Glühweintasse ist grün statt rot", (161, 191, 11)),
    ("kartoffel", "Auf dem Teller liegt eine Kartoffel weniger", (306, 190, 11)),
    ("kugel", "Am Tannenbaum fehlt eine Kugel", (377, 186, 11)),
]


def stern(cx, cy, r, farbe, zacken=5):
    pkte = []
    for i in range(2 * zacken):
        rr = r if i % 2 == 0 else r * 0.45
        w = math.radians(-90 + i * 180 / zacken)
        pkte.append(f"{cx + rr * math.cos(w):.1f},{cy + rr * math.sin(w):.1f}")
    return f'<polygon points="{" ".join(pkte)}" fill="{farbe}"/>'


def herz(cx, cy, s, farbe, zucker=True):
    t = (f'<path d="M{cx} {cy + s} C{cx - 2 * s} {cy - s / 2} {cx - s} {cy - 1.6 * s} '
         f'{cx} {cy - 0.6 * s} C{cx + s} {cy - 1.6 * s} {cx + 2 * s} {cy - s / 2} {cx} {cy + s}Z" fill="{farbe}"/>')
    if zucker:
        t += (f'<path d="M{cx - 7} {cy - 2} q3 4 7 0 q4 -4 7 0 M{cx - 5} {cy + 3} q5 3 10 0" fill="none" '
              f'stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>')
    return t


def tasse(cx, farbe):
    return (f'<path d="M{cx + 6} 186 q7 0 7 6 q0 6 -7 6" fill="none" stroke="{farbe}" stroke-width="2.5"/>'
            f'<rect x="{cx - 7}" y="182" width="14" height="18" rx="2" fill="{farbe}"/>'
            f'<rect x="{cx - 7}" y="188" width="14" height="3" fill="#fbf8f1"/>')


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Nachthimmel mit Sternen, Schneeboden
    a(f'<rect width="400" height="300" fill="{NACHT}"/>')
    for x, y in ((28, 28), (70, 58), (330, 56), (370, 30), (16, 96), (390, 92)):
        if (x, y) == (370, 30) and "himmel" in f:
            continue
        a(stern(x, y, 5, "#f6e7b0"))
    for x, y in ((50, 20), (110, 40), (300, 22), (260, 60), (180, 70), (14, 150), (90, 180), (384, 130)):
        a(f'<circle cx="{x}" cy="{y}" r="1.8" fill="#fff"/>')
    a(f'<rect x="0" y="250" width="400" height="50" fill="{SCHNEE}"/>')

    # Straßenlaterne
    a(f'<rect x="48" y="118" width="6" height="140" fill="{LINIE}"/>')
    a('<rect x="40" y="98" width="22" height="22" rx="2" fill="#fff3b0" stroke="#3b2a20" stroke-width="2.5"/>')
    a(f'<path d="M37 98 L51 86 L65 98 Z" fill="{LINIE}"/><path d="M38 96 L51 85 L64 96" fill="none" stroke="{SCHNEE}" stroke-width="3"/>')

    # Bude: Rückwand, Pfosten, Dach mit Schnee, Stern
    a(f'<rect x="115" y="96" width="210" height="110" fill="{HOLZ_DUNKEL}"/>')
    for x in range(130, 325, 18):
        a(f'<line x1="{x}" y1="96" x2="{x}" y2="206" stroke="#5f3f28" stroke-width="1.5"/>')
    for x in (112, 322):
        a(f'<rect x="{x}" y="92" width="10" height="160" fill="{HOLZ}"/>')
    a(f'<polygon points="98,94 220,42 342,94" fill="{WEINROT}"/>')
    a(f'<polyline points="100,92 220,40 340,92" fill="none" stroke="{SCHNEE}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>')
    a(f'<rect x="216" y="38" width="8" height="6" fill="{HOLZ_DUNKEL}"/>')
    if "stern" not in f:
        a(stern(220, 27, 12, GOLD))
    # Lichterkette
    a('<path d="M104 94 Q160 104 220 96 Q280 104 336 94" fill="none" stroke="#222" stroke-width="1.2"/>')
    for x in range(105, 340, 20):
        farbe = "#5b8fd6" if (x == 245 and "licht" in f) else "#ffd86b"
        a(f'<ellipse cx="{x}" cy="102" rx="3.5" ry="4.5" fill="{farbe}"/>')

    # Lebkuchenherzen
    for x, zucker in ((150, "herz" not in f), (290, True)):
        a(f'<line x1="{x}" y1="104" x2="{x}" y2="116" stroke="#e98a9a" stroke-width="1.5"/>')
        a(herz(x, 128, 11, LEBKUCHEN, zucker))

    # Kessel mit Grünkohl, Wurst und Kelle
    for x in (192, 248):
        if x == 248 and "fuss" in f:
            continue
        a(f'<rect x="{x - 3}" y="192" width="6" height="12" fill="#222"/>')
    a('<path d="M178 152 Q178 198 220 198 Q262 198 262 152 Z" fill="#333"/>')
    a('<rect x="174" y="148" width="92" height="8" rx="3" fill="#555"/>')
    a(f'<ellipse cx="220" cy="149" rx="40" ry="6" fill="{KOHL}"/>')
    for x, y in ((206, 146), (226, 145), (240, 147)):
        a(f'<circle cx="{x}" cy="{y}" r="3" fill="#3f6a2f"/>')
    if "wurst" not in f:
        a('<path d="M196 148 Q208 136 222 148" fill="none" stroke="#8a3a2a" stroke-width="7" stroke-linecap="round"/>')
    if "kelle" not in f:
        a('<line x1="240" y1="150" x2="260" y2="118" stroke="#9aa5aa" stroke-width="4" stroke-linecap="round"/>')
        a('<circle cx="261" cy="115" r="3.5" fill="none" stroke="#9aa5aa" stroke-width="2.5"/>')
    for y in (164, 176):
        a(f'<path d="M184 {y} Q220 {y + 6} 256 {y}" fill="none" stroke="#444" stroke-width="2"/>')

    # Theke mit Tannengirlande
    a(f'<rect x="112" y="204" width="220" height="48" fill="{HOLZ}"/>')
    for x in range(124, 332, 22):
        a(f'<line x1="{x}" y1="208" x2="{x}" y2="252" stroke="{HOLZ_DUNKEL}" stroke-width="1.5"/>')
    a(f'<rect x="108" y="200" width="228" height="6" fill="#c49a6c"/>')
    for x in range(116, 336, 14):
        a(f'<ellipse cx="{x}" cy="210" rx="9" ry="4" fill="{TANNE}"/>')
    for x in (150, 222, 294):
        a(f'<circle cx="{x}" cy="211" r="3.5" fill="#c8362b"/>')

    # Glühweintassen
    a(tasse(139, "#c8362b"))
    a(tasse(161, "#4f9a4a" if "tasse" in f else "#c8362b"))

    # Teller mit Grünkohl und Kartoffeln
    a('<ellipse cx="296" cy="198" rx="22" ry="4" fill="#fff" stroke="#c8bfb8"/>')
    a(f'<ellipse cx="288" cy="193" rx="10" ry="5" fill="{KOHL}"/>')
    for x, y in ((300, 194), (306, 190), (311, 195)):
        if (x, y) == (306, 190) and "kartoffel" in f:
            continue
        a(f'<ellipse cx="{x}" cy="{y}" rx="5" ry="4" fill="{KARTOFFEL}" stroke="#b8963e" stroke-width="1"/>')

    # Tannenbaum
    a(f'<rect x="364" y="236" width="10" height="18" fill="{HOLZ_DUNKEL}"/>')
    for y0, w in ((130, 18), (160, 24), (192, 30)):
        a(f'<path d="M369 {y0} L{369 - w} {y0 + 48} L{369 + w} {y0 + 48} Z" fill="{TANNE}"/>')
    a(f'<path d="M362 144 L369 130 L376 144 Z" fill="{SCHNEE}"/>')
    for x, y, farbe in ((362, 162, "#c8362b"), (377, 186, GOLD), (356, 214, GOLD), (384, 226, "#c8362b"), (368, 200, "#c8362b")):
        if (x, y) == (377, 186) and "kugel" in f:
            continue
        a(f'<circle cx="{x}" cy="{y}" r="4.5" fill="{farbe}"/>')
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
