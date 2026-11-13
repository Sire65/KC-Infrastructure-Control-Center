"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 16 (April 2028): Kräutergarten im Frühling.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr16.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "16"
THEMA = "kraeutergarten"
TITEL = "Kräutergarten im Frühling"

HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
GRUEN = "#4f8a3a"
GRUEN_DUNKEL = "#3f6e3a"
WIESE = "#8fbf6a"
TON = "#c56a3a"
LILA = "#9b6bb5"
STAHL = "#8aa0a8"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("sonne", "Die Sonne hat keine Strahlen", (40, 38, 26)),
    ("wolke", "Am Himmel fehlt eine Wolke", (160, 40, 24)),
    ("rechen", "Die Harke hat weniger Zinken", (240, 82, 18)),
    ("vogelhaus", "Das Vogelhaus hat kein Flugloch", (380, 82, 11)),
    ("schmetterling", "Der Schmetterling ist blau statt gelb", (130, 126, 14)),
    ("biene", "Am Lavendel fehlt die Biene", (180, 140, 11)),
    ("schnittlauch", "Der Schnittlauch blüht nicht", (62, 152, 14)),
    ("kanne", "An der Gießkanne fehlt die Brause", (98, 243, 12)),
    ("topf", "Ein Kräutertopf ist blau statt aus Ton", (292, 203, 14)),
    ("handschuh", "Auf der Bank liegt ein Handschuh weniger", (362, 207, 11)),
]


def wolke(cx, cy):
    return (f'<g fill="#fff"><ellipse cx="{cx}" cy="{cy + 4}" rx="22" ry="9"/>'
            f'<circle cx="{cx - 8}" cy="{cy - 1}" r="9"/><circle cx="{cx + 6}" cy="{cy - 4}" r="11"/></g>')


def topf(cx, farbe):
    return (f'<path d="M{cx - 13} 192 L{cx + 13} 192 L{cx + 9} 214 L{cx - 9} 214 Z" fill="{farbe}"/>'
            f'<rect x="{cx - 14}" y="190" width="28" height="5" rx="1" fill="{farbe}" stroke="#00000022"/>')


