"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 8 (August): Grillabend im Garten.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild. So können A und B nie versehentlich
an weiteren Stellen auseinanderlaufen.

Aufruf:  python3 fehlerbild_nr08.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "08"
THEMA = "grillabend"
NAME = "Grillabend im Garten"

# Club-Farben (Weinrot, Beige, Gold) plus Holz- und Abendtöne
WEINROT = "#7a1f2b"
BEIGE = "#f3ead8"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
HIMMEL = "#3b4775"
LICHT = "#ffd86b"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("mond", "Vollmond statt Mondsichel", (55, 38, 21)),
    ("stern", "Am Himmel fehlt ein Stern", (225, 20, 11)),
    ("birne", "Eine Glühbirne leuchtet blau", (320, 92, 13)),
    ("latte", "Im Zaun fehlt eine Latte", (188, 158, 28)),
    ("paprika", "Am Spieß: gelbe statt rote Paprika", (90, 187, 12)),
    ("zange", "Die Grillzange fehlt", (166, 213, 23)),
    ("rad", "Am Grill fehlt ein Rad", (148, 262, 12)),
    ("aubergine", "Auf dem Teller fehlt eine Aubergine", (279, 186, 13)),
    ("glas", "Ein Weinglas ist leer", (325, 181, 13)),
    ("flamme", "Im Windlicht brennt keine Kerze", (360, 182, 11)),
]


def stern(cx, cy, r, farbe):
    pkte = []
    for i in range(10):
        rr = r if i % 2 == 0 else r * 0.45
        w = math.radians(-90 + i * 36)
        pkte.append(f"{cx + rr * math.cos(w):.1f},{cy + rr * math.sin(w):.1f}")
    return f'<polygon points="{" ".join(pkte)}" fill="{farbe}"/>'


