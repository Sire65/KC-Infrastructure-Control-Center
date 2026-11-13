"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 20 (August 2028): Steckerlfisch am Seeufer.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr20.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "20"
THEMA = "seeufer"
TITEL = "Steckerlfisch am Seeufer"

HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
GRUEN = "#4f8a3a"
SEE = "#6fa8c4"
SAND = "#e8d3a0"
FISCH = "#b9a07a"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("moewe", "Am Himmel fliegt eine Möwe weniger", (225, 32, 11)),
    ("segel", "Das Segelboot hat ein Segel weniger", (109, 132, 16)),
    ("ente", "Die Ente schwimmt in die andere Richtung", (232, 166, 15)),
    ("schilf", "Am Schilf fehlt ein Kolben", (40, 147, 11)),
    ("laterne", "Die Laterne am Steg leuchtet nicht", (385, 140, 12)),
    ("pfosten", "Unter dem Steg fehlt ein Pfosten", (340, 187, 11)),
    ("schwimmer", "An der Angelschnur fehlt der Schwimmer", (93, 196, 11)),
    ("fisch", "Am Feuer steckt ein Fisch weniger", (232, 228, 14)),
    ("stein", "Im Steinkreis fehlt ein Stein", (228, 275, 11)),
    ("kuehlbox", "Die Kühlbox ist blau statt rot", (334, 252, 22)),
]