def handschuh(cx, farbe):
    return (f'<path d="M{cx - 7} 214 L{cx - 7} 204 Q{cx - 7} 198 {cx - 2} 199 L{cx + 5} 199 Q{cx + 9} 200 {cx + 8} 205 '
            f'L{cx + 7} 214 Z" fill="{farbe}"/><path d="M{cx - 7} 205 l-4 -3" stroke="{farbe}" stroke-width="3" stroke-linecap="round"/>'
            f'<rect x="{cx - 8}" y="211" width="16" height="3" fill="#fff"/>')


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Himmel, Sonne, Wolken
    a('<rect width="400" height="300" fill="#cfe6f2"/>')
    if "sonne" not in f:
        for i in range(10):
            w = math.radians(i * 36)
            a(f'<line x1="{40 + 17 * math.cos(w):.1f}" y1="{38 + 17 * math.sin(w):.1f}" '
              f'x2="{40 + 24 * math.cos(w):.1f}" y2="{38 + 24 * math.sin(w):.1f}" stroke="#f2b33d" stroke-width="3" stroke-linecap="round"/>')
    a('<circle cx="40" cy="38" r="14" fill="#f6c94c"/>')
    if "wolke" not in f:
        a(wolke(160, 40))
    a(wolke(300, 28))

    # Zaun und Wiese
    a('<rect x="0" y="128" width="400" height="7" fill="#c9ad85"/><rect x="0" y="156" width="400" height="7" fill="#c9ad85"/>')
    for x in range(4, 400, 22):
        a(f'<path d="M{x} 176 L{x} 116 L{x + 7} 108 L{x + 14} 116 L{x + 14} 176 Z" fill="#e2cfaf"/>')
    a(f'<rect x="0" y="170" width="400" height="130" fill="{WIESE}"/>')

    # Harke am Zaun (Zinken nach oben)
    a(f'<line x1="244" y1="200" x2="240" y2="90" stroke="{HOLZ}" stroke-width="4" stroke-linecap="round"/>')
    a(f'<rect x="224" y="88" width="32" height="5" rx="2" fill="{STAHL}"/>')
    zinken = (228, 236, 244, 252) if "rechen" not in f else (228, 252)
    for x in zinken:
        a(f'<line x1="{x}" y1="88" x2="{x}" y2="76" stroke="{STAHL}" stroke-width="3" stroke-linecap="round"/>')

    # Vogelhaus auf Pfahl
    a(f'<rect x="377" y="96" width="6" height="120" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="366" y="70" width="28" height="28" fill="#d2453a"/>')
    a(f'<path d="M361 72 L380 54 L399 72 Z" fill="{HOLZ_DUNKEL}"/>')
    if "vogelhaus" not in f:
        a(f'<circle cx="380" cy="82" r="5" fill="{LINIE}"/>')
    a(f'<rect x="377" y="90" width="6" height="2" fill="{HOLZ_DUNKEL}"/>')

    # Hochbeet
    a('<rect x="30" y="182" width="200" height="8" fill="#5a3b26"/>')
    # Schnittlauch
    for i, x in enumerate(range(50, 76, 4)):
        a(f'<line x1="{x}" y1="186" x2="{x + (i - 3)}" y2="{158 + (i % 3) * 4}" stroke="{GRUEN}" stroke-width="2"/>')
    if "schnittlauch" not in f:
        for x, y in ((53, 155), (63, 148), (73, 156)):
            a(f'<circle cx="{x}" cy="{y}" r="5" fill="{LILA}"/>')
    # Petersilie
    for x, y in ((98, 176), (108, 170), (118, 176), (104, 180), (114, 180), (108, 162)):
        a(f'<circle cx="{x}" cy="{y}" r="6" fill="{GRUEN_DUNKEL}"/>')
    # Lavendel
    for x, dx in ((152, -6), (160, -2), (168, 2), (176, 6)):
        a(f'<line x1="{x}" y1="186" x2="{x + dx}" y2="154" stroke="{GRUEN}" stroke-width="2"/>')
        a(f'<ellipse cx="{x + dx}" cy="152" rx="3" ry="7" fill="{LILA}"/>')
    if "biene" not in f:
        a('<ellipse cx="183" cy="141" rx="6" ry="4" fill="#f2b33d"/>')
        a(f'<path d="M181 137.5 v7 M185 137.5 v7" stroke="{LINIE}" stroke-width="1.5"/>')
        a('<ellipse cx="180" cy="135" rx="3.5" ry="2.5" fill="#fff" opacity="0.9"/>')
        a(f'<circle cx="177" cy="141" r="2.2" fill="{LINIE}"/>')
    # Salbei
    for x, y in ((202, 172), (214, 168), (208, 160), (220, 178), (198, 180)):
        a(f'<ellipse cx="{x}" cy="{y}" rx="5" ry="8" fill="#8aa88a"/>')
    a(f'<rect x="26" y="188" width="208" height="46" fill="{HOLZ}"/>')
    for y in (203, 218):
        a(f'<line x1="26" y1="{y}" x2="234" y2="{y}" stroke="{HOLZ_DUNKEL}" stroke-width="1.5"/>')
    a(f'<rect x="26" y="186" width="208" height="5" fill="{HOLZ_DUNKEL}"/>')

    # Schmetterling
    fl = "#5b8fd6" if "schmetterling" in f else "#f6c94c"
    a(f'<ellipse cx="124" cy="122" rx="7" ry="9" fill="{fl}" transform="rotate(-25 124 122)"/>')
    a(f'<ellipse cx="136" cy="122" rx="7" ry="9" fill="{fl}" transform="rotate(25 136 122)"/>')
    a(f'<ellipse cx="125" cy="133" rx="5" ry="5" fill="{fl}"/><ellipse cx="135" cy="133" rx="5" ry="5" fill="{fl}"/>')
    a(f'<rect x="129" y="116" width="2.5" height="20" rx="1" fill="{LINIE}"/>')

    # Bank mit Kräutertöpfen und Handschuhen
    a(f'<rect x="245" y="214" width="127" height="6" fill="{HOLZ}"/>')
    for x in (252, 360):
        a(f'<rect x="{x}" y="220" width="6" height="50" fill="{HOLZ_DUNKEL}"/>')
    # Rosmarin, Thymian, Minze
    for dx in (-8, -3, 2, 7):
        a(f'<line x1="{262 + dx}" y1="192" x2="{262 + dx * 1.6}" y2="166" stroke="{GRUEN_DUNKEL}" stroke-width="2.5"/>')
    for x, y in ((284, 184), (292, 178), (300, 184), (292, 186)):
        a(f'<circle cx="{x}" cy="{y}" r="6" fill="{GRUEN}"/>')
    for x, y in ((316, 182), (328, 182), (322, 172)):
        a(f'<ellipse cx="{x}" cy="{y}" rx="6" ry="5" fill="#6fb05a"/>')
    a(topf(262, TON))
    a(topf(292, "#3a6ea8" if "topf" in f else TON))
    a(topf(322, TON))
    a(handschuh(346, "#e0903a"))
    if "handschuh" not in f:
        a(handschuh(362, "#e0903a"))

    # Gießkanne
    a(f'<path d="M66 262 L94 245" stroke="{STAHL}" stroke-width="5" stroke-linecap="round"/>')
    if "kanne" not in f:
        a(f'<ellipse cx="98" cy="243" rx="4" ry="7" fill="#6f868e" transform="rotate(-35 98 243)"/>')
    a(f'<path d="M30 254 L70 254 L66 286 L34 286 Z" fill="{STAHL}"/>')
    a(f'<path d="M36 254 Q50 230 64 254" fill="none" stroke="#6f868e" stroke-width="4"/>')
    a(f'<rect x="30" y="266" width="40" height="3" fill="#6f868e"/>')
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
