"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 19 (Juli 2028): In der Eisdiele.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr19.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "19"
THEMA = "eisdiele"
TITEL = "In der Eisdiele"

GOLD = "#c9a44c"
LINIE = "#3b2a20"
ROT = "#d2453a"
WAFFEL = "#d9a35e"
WAFFEL_DUNKEL = "#b8783a"
STAHL = "#b9c4c9"
GRUEN = "#4f8a3a"
TON = "#c56a3a"

# Eissorten: Vanille, Schoko, Erdbeer, Pistazie, Zitrone, Heidelbeere
SORTEN = ["#f6e7b0", "#7a4a2a", "#f2a0b0", "#9cc96b", "#f6dc5a", "#8a6ab5"]

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("markise", "Die Markise hat einen blauen Streifen", (260, 22, 20)),
    ("waffel", "Im Halter steckt eine Waffel weniger", (88, 72, 13)),
    ("schirmchen", "Im Eisbecher fehlt das Schirmchen", (132, 42, 13)),
    ("oblate", "Im Eisbecher fehlt die Waffelrolle", (166, 53, 11)),
    ("loeffel", "Im Glas steckt ein Löffel weniger", (217, 71, 11)),
    ("klingel", "Auf der Theke fehlt die Klingel", (268, 89, 15)),
    ("spatel", "In der Vanille-Wanne fehlt der Spatel", (65, 126, 11)),
    ("sorte", "Eine Eissorte ist blau statt grün", (176, 138, 15)),
    ("schild", "Im Wandschild: Eis mit zwei statt drei Kugeln", (352, 82, 11)),
    ("palme", "Die Palme hat ein Blatt weniger", (372, 216, 15)),
]


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Wand, Fliesenboden
    a('<rect width="400" height="300" fill="#dff1ea"/>')
    for i, x in enumerate(range(0, 400, 25)):
        a(f'<rect x="{x}" y="268" width="25" height="32" fill="{"#e9d8c4" if i % 2 else "#f6ecd9"}"/>')

    # Markise mit Streifen und Bogenkante
    for i, x in enumerate(range(0, 400, 40)):
        farbe = "#fff" if i % 2 else (("#3a6ea8" if (i == 6 and "markise" in f) else ROT))
        a(f'<rect x="{x}" y="0" width="40" height="34" fill="{farbe}"/>')
        a(f'<path d="M{x} 34 A20 10 0 0 0 {x + 40} 34 Z" fill="{farbe}"/>')

    # Wandschild mit Eistüte
    a('<circle cx="352" cy="92" r="28" fill="#f8d5dc" stroke="#fff" stroke-width="4"/>')
    a(f'<path d="M341 98 L363 98 L352 120 Z" fill="{WAFFEL}"/>')
    a(f'<path d="M345 102 l12 12 M359 102 l-12 12" stroke="{WAFFEL_DUNKEL}" stroke-width="1"/>')
    a(f'<circle cx="346" cy="95" r="7" fill="{SORTEN[2]}"/><circle cx="358" cy="95" r="7" fill="{SORTEN[3]}"/>')
    if "schild" not in f:
        a(f'<circle cx="352" cy="83" r="7" fill="{SORTEN[1]}"/>')

    # Palme im Topf
    blaetter = [(318, 206), (330, 184), (352, 176), (374, 186)]
    if "palme" not in f:
        blaetter.append((386, 208))
    for x2, y2 in blaetter:
        mx, my = (352 + x2) / 2, (244 + y2) / 2
        a(f'<path d="M352 244 Q{mx - 8} {my - 6} {x2} {y2} Q{mx + 8} {my + 6} 352 244 Z" fill="{GRUEN}"/>')
    a(f'<path d="M334 244 L370 244 L364 280 L340 280 Z" fill="{TON}"/><rect x="332" y="242" width="40" height="6" rx="2" fill="{TON}"/>')

    # Theke mit Glasvitrine
    a('<rect x="16" y="152" width="288" height="116" fill="#f7f2ec"/>')
    a(f'<rect x="16" y="170" width="288" height="10" fill="{SORTEN[2]}"/>')
    for x in (30, 122, 214):
        a(f'<rect x="{x}" y="192" width="78" height="62" rx="4" fill="none" stroke="#e2d6cf" stroke-width="2"/>')
    a('<rect x="16" y="148" width="288" height="6" fill="#cfd8dc"/>')
    for i, cx in enumerate((56, 96, 136, 176, 216, 256)):
        farbe = "#5b8fd6" if (i == 3 and "sorte" in f) else SORTEN[i]
        a(f'<rect x="{cx - 17}" y="136" width="34" height="12" fill="{STAHL}"/>')
        a(f'<ellipse cx="{cx}" cy="136" rx="16" ry="8" fill="{farbe}"/>')
        if not (i == 0 and "spatel" in f):
            a(f'<line x1="{cx + 6}" y1="134" x2="{cx + 12}" y2="118" stroke="#8a8a8a" stroke-width="3" stroke-linecap="round"/>')
    a('<path d="M24 148 L40 106 L296 106 L300 148 Z" fill="#e6f4f8" fill-opacity="0.35" stroke="#9fb7bf" stroke-width="2"/>')
    a('<line x1="60" y1="112" x2="52" y2="132" stroke="#fff" stroke-width="2"/>')
    a('<rect x="36" y="100" width="264" height="6" fill="#cfd8dc"/>')

    # Waffelhalter
    for x in (56, 72, 88):
        if x == 88 and "waffel" in f:
            continue
        a(f'<path d="M{x - 7} 62 L{x + 7} 62 L{x} 96 Z" fill="{WAFFEL}" stroke="{WAFFEL_DUNKEL}" stroke-width="1"/>')
        a(f'<path d="M{x - 5} 68 l9 9 M{x + 5} 68 l-9 9" stroke="{WAFFEL_DUNKEL}" stroke-width="1"/>')
    a(f'<rect x="46" y="84" width="52" height="16" rx="2" fill="{STAHL}"/>')

    # Eisbecher mit Schirmchen und Waffelrolle
    if "schirmchen" not in f:
        a(f'<line x1="143" y1="64" x2="133" y2="40" stroke="{LINIE}" stroke-width="1.5"/>')
        a('<path d="M120 42 Q132 26 146 38 Z" fill="#3aa0a8"/>')
    if "oblate" not in f:
        a(f'<line x1="157" y1="66" x2="171" y2="44" stroke="{WAFFEL}" stroke-width="5" stroke-linecap="round"/>')
    for cx, cy, farbe in ((143, 70, SORTEN[2]), (157, 70, SORTEN[0]), (150, 62, SORTEN[1])):
        a(f'<circle cx="{cx}" cy="{cy}" r="8" fill="{farbe}"/>')
    a('<path d="M134 72 L166 72 Q164 88 150 89 Q136 88 134 72 Z" fill="#e6f4f8" stroke="#9fb7bf" stroke-width="1.5"/>')
    a('<rect x="148" y="89" width="4" height="7" fill="#9fb7bf"/><ellipse cx="150" cy="98" rx="9" ry="2.5" fill="#9fb7bf"/>')
    a('<circle cx="150" cy="54" r="3.5" fill="#c8362b"/>')

    # Glas mit bunten Löffeln
    for x1, x2, y2, farbe in ((206, 203, 66, "#f2a0b0"), (210, 210, 61, "#9cc96b"), (214, 217, 66, "#5b8fd6")):
        if x2 == 217 and "loeffel" in f:
            continue
        a(f'<line x1="{x1}" y1="96" x2="{x2}" y2="{y2}" stroke="{farbe}" stroke-width="2.5"/>')
        a(f'<ellipse cx="{x2}" cy="{y2}" rx="2.5" ry="3.5" fill="{farbe}"/>')
    a('<rect x="200" y="80" width="20" height="20" rx="2" fill="#e6f4f8" fill-opacity="0.7" stroke="#9fb7bf" stroke-width="1.5"/>')

    # Tischklingel
    if "klingel" not in f:
        a(f'<ellipse cx="268" cy="99" rx="14" ry="3" fill="{LINIE}"/>')
        a(f'<path d="M256 98 Q256 82 268 82 Q280 82 280 98 Z" fill="{GOLD}"/>')
        a(f'<rect x="266" y="76" width="4" height="6" fill="{LINIE}"/>')
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