def bogenpunkt(p0, p1, p2, s):
    return tuple((1 - s) ** 2 * p0[i] + 2 * s * (1 - s) * p1[i] + s ** 2 * p2[i] for i in range(2))


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Abendhimmel, Mond, Sterne
    a(f'<rect width="400" height="300" fill="{HIMMEL}"/>')
    a('<rect x="0" y="100" width="400" height="40" fill="#5a5585"/>')
    a('<circle cx="55" cy="38" r="17" fill="#f6eec9"/>')
    if "mond" not in f:
        a(f'<circle cx="64" cy="32" r="15" fill="{HIMMEL}"/>')
    for x, y in ((135, 28), (175, 50), (225, 20), (285, 38), (350, 22), (388, 50)):
        if (x, y) == (225, 20) and "stern" in f:
            continue
        a(stern(x, y, 7, "#f6d55c"))

    # Hecke und Zaun
    a('<rect x="0" y="112" width="400" height="70" fill="#2f5e3a"/>')
    for x in range(0, 401, 30):
        a(f'<circle cx="{x}" cy="114" r="16" fill="#2f5e3a"/>')
    a('<rect x="0" y="180" width="400" height="120" fill="#4f7f3c"/>')
    for x in range(12, 400, 22):
        if x == 188 and "latte" in f:
            continue
        a(f'<path d="M{x - 6} 185 V140 L{x} 132 L{x + 6} 140 V185 Z" fill="#c89a6a" stroke="{HOLZ_DUNKEL}"/>')
    for y in (146, 171):
        a(f'<rect x="0" y="{y}" width="400" height="6" fill="{HOLZ}"/>')

    # Lichterkette in zwei Bögen
    for p0, p1, p2 in (((0, 72), (100, 100), (200, 72)), ((200, 72), (300, 100), (400, 72))):
        a(f'<path d="M{p0[0]} {p0[1]} Q{p1[0]} {p1[1]} {p2[0]} {p2[1]}" fill="none" stroke="#1d2340" stroke-width="2"/>')
        for s in (0.2, 0.4, 0.6, 0.8):
            x, y = bogenpunkt(p0, p1, p2, s)
            farbe = "#4fc3e0" if (round(x), "birne") == (320, "birne") and "birne" in f else LICHT
            a(f'<circle cx="{x:.0f}" cy="{y + 8:.1f}" r="9" fill="{farbe}" opacity="0.3"/>')
            a(f'<rect x="{x - 2:.0f}" y="{y:.1f}" width="4" height="4" fill="#1d2340"/>')
            a(f'<ellipse cx="{x:.0f}" cy="{y + 8:.1f}" rx="4" ry="5" fill="{farbe}"/>')

    # Grill mit Spießen und Rauch
    for x in (95, 110, 125):
        a(f'<path d="M{x} 168 q-7 -8 0 -15 q7 -7 0 -15" fill="none" stroke="#c9c4d6" stroke-width="3" '
          f'stroke-linecap="round" opacity="0.8"/>')
    a('<line x1="85" y1="215" x2="72" y2="262" stroke="#2b2b2b" stroke-width="4"/>')
    a('<line x1="135" y1="215" x2="148" y2="262" stroke="#2b2b2b" stroke-width="4"/>')
    a('<line x1="110" y1="220" x2="110" y2="268" stroke="#2b2b2b" stroke-width="4"/>')
    a('<line x1="74" y1="250" x2="146" y2="250" stroke="#2b2b2b" stroke-width="3"/>')
    a('<circle cx="72" cy="262" r="7" fill="#555"/>')
    if "rad" not in f:
        a('<circle cx="148" cy="262" r="7" fill="#555"/>')
    a('<ellipse cx="110" cy="189" rx="47" ry="9" fill="#555"/>')
    for y, folge in ((179, ("#7a3b22", "#3f8a3a", "#7a3b22", "#f3ead8", "#7a3b22")),
                     (187, ("#7a3b22", "#d8392b", "#7a3b22", "#f3ead8", "#3f8a3a", "#7a3b22"))):
        a(f'<line x1="66" y1="{y}" x2="156" y2="{y}" stroke="#d9cdb6" stroke-width="2"/>')
        for i, farbe in enumerate(folge):
            x = 76 + 14 * i
            if y == 187 and i == 1 and "paprika" in f:
                farbe = "#f2c230"
            a(f'<rect x="{x - 6}" y="{y - 6}" width="12" height="12" rx="2" fill="{farbe}"/>')
    a('<path d="M63 192 a47 32 0 0 0 94 0 z" fill="#2b2b2b"/>')
    a('<rect x="104" y="220" width="12" height="4" fill="#555"/>')
    a('<line x1="150" y1="196" x2="162" y2="196" stroke="#555" stroke-width="3"/>')
    if "zange" not in f:
        a('<path d="M160 196 L158 230 M164 196 L172 229" stroke="#9aa5aa" stroke-width="3" stroke-linecap="round"/>')

    # Gartentisch mit Tischdecke
    a(f'<rect x="242" y="215" width="7" height="70" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="372" y="215" width="7" height="70" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="228" y="196" width="164" height="8" fill="{HOLZ}"/>')
    bogen = " q-10 12 -20 0" * 8
    a(f'<path d="M232 196 h160 v18{bogen} z" fill="{WEINROT}"/>')
    a(f'<path d="M232 206 h160" stroke="{GOLD}" stroke-width="2"/>')
    # Teller mit Auberginen
    a('<ellipse cx="262" cy="194" rx="27" ry="5" fill="#fff" stroke="#d9cdb6"/>')
    for x in (247, 263, 279):
        if x == 279 and "aubergine" in f:
            continue
        a(f'<ellipse cx="{x}" cy="187" rx="7" ry="8" fill="#5b2a6e"/>')
        a(f'<path d="M{x - 4} 180 L{x} 176 L{x + 4} 180 Z" fill="#3f8a3a"/>')
    # Weingläser
    for x in (305, 325):
        a(f'<path d="M{x - 7} 168 L{x + 7} 168 Q{x + 7} 186 {x} 186 Q{x - 7} 186 {x - 7} 168 Z" '
          f'fill="#e9f2f6" fill-opacity="0.8" stroke="#c7d6db"/>')
        if not (x == 325 and "glas" in f):
            a(f'<path d="M{x - 7} 175 L{x + 7} 175 Q{x + 6} 186 {x} 186 Q{x - 6} 186 {x - 7} 175 Z" fill="{WEINROT}"/>')
        a(f'<line x1="{x}" y1="186" x2="{x}" y2="195" stroke="#c7d6db" stroke-width="2"/>')
        a(f'<ellipse cx="{x}" cy="195" rx="5" ry="1.5" fill="#c7d6db"/>')
    # Windlicht
    a(f'<polygon points="347,169 360,160 373,169" fill="{LINIE}"/>')
    a('<rect x="350" y="169" width="20" height="26" fill="#f4ead2" fill-opacity="0.35" stroke="#2b2b2b" stroke-width="2"/>')
    a('<rect x="356" y="185" width="8" height="9" fill="#fff"/>')
    if "flamme" not in f:
        a(f'<circle cx="360" cy="180" r="7" fill="{LICHT}" opacity="0.5"/>')
        a('<ellipse cx="360" cy="180" rx="3" ry="5" fill="#f0a030"/>')

    # Blumentopf vorn links
    a('<path d="M14 270 L44 270 L40 292 L18 292 Z" fill="#c06a3e"/>')
    for dx in (-8, 0, 8):
        a(f'<ellipse cx="{29 + dx}" cy="258" rx="5" ry="12" fill="#6aa84f" transform="rotate({dx * 3} {29 + dx} 268)"/>')
    a('<circle cx="29" cy="246" r="5" fill="#f2c230"/>')
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
    name = NAME
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
