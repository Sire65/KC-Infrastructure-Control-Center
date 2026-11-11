"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 6 (Juni): Erdbeerzeit in der Konditorei.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild. So können A und B nie versehentlich
an weiteren Stellen auseinanderlaufen.

Aufruf:  python3 fehlerbild_nr06.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "06"
THEMA = "erdbeeren"

# Club-Farben (Weinrot, Beige, Gold) plus Holz- und Konditoreitöne
WEINROT = "#7a1f2b"
BEIGE = "#f3ead8"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
SCHRANK = "#e6d6b8"
LINIE = "#3b2a20"
ERDBEER = "#d8392b"
BLATT = "#4f8a3a"
SAHNE = "#fbf3e6"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("wimpel", "Ein Wimpel der Girlande ist grün", (340, 19, 17)),
    ("uhr", "Die Uhr zeigt eine andere Zeit", (50, 72, 26)),
    ("bild", "Die Erdbeere im Bild ist gelb", (50, 128, 17)),
    ("lampe", "Der Lampenschirm hat eine andere Farbe", (300, 70, 22)),
    ("glas", "Im Regal fehlt ein Glas", (380, 96, 20)),
    ("hebel", "Am Sahnespender fehlt der Hebel", (118, 119, 15)),
    ("torte", "Auf der Torte fehlt eine Erdbeere", (232, 109, 13)),
    ("heber", "Der Tortenheber fehlt", (271, 184, 23)),
    ("minze", "Der Minztopf ist blau", (335, 176, 21)),
    ("toertchen", "In der Vitrine fehlt ein Törtchen", (250, 244, 19)),
]


def zeiger(cx, cy, laenge, uhr_grad, breite):
    w = math.radians(uhr_grad - 90)
    return (f'<line x1="{cx}" y1="{cy}" x2="{cx + laenge * math.cos(w):.1f}" '
            f'y2="{cy + laenge * math.sin(w):.1f}" stroke="{LINIE}" '
            f'stroke-width="{breite}" stroke-linecap="round"/>')


