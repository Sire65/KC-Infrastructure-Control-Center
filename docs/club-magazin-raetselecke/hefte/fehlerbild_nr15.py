"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 15 (März 2028): Bäckerei am Morgen.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr15.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "15"
THEMA = "baeckerei"
TITEL = "Bäckerei am Morgen"

WEINROT = "#7a1f2b"
BEIGE = "#f6ecd9"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
KRUSTE = "#b8783a"
KRUSTE_HELL = "#d9a35e"
GLAS = "#dcecf2"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("schild", "Das Brezelschild ist grau statt golden", (40, 36, 17)),
    ("schornstein", "Im Fenster fehlt ein Schornstein", (92, 104, 12)),
    ("uhr", "Die Uhr zeigt eine andere Zeit", (205, 46, 20)),
    ("lampe", "Eine Lampe leuchtet nicht", (250, 92, 14)),
    ("brot", "Dem langen Brot fehlen die Kerben", (356, 66, 18)),
    ("broetchen", "Im Regal liegt ein Brötchen weniger", (374, 131, 12)),
    ("croissant", "In der Theke fehlt ein Croissant", (100, 188, 13)),
    ("kirsche", "Auf der Torte fehlt die Kirsche", (165, 171, 11)),
    ("brezel", "Am Ständer hängt eine Brezel weniger", (268, 166, 13)),
    ("dampf", "Über dem Kaffee fehlt der Dampf", (312, 166, 13)),
]


def zeiger(cx, cy, laenge, uhr_grad, breite):
    w = math.radians(uhr_grad - 90)
    return (f'<line x1="{cx}" y1="{cy}" x2="{cx + laenge * math.cos(w):.1f}" '
            f'y2="{cy + laenge * math.sin(w):.1f}" stroke="{LINIE}" '
            f'stroke-width="{breite}" stroke-linecap="round"/>')


def brezel(cx, cy, s, farbe, breite):
    return (f'<path d="M{cx - s} {cy + s} C{cx - 2.4 * s} {cy - 0.4 * s} {cx - s} {cy - 1.8 * s} {cx} {cy - 0.6 * s} '
            f'C{cx + s} {cy - 1.8 * s} {cx + 2.4 * s} {cy - 0.4 * s} {cx + s} {cy + s} '
            f'M{cx - s} {cy + s} L{cx + 0.4 * s} {cy - 0.2 * s} M{cx + s} {cy + s} L{cx - 0.4 * s} {cy - 0.2 * s}" '
            f'fill="none" stroke="{farbe}" stroke-width="{breite}" stroke-linecap="round"/>')


