"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 22 (Oktober 2028): Apfelsaft von der Presse.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr22.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "22"
THEMA = "apfelpresse"
TITEL = "Apfelsaft von der Presse"

HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
GRUEN = "#4f8a3a"
APFEL = "#d2453a"
APFEL_GRUEN = "#9cc94b"
SAFT = "#e8b23a"
SCHEUNE = "#a8402e"
STAHL = "#8aa0a8"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("hahn", "Auf dem Dach fehlt der Wetterhahn", (81, 13, 12)),
    ("tor", "Am Scheunentor fehlt das Kreuz", (80, 190, 28)),
    ("blatt", "In der Luft fliegt ein Blatt weniger", (240, 70, 11)),
    ("apfel", "Am Baum hängt ein grüner Apfel", (318, 62, 11)),
    ("griff", "An der Presse fehlt der Drehgriff", (220, 104, 25)),
    ("saft", "Aus der Presse fließt kein Saft", (255, 245, 12)),
    ("kiste", "Auf der Kiste liegt ein Apfel weniger", (84, 243, 11)),
    ("korken", "Einer Flasche fehlt der Korken", (305, 197, 11)),
    ("flasche", "Auf der Bank steht eine Flasche weniger", (366, 220, 15)),
    ("igel", "Der Igel trägt keinen Apfel", (160, 255, 11)),
]


def apfel(cx, cy, farbe=APFEL, r=6):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{farbe}"/>'
            f'<path d="M{cx} {cy - r + 1} l1 -4" stroke="{HOLZ_DUNKEL}" stroke-width="1.5"/>')