def erdbeere(cx, cy, s, farbe=ERDBEER):
    """Erdbeere, Spitze nach unten; s = halbe Breite."""
    return (f'<path d="M{cx - s} {cy - 0.5 * s} Q{cx} {cy - 1.1 * s} {cx + s} {cy - 0.5 * s} '
            f'Q{cx + 0.9 * s} {cy + 0.7 * s} {cx} {cy + 1.3 * s} '
            f'Q{cx - 0.9 * s} {cy + 0.7 * s} {cx - s} {cy - 0.5 * s}Z" fill="{farbe}"/>'
            f'<path d="M{cx - 0.7 * s} {cy - 0.7 * s} L{cx} {cy - 0.3 * s} L{cx + 0.7 * s} {cy - 0.7 * s} '
            f'L{cx} {cy - 1.1 * s}Z" fill="{BLATT}"/>')


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Wand, Boden, Theke
    a(f'<rect width="400" height="300" fill="{BEIGE}"/>')
    for x in range(0, 401, 40):
        a(f'<line x1="{x}" y1="30" x2="{x}" y2="190" stroke="#ebdfc6" stroke-width="8"/>')
    a(f'<rect x="0" y="290" width="400" height="10" fill="{HOLZ_DUNKEL}"/>')

    # Girlande mit Wimpeln
    a(f'<path d="M0 9 Q200 15 400 9" fill="none" stroke="{LINIE}" stroke-width="1.5"/>')
    for i, x in enumerate(range(20, 400, 40)):
        farbe = WEINROT if i % 2 == 0 else GOLD
        if x == 340 and "wimpel" in f:
            farbe = "#3f9a4a"
        a(f'<polygon points="{x - 12},10 {x + 12},10 {x},31" fill="{farbe}"/>')

    # Uhr
    a(f'<circle cx="50" cy="72" r="20" fill="#fff" stroke="{GOLD}" stroke-width="4"/>')
    for i in range(12):
        w = math.radians(i * 30)
        a(f'<circle cx="{50 + 15 * math.sin(w):.1f}" cy="{72 - 15 * math.cos(w):.1f}" r="1.2" fill="{LINIE}"/>')
    a(zeiger(50, 72, 9, 240 if "uhr" in f else 90, 3))      # 3 Uhr bzw. 8 Uhr
    a(zeiger(50, 72, 14, 0, 2))
    a(f'<circle cx="50" cy="72" r="2" fill="{WEINROT}"/>')

    # Bild mit Erdbeere
    a(f'<rect x="28" y="106" width="44" height="44" fill="#fff8ee" stroke="{GOLD}" stroke-width="4"/>')
    a(erdbeere(50, 127, 11, "#f2c230" if "bild" in f else ERDBEER))

    # Fenster mit Bogen-Volant
    a('<rect x="140" y="45" width="120" height="80" fill="#cfe9f5" stroke="#fff" stroke-width="6"/>')
    a('<line x1="200" y1="45" x2="200" y2="125" stroke="#fff" stroke-width="4"/>')
    a('<circle cx="170" cy="70" r="9" fill="#fff6c9"/>')
    a('<path d="M150 100 q15 -12 30 0 q12 -9 22 0 z" fill="#a9d18e"/>')
    bogen = " q-10 14 -20 0" * 6
    a(f'<path d="M140 45 h120 v6{bogen} z" fill="{WEINROT}"/>')

    # Hängelampe
    a(f'<line x1="300" y1="12" x2="300" y2="60" stroke="{LINIE}" stroke-width="2"/>')
    a(f'<path d="M286 60 L314 60 L320 79 L280 79 Z" fill="{WEINROT if "lampe" in f else GOLD}"/>')
    a('<ellipse cx="300" cy="81" rx="6" ry="3" fill="#fff6c9"/>')

    # Regal mit Gläsern
    a(f'<rect x="318" y="110" width="80" height="6" fill="{HOLZ}"/>')
    a(f'<path d="M326 116 l0 9 l9 -9 z M384 116 l0 9 l9 -9 z" fill="{HOLZ_DUNKEL}"/>')
    glaeser = [(332, "#d8392b"), (356, "#f2b8c0")] + ([] if "glas" in f else [(380, "#e8c27a")])
    for x, inhalt in glaeser:
        a(f'<rect x="{x - 10}" y="86" width="20" height="24" rx="3" fill="#eaf4f7" stroke="#9fb7bf"/>')
        a(f'<rect x="{x - 8}" y="93" width="16" height="15" rx="2" fill="{inhalt}"/>')
        a(f'<rect x="{x - 11}" y="81" width="22" height="6" rx="2" fill="{GOLD}"/>')

    # Theke
    a(f'<rect x="0" y="190" width="400" height="9" fill="{HOLZ}"/>')
    a(f'<rect x="0" y="199" width="400" height="91" fill="{SCHRANK}"/>')
    for x in (20, 300):
        a(f'<rect x="{x + 4}" y="208" width="72" height="74" rx="3" fill="none" stroke="#c9b48e" stroke-width="2"/>')
    # Vitrine mit Törtchen
    a('<rect x="120" y="206" width="160" height="76" rx="4" fill="#eaf4f7" stroke="#9fb7bf" stroke-width="2"/>')
    a('<rect x="124" y="256" width="152" height="4" fill="#c7d6db"/>')
    for x in (150, 200, 250):
        if x == 250 and "toertchen" in f:
            continue
        a(f'<path d="M{x - 13} 242 L{x + 13} 242 L{x + 9} 255 L{x - 9} 255 Z" fill="#e8c27a"/>')
        a(f'<ellipse cx="{x}" cy="242" rx="13" ry="4" fill="{SAHNE}"/>')
        a(f'<circle cx="{x}" cy="237" r="5" fill="{ERDBEER}"/>')
    a('<line x1="132" y1="214" x2="150" y2="232" stroke="#fff" stroke-width="3" stroke-linecap="round"/>')

    # Kuchenstück auf dem Teller
    a('<ellipse cx="52" cy="187" rx="26" ry="5" fill="#fff" stroke="#d9cdb6"/>')
    a('<rect x="38" y="166" width="28" height="19" fill="#f2d39a"/>')
    a(f'<rect x="38" y="172" width="28" height="4" fill="{SAHNE}"/>')
    a(f'<rect x="38" y="178" width="28" height="3" fill="{ERDBEER}"/>')
    a(f'<rect x="38" y="163" width="28" height="4" rx="2" fill="{SAHNE}"/>')
    a(erdbeere(52, 158, 5))

    # Sahnespender
    a('<rect x="92" y="134" width="20" height="54" rx="4" fill="#c9d0d4" stroke="#9aa5aa"/>')
    a(f'<rect x="92" y="156" width="20" height="6" fill="{WEINROT}"/>')
    a('<rect x="90" y="125" width="24" height="10" rx="3" fill="#8f9a9f"/>')
    a('<path d="M98 125 L100 110 L104 110 L106 125 Z" fill="#8f9a9f"/>')
    if "hebel" not in f:
        a(f'<line x1="111" y1="127" x2="124" y2="112" stroke="{LINIE}" stroke-width="4" stroke-linecap="round"/>')
        a(f'<circle cx="125" cy="111" r="3" fill="{LINIE}"/>')

    # Tortenständer mit Erdbeertorte
    a(f'<ellipse cx="200" cy="188" rx="22" ry="4" fill="{GOLD}"/>')
    a(f'<rect x="195" y="160" width="10" height="28" fill="{GOLD}"/>')
    a(f'<ellipse cx="200" cy="160" rx="54" ry="6" fill="#fff" stroke="{GOLD}" stroke-width="2"/>')
    a(f'<rect x="158" y="118" width="84" height="38" rx="3" fill="{SAHNE}"/>')
    a('<rect x="158" y="128" width="84" height="8" fill="#f2d39a"/>')
    a(f'<rect x="158" y="137" width="84" height="5" fill="{ERDBEER}"/>')
    a('<rect x="158" y="143" width="84" height="8" fill="#f2d39a"/>')
    for x in range(164, 242, 13):
        a(f'<circle cx="{x}" cy="156" r="4" fill="{SAHNE}"/>')
    for x in (168, 184, 200, 216, 232):
        if x == 232 and "torte" in f:
            continue
        a(erdbeere(x, 111, 6))

    # Tortenheber
    if "heber" not in f:
        a(f'<line x1="252" y1="186" x2="268" y2="186" stroke="{HOLZ_DUNKEL}" stroke-width="4" stroke-linecap="round"/>')
        a('<path d="M267 182 L288 179 L292 188 L267 190 Z" fill="#b8c1c5" stroke="#8f9a9f"/>')

    # Minze im Topf
    topf = "#3f7fb0" if "minze" in f else "#c06a3e"
    a(f'<path d="M321 168 L349 168 L345 189 L325 189 Z" fill="{topf}"/>')
    a(f'<rect x="319" y="165" width="32" height="6" rx="2" fill="{topf}"/>')
    for dx, dy, w in ((-9, -10, -30), (0, -18, 0), (9, -10, 30), (-4, -26, -15), (5, -26, 15)):
        a(f'<ellipse cx="{335 + dx}" cy="{165 + dy}" rx="5" ry="9" fill="#5fa24a" '
          f'transform="rotate({w} {335 + dx} {165 + dy})"/>')

    # Schale mit Erdbeeren
    a('<path d="M360 176 a18 13 0 0 0 36 0 z" fill="#fff" stroke="#d9cdb6"/>')
    for x, y in ((367, 172), (378, 169), (389, 172)):
        a(erdbeere(x, y, 5))
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
    name = "Erdbeerzeit in der Konditorei"
    (HIER / f"nr{NR}-{THEMA}-a.svg").write_text(svg(a, f"{name} – Bild A"), encoding="utf-8")
    (HIER / f"nr{NR}-{THEMA}-b.svg").write_text(svg(b, f"{name} – Bild B"), encoding="utf-8")
    (HIER / f"nr{NR}-{THEMA}-loesung.svg").write_text(
        svg(b + kreise, f"{name} – Lösung mit 10 markierten Fehlern"), encoding="utf-8")
    (HIER / f"nr{NR}-fehlerbild.json").write_text(json.dumps(
        {"titel": "Finde die 10 Fehler", "thema": THEMA,
         "fehler": [[x, y, r, txt] for _, txt, (x, y, r) in FEHLER]},
        ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    # Selbstprüfung: genau 10 Fehler, jeder allein wirksam, Kreise ohne Überschneidung
    assert len(FEHLER) == 10
    for k, _, _ in FEHLER:
        assert szene(frozenset([k])) != a, f"Fehler {k} ändert nichts"
    for i, (_, _, (x1, y1, r1)) in enumerate(FEHLER):
        for _, _, (x2, y2, r2) in FEHLER[i + 1:]:
            assert math.hypot(x1 - x2, y1 - y2) > r1 + r2, "Fundkreise überschneiden sich"
    print(f"Fehlerbild Nr. {NR}: 10 Fehler, alle wirksam")


if __name__ == "__main__":
    main()