def fisch(cx, cy, winkel):
    return (f'<g transform="rotate({winkel} {cx} {cy})">'
            f'<ellipse cx="{cx}" cy="{cy}" rx="5" ry="12" fill="{FISCH}" stroke="#8a7350" stroke-width="1"/>'
            f'<path d="M{cx} {cy + 10} l-6 9 l12 0 z" fill="{FISCH}" stroke="#8a7350" stroke-width="1"/>'
            f'<circle cx="{cx}" cy="{cy - 7}" r="1.4" fill="{LINIE}"/></g>')


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Abendhimmel, Sonne, Möwen
    a('<rect width="400" height="300" fill="#f9e3bd"/>')
    a('<circle cx="320" cy="78" r="18" fill="#f6b04c"/>')
    for x, y in ((198, 42), (225, 32), (252, 46)):
        if (x, y) == (225, 32) and "moewe" in f:
            continue
        a(f'<path d="M{x - 8} {y - 2} q4 -5 8 1 q4 -6 8 -1" fill="none" stroke="#5a5a6a" stroke-width="2" stroke-linecap="round"/>')
    # Hügel, See, Ufer
    a('<path d="M0 124 Q60 96 130 112 Q200 92 270 110 Q340 96 400 112 L400 124 Z" fill="#7d9f7a"/>')
    a(f'<rect x="0" y="122" width="400" height="80" fill="{SEE}"/>')
    for x, y in ((40, 136), (180, 132), (300, 140), (150, 186), (270, 190)):
        a(f'<path d="M{x} {y} q6 -3 12 0 q6 3 12 0" fill="none" stroke="#a9d0e2" stroke-width="1.5"/>')
    a(f'<path d="M0 200 Q100 192 200 198 Q300 204 400 196 L400 300 L0 300 Z" fill="{SAND}"/>')

    # Segelboot
    a('<line x1="122" y1="98" x2="122" y2="150" stroke="#5a4a3a" stroke-width="2"/>')
    a('<path d="M125 102 L125 146 L152 146 Z" fill="#fbf8f1"/>')
    if "segel" not in f:
        a('<path d="M119 108 L119 146 L99 146 Z" fill="#d2453a"/>')
    a('<path d="M94 150 L156 150 L148 160 L102 160 Z" fill="#7a4a2a"/>')

    # Ente
    if "ente" in f:
        a('<ellipse cx="228" cy="170" rx="12" ry="6" fill="#8a6a4a"/><path d="M216 170 l-6 -6 l2 8 z" fill="#8a6a4a"/>')
        a('<circle cx="238" cy="161" r="5.5" fill="#2f6b3a"/><path d="M243 161 l6 1.5 l-6 1.5 z" fill="#ec8a2b"/>')
        a('<circle cx="239.5" cy="160" r="1" fill="#fff"/>')
    else:
        a('<ellipse cx="236" cy="170" rx="12" ry="6" fill="#8a6a4a"/><path d="M248 170 l6 -6 l-2 8 z" fill="#8a6a4a"/>')
        a('<circle cx="226" cy="161" r="5.5" fill="#2f6b3a"/><path d="M221 161 l-6 1.5 l6 1.5 z" fill="#ec8a2b"/>')
        a('<circle cx="224.5" cy="160" r="1" fill="#fff"/>')

    # Schilf mit Rohrkolben
    for x, y in ((25, 156), (40, 146), (55, 159)):
        a(f'<line x1="{x}" y1="210" x2="{x}" y2="{y}" stroke="{GRUEN}" stroke-width="2"/>')
        if not ((x, y) == (40, 146) and "schilf" in f):
            a(f'<rect x="{x - 3}" y="{y}" width="6" height="14" rx="3" fill="#6f4a2f"/>')
    for x1, x2 in ((18, 10), (32, 28), (48, 62), (62, 70)):
        a(f'<path d="M{x1} 210 Q{x1} 180 {x2} 168" fill="none" stroke="{GRUEN}" stroke-width="2.5"/>')

    # Steg mit Pfosten und Laterne
    for x in (310, 340, 370, 394):
        if x == 340 and "pfosten" in f:
            continue
        a(f'<rect x="{x - 4}" y="170" width="8" height="28" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="296" y="162" width="104" height="10" fill="{HOLZ}"/>')
    for x in range(306, 400, 14):
        a(f'<line x1="{x}" y1="162" x2="{x}" y2="172" stroke="{HOLZ_DUNKEL}" stroke-width="1"/>')
    a(f'<rect x="383" y="146" width="4" height="16" fill="{LINIE}"/>')
    a(f'<rect x="377" y="130" width="16" height="18" rx="2" fill="{"#cfc8b8" if "laterne" in f else "#fff3b0"}" stroke="{LINIE}" stroke-width="2"/>')
    a(f'<path d="M375 130 L385 122 L395 130 Z" fill="{LINIE}"/>')
    if "laterne" not in f:
        a('<ellipse cx="385" cy="140" rx="3" ry="5" fill="#f2a93b"/>')

    # Angel auf Astgabel
    a(f'<path d="M66 262 L66 238 M66 246 L58 234 M66 246 L74 234" stroke="{HOLZ_DUNKEL}" stroke-width="3" stroke-linecap="round" fill="none"/>')
    a(f'<line x1="30" y1="284" x2="90" y2="184" stroke="{LINIE}" stroke-width="3" stroke-linecap="round"/>')
    a(f'<circle cx="40" cy="268" r="5" fill="#777"/>')
    a('<path d="M90 184 Q94 188 93 196" fill="none" stroke="#555" stroke-width="1"/>')
    if "schwimmer" not in f:
        a('<circle cx="93" cy="196" r="4.5" fill="#d2453a"/><path d="M88.5 196 a4.5 4.5 0 0 0 9 0 z" fill="#fff"/>')

    # Lagerfeuer mit Steckerlfischen
    for (x0, y0), (x1, y1) in (((155, 284), (172, 212)), ((172, 286), (184, 206)),
                               ((228, 286), (216, 206)), ((245, 284), (228, 212))):
        a(f'<line x1="{x0}" y1="{y0}" x2="{x1}" y2="{y1}" stroke="{HOLZ}" stroke-width="3" stroke-linecap="round"/>')
        if (x0 == 245) and "fisch" in f:
            continue
        cx, cy = x0 + (x1 - x0) * 0.77, y0 + (y1 - y0) * 0.77
        w = math.degrees(math.atan2(x1 - x0, -(y1 - y0)))
        a(fisch(round(cx, 1), round(cy, 1), round(w, 1)))
    for ry, rx, farbe in ((16, 10, "#ec8a2b"), (11, 6, "#f6c94c")):
        a(f'<ellipse cx="200" cy="{270 - ry}" rx="{rx}" ry="{ry}" fill="{farbe}"/>')
    a(f'<path d="M184 272 L216 264 M184 264 L216 272" stroke="{HOLZ_DUNKEL}" stroke-width="5" stroke-linecap="round"/>')
    for i in range(8):
        w = math.radians(i * 45 + 22.5)
        x, y = 200 + 30 * math.cos(w), 272 + 9 * math.sin(w)
        if i == 0 and "stein" in f:
            continue
        a(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="7" ry="5" fill="#8f8f8f" stroke="#6f6f6f"/>')

    # Kühlbox
    box = "#3a6ea8" if "kuehlbox" in f else "#d2453a"
    a(f'<rect x="312" y="238" width="44" height="32" rx="3" fill="{box}"/>')
    a('<rect x="310" y="232" width="48" height="8" rx="2" fill="#fbf8f1"/>')
    a(f'<path d="M322 232 L322 226 L346 226 L346 232" fill="none" stroke="{LINIE}" stroke-width="2.5"/>')
    a('<rect x="318" y="246" width="32" height="4" fill="#fbf8f1"/>')
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
