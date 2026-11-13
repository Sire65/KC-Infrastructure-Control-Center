"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 23 (November 2028): Wildküche in der Jagdhütte.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr23.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "23"
THEMA = "wildkueche"
TITEL = "Wildküche in der Jagdhütte"

WEINROT = "#7a1f2b"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
TANNE = "#2f5a34"
GEWEIH = "#e6d6b8"
EISEN = "#2f2f33"
STAHL = "#9aa5aa"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("reh", "Im Fenster fehlt das Reh", (86, 114, 20)),
    ("kraeuter", "Am Balken hängt ein Kräuterbund weniger", (230, 52, 15)),
    ("feder", "Am Jägerhut fehlt die Feder", (171, 94, 12)),
    ("geweih", "Das Geweih hat eine Sprosse weniger", (331, 37, 12)),
    ("deckel", "Auf dem Bräter fehlt der Deckel", (320, 128, 18)),
    ("feuer", "Im Ofen brennt kein Feuer", (330, 222, 21)),
    ("pilz", "Im Korb liegt ein Fliegenpilz", (72, 186, 11)),
    ("glas", "Im Glas sind blaue statt rote Beeren", (110, 195, 14)),
    ("etikett", "Die Weinflasche hat kein Etikett", (145, 191, 11)),
    ("messer", "Auf dem Brett fehlt das Messer", (242, 202, 14)),
]