def croissant(cx, cy):
    return (f'<path d="M{cx - 14} {cy + 4} Q{cx} {cy - 16} {cx + 14} {cy + 4} Q{cx} {cy - 4} {cx - 14} {cy + 4} Z" '
            f'fill="{KRUSTE_HELL}" stroke="{KRUSTE}" stroke-width="1.5"/>'
            f'<path d="M{cx - 5} {cy - 5} l2 6 M{cx + 5} {cy - 5} l-2 6" stroke="{KRUSTE}" stroke-width="1.5"/>')


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Wand mit Fliesen unten, Boden
    a(f'<rect width="400" height="300" fill="{BEIGE}"/>')
    a('<rect x="0" y="282" width="400" height="18" fill="#b98a5e"/>')

    # Zunftschild mit Brezel
    a(f'<rect x="6" y="14" width="56" height="4" fill="{LINIE}"/>')
    a(f'<line x1="40" y1="18" x2="40" y2="24" stroke="{LINIE}" stroke-width="2"/>')
    a(brezel(40, 36, 9, "#9aa5aa" if "schild" in f else GOLD, 5))

    # Fenster mit Morgenhimmel und Dächern
    a('<rect x="20" y="60" width="92" height="86" fill="#f6c27a"/>')
    a('<rect x="20" y="104" width="92" height="42" fill="#f2d9a8"/>')
    a('<circle cx="62" cy="122" r="14" fill="#fbe7a1"/>')
    a('<path d="M20 146 L20 120 L40 108 L60 120 L60 146 Z M58 146 L58 124 L82 110 L106 124 L112 124 L112 146 Z" fill="#8a6a7a"/>')
    a('<rect x="34" y="100" width="7" height="14" fill="#8a6a7a"/>')
    if "schornstein" not in f:
        a('<rect x="89" y="96" width="7" height="18" fill="#8a6a7a"/>')
    a('<rect x="20" y="60" width="92" height="86" fill="none" stroke="#fbf8f1" stroke-width="6"/>')
    a('<line x1="66" y1="60" x2="66" y2="146" stroke="#fbf8f1" stroke-width="3"/>')

    # Wanduhr (6:10 Uhr)
    a(f'<circle cx="205" cy="46" r="18" fill="#fff" stroke="{HOLZ_DUNKEL}" stroke-width="4"/>')
    for i in range(12):
        w = math.radians(i * 30)
        a(f'<circle cx="{205 + 13 * math.sin(w):.1f}" cy="{46 - 13 * math.cos(w):.1f}" r="1.2" fill="{LINIE}"/>')
    stunde, minute = (3 * 30 + 5, 270) if "uhr" in f else (6 * 30 + 5, 60)
    a(zeiger(205, 46, 8, stunde, 3))
    a(zeiger(205, 46, 13, minute, 2))
    a(f'<circle cx="205" cy="46" r="2" fill="{LINIE}"/>')

    # Hängelampen
    for x in (160, 250):
        a(f'<line x1="{x}" y1="0" x2="{x}" y2="76" stroke="{LINIE}" stroke-width="1.5"/>')
        if not (x == 250 and "lampe" in f):
            a(f'<ellipse cx="{x}" cy="91" rx="10" ry="6" fill="#fff3b0"/>')
        else:
            a(f'<ellipse cx="{x}" cy="90" rx="5" ry="4" fill="#cfc8b8"/>')
        a(f'<path d="M{x - 15} 90 L{x - 6} 74 L{x + 6} 74 L{x + 15} 90 Z" fill="{WEINROT}"/>')

    # Regal mit Broten und Brötchen
    for y in (82, 142):
        a(f'<rect x="288" y="{y}" width="106" height="6" fill="{HOLZ}"/>')
        a(f'<path d="M296 {y + 6} l0 8 l8 -8 z M378 {y + 6} l0 8 l8 -8 z" fill="{HOLZ_DUNKEL}"/>')
    a(f'<path d="M296 82 Q296 54 314 54 Q332 54 332 82 Z" fill="{KRUSTE}"/>')
    a(f'<path d="M306 64 l16 0 M304 72 l20 0" stroke="{KRUSTE_HELL}" stroke-width="2" stroke-linecap="round"/>')
    a(f'<rect x="336" y="58" width="44" height="24" rx="12" fill="{KRUSTE}"/>')
    if "brot" not in f:
        for x in (346, 357, 368):
            a(f'<line x1="{x}" y1="74" x2="{x + 6}" y2="64" stroke="#f6e3bf" stroke-width="2.5" stroke-linecap="round"/>')
    for x in (305, 328, 351, 374):
        if x == 374 and "broetchen" in f:
            continue
        a(f'<ellipse cx="{x}" cy="133" rx="10" ry="8" fill="{KRUSTE_HELL}" stroke="{KRUSTE}" stroke-width="1.5"/>')
        a(f'<line x1="{x - 5}" y1="131" x2="{x + 5}" y2="131" stroke="{KRUSTE}" stroke-width="2"/>')

    # Theke: Glasvitrine links, Arbeitsfläche rechts
    a(f'<rect x="14" y="200" width="380" height="82" fill="{HOLZ}"/>')
    for x in (100, 200, 300):
        a(f'<rect x="{x - 40}" y="214" width="80" height="54" rx="3" fill="none" stroke="{HOLZ_DUNKEL}" stroke-width="2"/>')
    a(f'<rect x="10" y="196" width="388" height="6" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="28" y="150" width="184" height="46" fill="{GLAS}" stroke="#9fb7bf" stroke-width="2"/>')
    a('<line x1="40" y1="156" x2="52" y2="168" stroke="#fff" stroke-width="2"/>')
    a(croissant(60, 188))
    if "croissant" not in f:
        a(croissant(100, 188))
    a('<rect x="145" y="178" width="40" height="17" fill="#f4e2c6"/><rect x="145" y="184" width="40" height="4" fill="#d2453a"/>')
    a('<path d="M145 178 q5 -5 10 0 q5 -5 10 0 q5 -5 10 0 q5 -5 10 0 Z" fill="#fff"/>')
    if "kirsche" not in f:
        a('<circle cx="165" cy="171" r="4" fill="#c8362b"/><path d="M165 167 q2 -5 6 -6" fill="none" stroke="#3f6e3a" stroke-width="1.5"/>')

    # Brezelständer
    a(f'<rect x="248" y="140" width="4" height="56" fill="{HOLZ_DUNKEL}"/><rect x="238" y="192" width="24" height="4" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="228" y="146" width="44" height="3" fill="{HOLZ_DUNKEL}"/>')
    for x in (232, 268):
        if x == 268 and "brezel" in f:
            continue
        a(f'<line x1="{x}" y1="149" x2="{x}" y2="156" stroke="{HOLZ_DUNKEL}" stroke-width="2"/>')
        a(brezel(x, 166, 7, KRUSTE, 4))

    # Kaffeetasse
    a('<rect x="301" y="180" width="22" height="16" rx="3" fill="#fff" stroke="#c8bfb8" stroke-width="1.5"/>')
    a('<path d="M323 184 q8 0 6 6 q-2 4 -6 3" fill="none" stroke="#c8bfb8" stroke-width="2"/>')
    a('<ellipse cx="312" cy="196" rx="16" ry="2.5" fill="#fff" stroke="#c8bfb8"/>')
    if "dampf" not in f:
        for x in (306, 318):
            a(f'<path d="M{x} 176 q-5 -5 0 -10 q5 -5 0 -10" fill="none" stroke="#a89a8a" stroke-width="2" stroke-linecap="round"/>')

    # Korb mit Baguettes
    for x1, x2 in ((348, 340), (360, 362), (372, 384)):
        a(f'<line x1="{x1}" y1="190" x2="{x2}" y2="156" stroke="{KRUSTE}" stroke-width="8" stroke-linecap="round"/>')
    a(f'<path d="M340 176 L392 176 L386 196 L346 196 Z" fill="{GOLD}" stroke="{HOLZ_DUNKEL}" stroke-width="1.5"/>')
    a(f'<path d="M343 184 L389 184" stroke="{HOLZ_DUNKEL}" stroke-width="1"/>')
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
