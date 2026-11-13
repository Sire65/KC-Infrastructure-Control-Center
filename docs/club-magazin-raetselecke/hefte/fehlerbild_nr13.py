"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 13 (Januar 2028): Suppenküche im Schnee.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr13.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "13"
THEMA = "suppenkueche"
TITEL = "Suppenküche im Schnee"

WEINROT = "#7a1f2b"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
TANNE = "#3f6e3a"
SCHNEE = "#f4f7fb"
HIMMEL = "#bcd3e3"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("rauch", "Aus dem Schornstein steigt kein Rauch", (150, 30, 20)),
    ("zapfen", "Am Dach fehlen zwei Eiszapfen", (156, 124, 14)),
    ("fenster", "Das Fenster der Hütte ist dunkel", (60, 158, 22)),
    ("kranz", "An der Tür hängt kein Kranz", (126, 170, 13)),
    ("kelle", "Im Kessel steckt ein Holzlöffel statt Kelle", (264, 148, 17)),
    ("feuer", "Unter dem Kessel brennt kein Feuer", (235, 215, 13)),
    ("vogel", "Der Vogel in der Tanne ist blau statt rot", (322, 117, 12)),
    ("nase", "Dem Schneemann fehlt die Nase", (369, 141, 11)),
    ("schale", "Auf der Bank fehlt eine Suppenschale", (140, 243, 13)),
    ("scheit", "Auf dem Schlitten liegt ein Scheit weniger", (338, 237, 12)),
]