def flasche(cx, korken=True):
    t = [f'<path d="M{cx - 7} 240 L{cx - 7} 214 Q{cx - 7} 208 {cx - 3} 204 L{cx - 3} 196 L{cx + 3} 196 L{cx + 3} 204 '
         f'Q{cx + 7} 208 {cx + 7} 214 L{cx + 7} 240 Z" fill="{SAFT}" stroke="#c9963a" stroke-width="1.2"/>',
         f'<rect x="{cx - 7}" y="220" width="14" height="9" fill="#fbf8f1"/>',
         f'<circle cx="{cx}" cy="224.5" r="3" fill="{APFEL}"/>']
    if korken:
        t.append(f'<rect x="{cx - 3}" y="190" width="6" height="7" rx="1" fill="#c49a6c"/>')
    return "".join(t)


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Himmel, Hof
    a('<rect width="400" height="300" fill="#dfe9ee"/>')
    a('<rect x="0" y="222" width="400" height="78" fill="#c9b07a"/>')
    a('<rect x="0" y="216" width="400" height="8" fill="#8fb06a"/>')

    # Scheune mit Wetterhahn und Tor
    a(f'<rect x="12" y="84" width="136" height="146" fill="{SCHEUNE}"/>')
    for x in range(24, 148, 12):
        a(f'<line x1="{x}" y1="84" x2="{x}" y2="230" stroke="#8f3426" stroke-width="1.5"/>')
    a('<polygon points="0,88 80,30 160,88" fill="#5b3a2a"/>')
    a(f'<line x1="80" y1="30" x2="80" y2="20" stroke="{LINIE}" stroke-width="2"/>')
    if "hahn" not in f:
        a(f'<path d="M72 18 Q72 8 80 10 Q82 4 86 6 L88 9 L85 10 Q90 14 88 18 Z" fill="{LINIE}"/>')
        a(f'<path d="M72 18 Q68 10 70 4 Q74 10 75 16 Z" fill="{LINIE}"/>')
    a(f'<circle cx="80" cy="56" r="8" fill="#fbf8f1"/><line x1="80" y1="48" x2="80" y2="64" stroke="#5b3a2a" stroke-width="2"/>'
      f'<line x1="72" y1="56" x2="88" y2="56" stroke="#5b3a2a" stroke-width="2"/>')
    a(f'<rect x="52" y="150" width="56" height="80" fill="#8f3426" stroke="#fbf8f1" stroke-width="4"/>')
    a('<line x1="80" y1="150" x2="80" y2="230" stroke="#fbf8f1" stroke-width="3"/>')
    if "tor" not in f:
        a('<path d="M54 152 L106 228 M106 152 L54 228" stroke="#fbf8f1" stroke-width="4"/>')

    # Apfelbaum
    a(f'<rect x="340" y="96" width="16" height="124" fill="{HOLZ_DUNKEL}"/>')
    for cx, cy, rx, ry in ((322, 72, 32, 30), (370, 60, 34, 34), (346, 36, 38, 24), (360, 100, 34, 18)):
        a(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{GRUEN}"/>')
    for x, y in ((318, 62), (346, 32), (378, 48), (300, 86), (366, 84), (390, 72), (334, 96)):
        a(apfel(x, y, APFEL_GRUEN if ((x, y) == (318, 62) and "apfel" in f) else APFEL))

    # Fallende Blätter
    for x, y, w, farbe in ((196, 40, 30, "#d9822b"), (240, 70, -20, "#c8562b"), (272, 28, 60, "#e3a33a")):
        if x == 240 and "blatt" in f:
            continue
        a(f'<path d="M{x - 7} {y} Q{x} {y - 6} {x + 7} {y} Q{x} {y + 6} {x - 7} {y} Z" fill="{farbe}" transform="rotate({w} {x} {y})"/>')

    # Spindelpresse
    for x in (185, 249):
        a(f'<rect x="{x}" y="120" width="10" height="132" fill="{HOLZ}"/>')
    a(f'<rect x="180" y="120" width="80" height="14" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="216" y="104" width="8" height="78" fill="{STAHL}"/>')
    for y in range(140, 180, 6):
        a(f'<line x1="216" y1="{y}" x2="224" y2="{y + 3}" stroke="#5f747c" stroke-width="1.5"/>')
    if "griff" not in f:
        a(f'<rect x="196" y="101" width="48" height="6" rx="3" fill="{HOLZ_DUNKEL}"/>')
        a(f'<circle cx="196" cy="104" r="5" fill="{HOLZ}"/><circle cx="244" cy="104" r="5" fill="{HOLZ}"/>')
    a(f'<rect x="198" y="180" width="44" height="7" fill="{HOLZ_DUNKEL}"/>')
    a('<rect x="198" y="187" width="44" height="38" fill="#c9963a"/>')
    for x in range(202, 242, 7):
        a(f'<rect x="{x}" y="187" width="4" height="38" fill="{HOLZ}"/>')
    a(f'<rect x="190" y="225" width="60" height="9" rx="2" fill="{HOLZ_DUNKEL}"/>')
    a(f'<path d="M250 227 L258 229 L258 233 L250 233 Z" fill="{HOLZ_DUNKEL}"/>')
    if "saft" not in f:
        a(f'<path d="M256 233 Q257 246 258 258" fill="none" stroke="{SAFT}" stroke-width="3.5" stroke-linecap="round"/>')
    a(f'<path d="M246 254 L272 254 L268 282 L250 282 Z" fill="{STAHL}"/><ellipse cx="259" cy="254" rx="13" ry="3" fill="{SAFT}"/>')

    # Apfelkiste
    for x, y in ((32, 244), (48, 242), (66, 244), (84, 243), (40, 236), (58, 235), (75, 236)):
        if (x, y) == (84, 243) and "kiste" in f:
            continue
        a(apfel(x, y))
    a(f'<rect x="20" y="248" width="76" height="34" fill="#c49a6c" stroke="{HOLZ}" stroke-width="2"/>')
    a(f'<line x1="20" y1="265" x2="96" y2="265" stroke="{HOLZ}" stroke-width="2"/>')

    # Igel
    a(f'<path d="M140 276 Q140 254 162 254 Q182 254 184 276 Z" fill="#7a5a3a"/>')
    for i in range(7):
        x = 144 + i * 6
        a(f'<path d="M{x} {262 - (3 - abs(3 - i))} l3 -6 l3 6" fill="#5a3f28"/>')
    a('<path d="M140 276 Q132 274 130 270 Q136 264 144 266 Z" fill="#d9b88a"/><circle cx="130" cy="270" r="1.8" fill="#222"/>')
    a('<circle cx="137" cy="268" r="1.3" fill="#222"/>')
    if "igel" not in f:
        a(apfel(160, 253))

    # Bank mit Saftflaschen
    a(f'<rect x="288" y="240" width="104" height="7" fill="{HOLZ}"/>')
    for x in (294, 380):
        a(f'<rect x="{x}" y="247" width="6" height="36" fill="{HOLZ_DUNKEL}"/>')
    for x in (305, 325, 345, 365):
        if x == 365 and "flasche" in f:
            continue
        a(flasche(x, korken=not (x == 305 and "korken" in f)))
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