def kraeuterbund(x, farbe):
    return (f'<line x1="{x}" y1="30" x2="{x}" y2="40" stroke="{LINIE}" stroke-width="1.5"/>'
            f'<path d="M{x - 3} 40 L{x + 3} 40 L{x + 10} 66 L{x - 10} 66 Z" fill="{farbe}"/>'
            f'<rect x="{x - 4}" y="42" width="8" height="4" fill="#c8362b"/>')


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Holzwand, Balken, Boden
    a('<rect width="400" height="300" fill="#b98a5e"/>')
    for x in range(0, 400, 26):
        a(f'<line x1="{x}" y1="0" x2="{x}" y2="280" stroke="#a87a50" stroke-width="2"/>')
    a(f'<rect x="0" y="278" width="400" height="22" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="0" y="20" width="400" height="11" fill="{HOLZ_DUNKEL}"/>')

    # Fenster mit Abendwald und Reh
    a('<rect x="20" y="50" width="90" height="90" fill="#e8a86a"/>')
    a('<rect x="20" y="96" width="90" height="44" fill="#d9925a"/>')
    for x, h in ((30, 40), (52, 52), (100, 46)):
        a(f'<path d="M{x} 140 L{x - 10} 140 L{x} {140 - h} L{x + 10} 140 Z" fill="{TANNE}"/>')
    a('<rect x="20" y="132" width="90" height="8" fill="#4a6a3a"/>')
    if "reh" not in f:
        reh = "#5a3b26"
        a(f'<ellipse cx="82" cy="116" rx="13" ry="7" fill="{reh}"/>')
        a(f'<path d="M73 120 v13 M78 121 v12 M87 121 v12 M92 120 v13" stroke="{reh}" stroke-width="2.5"/>')
        a(f'<path d="M90 114 L96 100 L101 102 L96 116 Z" fill="{reh}"/>')
        a(f'<ellipse cx="100" cy="100" rx="6" ry="3.5" fill="{reh}" transform="rotate(20 100 100)"/>')
        a(f'<path d="M96 97 l-3 -5 M99 96 l1 -6" stroke="{reh}" stroke-width="2" stroke-linecap="round"/>')
    a('<rect x="20" y="50" width="90" height="90" fill="none" stroke="#6f4a2f" stroke-width="6"/>')
    a('<line x1="65" y1="50" x2="65" y2="140" stroke="#6f4a2f" stroke-width="3"/>')
    a(f'<rect x="14" y="140" width="102" height="7" fill="{HOLZ_DUNKEL}"/>')

    # Kräuterbunde am Balken
    for x, farbe in ((170, "#6f8f4a"), (200, "#8aa88a"), (230, "#5a7a3a")):
        if x == 230 and "kraeuter" in f:
            continue
        a(kraeuterbund(x, farbe))

    # Jägerhut am Haken
    a(f'<rect x="146" y="96" width="5" height="10" fill="{LINIE}"/>')
    if "feder" not in f:
        a('<path d="M160 108 Q168 96 176 82 Q172 96 163 110 Z" fill="#5a5a5a"/>')
        a('<path d="M164 103 l6 -2 M167 97 l6 -2" stroke="#8a8a8a" stroke-width="1"/>')
    a('<path d="M136 116 Q136 98 150 98 Q164 98 164 116 Z" fill="#4f6a3a"/>')
    a('<rect x="136" y="110" width="28" height="4" fill="#3a2a1a"/>')
    a('<ellipse cx="150" cy="117" rx="22" ry="4" fill="#4f6a3a"/>')

    # Geweih auf Brett
    a(f'<ellipse cx="300" cy="72" rx="16" ry="20" fill="{HOLZ_DUNKEL}"/>')
    a(f'<path d="M292 62 Q276 50 272 28 M298 60 Q302 46 300 34 M308 62 Q324 50 328 28 M302 60 Q298 46 300 34" fill="none" stroke="{GEWEIH}" stroke-width="4" stroke-linecap="round"/>')
    a(f'<path d="M278 46 L266 42 M275 38 L264 30 M322 46 L334 42" fill="none" stroke="{GEWEIH}" stroke-width="3" stroke-linecap="round"/>')
    if "geweih" not in f:
        a(f'<path d="M325 38 L336 30" fill="none" stroke="{GEWEIH}" stroke-width="3" stroke-linecap="round"/>')
    a(f'<circle cx="300" cy="64" r="5" fill="{GEWEIH}"/>')

    # Ofen mit Rohr, Bräter
    a(f'<rect x="352" y="30" width="14" height="122" fill="{EISEN}"/>')
    a(f'<rect x="280" y="152" width="100" height="124" rx="3" fill="{EISEN}"/>')
    a(f'<rect x="276" y="148" width="108" height="8" fill="#444"/>')
    a('<rect x="306" y="202" width="48" height="40" rx="3" fill="#555"/>')
    if "feuer" in f:
        a('<rect x="311" y="207" width="38" height="30" fill="#2a2a2a"/>')
    else:
        a('<rect x="311" y="207" width="38" height="30" fill="#f2a93b"/>')
        a('<path d="M318 237 Q316 222 324 214 Q326 226 330 222 Q334 210 338 216 Q344 226 342 237 Z" fill="#f6dc5a"/>')
    a(f'<circle cx="330" cy="256" r="4" fill="{GOLD}"/>')
    for x in (286, 370):
        a(f'<rect x="{x}" y="270" width="8" height="10" fill="{EISEN}"/>')
    a(f'<path d="M294 132 L346 132 L342 148 L298 148 Z" fill="{WEINROT}"/>')
    a(f'<rect x="288" y="134" width="8" height="4" fill="{WEINROT}"/><rect x="344" y="134" width="8" height="4" fill="{WEINROT}"/>')
    if "deckel" in f:
        a('<ellipse cx="320" cy="132" rx="25" ry="4" fill="#6a3a22"/>')
        a('<circle cx="312" cy="131" r="2.5" fill="#8a4a2a"/><circle cx="326" cy="132" r="2.5" fill="#8a4a2a"/>')
    else:
        a(f'<path d="M294 132 Q320 118 346 132 Z" fill="{WEINROT}" stroke="#5a1520" stroke-width="1"/>')
        a(f'<ellipse cx="320" cy="121" rx="5" ry="3" fill="{EISEN}"/>')

    # Tisch
    a(f'<rect x="16" y="210" width="246" height="9" fill="{HOLZ_DUNKEL}"/>')
    for x in (26, 244):
        a(f'<rect x="{x}" y="219" width="9" height="60" fill="{HOLZ_DUNKEL}"/>')

    # Pilzkorb
    for x, y in ((48, 188), (60, 184), (72, 186), (84, 189)):
        hut = "#d2303a" if ((x, y) == (72, 186) and "pilz" in f) else "#a0612e"
        a(f'<rect x="{x - 2}" y="{y}" width="4" height="8" fill="#f0e2c4"/>')
        a(f'<path d="M{x - 8} {y + 1} Q{x} {y - 10} {x + 8} {y + 1} Z" fill="{hut}"/>')
        if hut == "#d2303a":
            a(f'<circle cx="{x - 3}" cy="{y - 2}" r="1.3" fill="#fff"/><circle cx="{x + 3}" cy="{y - 3}" r="1.3" fill="#fff"/>')
    a(f'<path d="M36 192 L96 192 L90 210 L42 210 Z" fill="{GOLD}" stroke="{HOLZ}" stroke-width="1.5"/>')
    a(f'<line x1="39" y1="200" x2="93" y2="200" stroke="{HOLZ}" stroke-width="1.5"/>')

    # Preiselbeerglas
    beere = "#3a4fa0" if "glas" in f else "#b5162b"
    a(f'<rect x="100" y="184" width="20" height="26" rx="3" fill="#e6f0f2" stroke="#9fb7bf" stroke-width="1.5"/>')
    for i, (dx, dy) in enumerate(((4, 20), (10, 22), (16, 20), (6, 14), (13, 15), (9, 8), (15, 9), (4, 8))):
        a(f'<circle cx="{100 + dx}" cy="{184 + dy}" r="3" fill="{beere}"/>')
    a(f'<rect x="98" y="179" width="24" height="6" rx="2" fill="#c8362b"/>')

    # Weinflasche
    a(f'<path d="M139 210 L139 182 Q139 174 143 170 L143 156 L147 156 L147 170 Q151 174 151 182 L151 210 Z" fill="#2f4a2f"/>')
    a(f'<rect x="142.5" y="152" width="5" height="5" fill="{WEINROT}"/>')
    if "etikett" not in f:
        a(f'<rect x="139" y="186" width="12" height="11" fill="#f3ead8"/><rect x="141" y="190" width="8" height="2" fill="{WEINROT}"/>')

    # Brett mit Brot und Messer
    a(f'<rect x="176" y="204" width="80" height="6" rx="2" fill="#c49a6c"/>')
    a('<path d="M182 204 Q182 186 200 186 Q218 186 218 204 Z" fill="#a8693a"/>')
    a('<path d="M190 194 l8 -4 M198 196 l8 -4 M206 197 l6 -3" stroke="#d9a35e" stroke-width="2" stroke-linecap="round"/>')
    if "messer" not in f:
        a(f'<path d="M228 202 L246 200 Q250 200 250 203 L228 204 Z" fill="{STAHL}"/>')
        a(f'<rect x="246" y="199.5" width="10" height="4" rx="1.5" fill="{LINIE}"/>')
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