def scheit(cx, cy):
    return (f'<circle cx="{cx}" cy="{cy}" r="7" fill="{HOLZ}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="3.5" fill="none" stroke="#c49a6c" stroke-width="1.5"/>')


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Himmel, blasse Wintersonne, Hügel, Schneeboden
    a(f'<rect width="400" height="300" fill="{HIMMEL}"/>')
    a('<circle cx="372" cy="34" r="15" fill="#fbe7a1"/>')
    a('<ellipse cx="300" cy="206" rx="200" ry="46" fill="#e3ecf4"/>')
    a(f'<rect x="0" y="200" width="400" height="100" fill="{SCHNEE}"/>')
    for sx, sy in ((20, 30), (60, 18), (100, 40), (200, 22), (250, 60), (300, 30), (340, 70), (380, 100),
                   (210, 95), (30, 80), (270, 100), (190, 60)):
        a(f'<circle cx="{sx}" cy="{sy}" r="2" fill="#fff"/>')

    # Hütte: Schornstein, Wand, Dach mit Schnee
    a('<rect x="132" y="58" width="16" height="40" fill="#8b4a3a"/>')
    a(f'<rect x="129" y="53" width="22" height="7" rx="3" fill="{SCHNEE}"/>')
    if "rauch" not in f:
        for cx, cy, r in ((142, 42, 6), (148, 30, 8), (158, 16, 9)):
            a(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#eef2f6"/>')
    a(f'<rect x="25" y="112" width="140" height="108" fill="{HOLZ}"/>')
    for y in range(124, 220, 12):
        a(f'<line x1="25" y1="{y}" x2="165" y2="{y}" stroke="{HOLZ_DUNKEL}" stroke-width="1.5"/>')
    a('<polygon points="10,116 95,58 180,116" fill="#5b3a2a"/>')
    a(f'<polyline points="13,113 95,57 177,113" fill="none" stroke="{SCHNEE}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>')
    for i, x in enumerate(range(20, 180, 16)):
        if x in (148, 164) and "zapfen" in f:
            continue
        laenge = 10 if i % 2 else 15
        a(f'<path d="M{x - 4} 116 L{x} {116 + laenge} L{x + 4} 116 Z" fill="#e3f1fa" stroke="#9fc3d8" stroke-width="1"/>')

    # Fenster und Tür
    a(f'<rect x="38" y="138" width="44" height="40" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="41" y="141" width="38" height="34" fill="{"#3a4f7a" if "fenster" in f else "#f6d36b"}"/>')
    a(f'<line x1="60" y1="141" x2="60" y2="175" stroke="{HOLZ_DUNKEL}" stroke-width="3"/>')
    a(f'<line x1="41" y1="158" x2="79" y2="158" stroke="{HOLZ_DUNKEL}" stroke-width="3"/>')
    a(f'<rect x="36" y="176" width="48" height="5" fill="{SCHNEE}"/>')
    a(f'<rect x="108" y="150" width="36" height="70" fill="{HOLZ_DUNKEL}"/>')
    a(f'<circle cx="138" cy="188" r="2.5" fill="{GOLD}"/>')
    if "kranz" not in f:
        a(f'<circle cx="126" cy="170" r="8" fill="none" stroke="{TANNE}" stroke-width="5"/>')
        a(f'<path d="M126 176 l-5 5 l3 1 z M126 176 l5 5 l-3 1 z" fill="#c8362b"/>')
    a(f'<ellipse cx="95" cy="222" rx="88" ry="8" fill="{SCHNEE}"/>')

    # Dreibein mit Suppenkessel
    for x2, y2 in ((198, 234), (272, 234), (238, 238)):
        a(f'<line x1="235" y1="112" x2="{x2}" y2="{y2}" stroke="{HOLZ_DUNKEL}" stroke-width="5" stroke-linecap="round"/>')
    a('<line x1="235" y1="114" x2="235" y2="146" stroke="#555" stroke-width="2"/>')
    a('<path d="M207 164 Q235 136 263 164" fill="none" stroke="#333" stroke-width="3"/>')
    # Holzscheite und Feuer
    a(f'<line x1="212" y1="232" x2="258" y2="222" stroke="{HOLZ}" stroke-width="7" stroke-linecap="round"/>')
    a(f'<line x1="212" y1="222" x2="258" y2="232" stroke="{HOLZ}" stroke-width="7" stroke-linecap="round"/>')
    if "feuer" not in f:
        for cx, ry in ((226, 9), (235, 12), (244, 9)):
            a(f'<ellipse cx="{cx}" cy="{224 - ry}" rx="5" ry="{ry}" fill="#f2a93b"/>')
        a('<ellipse cx="235" cy="216" rx="3" ry="6" fill="#fff3b0"/>')
    a('<path d="M205 164 Q205 206 235 206 Q265 206 265 164 Z" fill="#2f2f2f"/>')
    a('<ellipse cx="235" cy="164" rx="31" ry="6" fill="#444"/>')
    a('<ellipse cx="235" cy="164" rx="26" ry="4" fill="#e0a040"/>')
    a('<path d="M218 154 q-5 -8 0 -16 q5 -8 0 -16" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>')
    if "kelle" in f:
        a(f'<line x1="250" y1="166" x2="273" y2="134" stroke="{HOLZ}" stroke-width="5" stroke-linecap="round"/>')
    else:
        a('<line x1="250" y1="166" x2="273" y2="134" stroke="#9aa5aa" stroke-width="4" stroke-linecap="round"/>')
        a('<circle cx="274" cy="132" r="3.5" fill="none" stroke="#9aa5aa" stroke-width="2.5"/>')

    # Tanne mit Vogel
    a(f'<rect x="300" y="190" width="10" height="16" fill="{HOLZ_DUNKEL}"/>')
    for y0, w in ((70, 22), (100, 30), (135, 38)):
        a(f'<path d="M305 {y0} L{305 - w} {y0 + 58} L{305 + w} {y0 + 58} Z" fill="{TANNE}"/>')
        a(f'<path d="M{305 - w} {y0 + 58} q{w / 2} -6 {w} 0 q{w / 2} -6 {w} 0" fill="none" stroke="{SCHNEE}" stroke-width="4" stroke-linecap="round"/>')
    a(f'<path d="M298 82 L305 70 L312 82 Z" fill="{SCHNEE}"/>')
    vogel = "#3a6ea8" if "vogel" in f else "#c8362b"
    a(f'<ellipse cx="322" cy="118" rx="8" ry="6" fill="{vogel}"/>')
    a(f'<circle cx="328" cy="112" r="4.5" fill="{vogel}"/>')
    a('<path d="M332 111 l4 1.5 l-4 1.5 z" fill="#ec8a2b"/><circle cx="329" cy="111" r="1" fill="#222"/>')
    a(f'<path d="M314 118 l-7 -3 l1 6 z" fill="{vogel}"/>')

    # Schneemann
    a('<circle cx="362" cy="196" r="22" fill="#fff" stroke="#d6e1ea" stroke-width="2"/>')
    a('<circle cx="362" cy="164" r="16" fill="#fff" stroke="#d6e1ea" stroke-width="2"/>')
    a('<circle cx="362" cy="138" r="12" fill="#fff" stroke="#d6e1ea" stroke-width="2"/>')
    a(f'<rect x="351" y="124" width="22" height="3" fill="{LINIE}"/><rect x="354" y="112" width="16" height="13" fill="{LINIE}"/>')
    a(f'<circle cx="358" cy="135" r="1.6" fill="{LINIE}"/><circle cx="366" cy="135" r="1.6" fill="{LINIE}"/>')
    if "nase" not in f:
        a('<path d="M363 139 l13 2 l-13 3 z" fill="#ec8a2b"/>')
    a(f'<path d="M349 150 q13 6 26 0 l0 5 q-13 6 -26 0 z" fill="{WEINROT}"/>')
    a(f'<rect x="368" y="153" width="6" height="16" fill="{WEINROT}"/>')
    for y in (163, 172):
        a(f'<circle cx="362" cy="{y}" r="2" fill="{LINIE}"/>')

    # Bank mit Suppenschalen
    a(f'<rect x="60" y="250" width="112" height="7" rx="2" fill="{HOLZ}"/>')
    for x in (68, 160):
        a(f'<rect x="{x}" y="257" width="6" height="24" fill="{HOLZ_DUNKEL}"/>')
    for x in (80, 110, 140):
        if x == 140 and "schale" in f:
            continue
        a(f'<path d="M{x - 10} 240 Q{x - 10} 250 {x} 250 Q{x + 10} 250 {x + 10} 240 Z" fill="{WEINROT}"/>')
        a(f'<ellipse cx="{x}" cy="240" rx="10" ry="2.5" fill="#e0a040"/>')

    # Schlitten mit Holzscheiten
    a('<path d="M298 272 L372 272 Q386 272 386 260" fill="none" stroke="#555" stroke-width="3" stroke-linecap="round"/>')
    for x in (310, 340, 366):
        a(f'<line x1="{x}" y1="262" x2="{x}" y2="272" stroke="#555" stroke-width="2.5"/>')
    a(f'<rect x="300" y="257" width="76" height="7" rx="2" fill="{WEINROT}"/>')
    a(scheit(330, 250))
    a(scheit(346, 250))
    if "scheit" not in f:
        a(scheit(338, 237))
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
