"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 14 (Februar 2028): Valentinsdinner.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr14.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "14"
THEMA = "valentinsdinner"
TITEL = "Valentinsdinner für zwei"

WEINROT = "#7a1f2b"
ROT = "#c8362b"
ROSA = "#f3e1dc"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
STAHL = "#9aa5aa"
VORHANG = "#b0303c"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("stern", "Im Fenster fehlt ein Stern", (76, 70, 11)),
    ("vorhang", "Der rechte Vorhang ist blau statt rot", (130, 84, 24)),
    ("girlande", "An der Girlande hängt ein Herz weniger", (290, 38, 13)),
    ("bild", "Im Bilderrahmen: Stern statt Herz", (328, 78, 22)),
    ("stuhl", "Die linke Stuhllehne hat kein Herz", (88, 162, 14)),
    ("rose", "In der Vase steht eine Rose weniger", (213, 126, 11)),
    ("kerze", "Eine Kerze brennt nicht", (258, 138, 11)),
    ("wein", "In einem Glas ist Weißwein statt Rotwein", (279, 170, 13)),
    ("messer", "Neben dem rechten Teller fehlt das Messer", (327, 194, 14)),
    ("schleife", "Am Geschenk fehlt die Schleife", (38, 240, 13)),
]


def herz(cx, cy, s, farbe):
    return (f'<path d="M{cx} {cy + s} C{cx - 2 * s} {cy - s / 2} {cx - s} {cy - 1.6 * s} '
            f'{cx} {cy - 0.6 * s} C{cx + s} {cy - 1.6 * s} {cx + 2 * s} {cy - s / 2} {cx} {cy + s}Z" fill="{farbe}"/>')


def stern(cx, cy, r, farbe, zacken=5):
    pkte = []
    for i in range(2 * zacken):
        rr = r if i % 2 == 0 else r * 0.45
        w = math.radians(-90 + i * 180 / zacken)
        pkte.append(f"{cx + rr * math.cos(w):.1f},{cy + rr * math.sin(w):.1f}")
    return f'<polygon points="{" ".join(pkte)}" fill="{farbe}"/>'


def stuhl(x, mit_herz):
    t = [f'<rect x="{x}" y="140" width="40" height="72" rx="6" fill="{HOLZ_DUNKEL}"/>',
         f'<rect x="{x + 6}" y="146" width="28" height="34" rx="4" fill="{HOLZ}"/>']
    if mit_herz:
        t.append(herz(x + 20, 162, 7, ROSA))
    t.append(f'<rect x="{x - 4}" y="208" width="48" height="8" rx="2" fill="{HOLZ_DUNKEL}"/>')
    for dx in (0, 34):
        t.append(f'<rect x="{x + dx}" y="216" width="6" height="58" fill="{HOLZ_DUNKEL}"/>')
    return "".join(t)


def glas(cx, farbe):
    return (f'<path d="M{cx - 8} 158 L{cx + 8} 158 Q{cx + 8} 176 {cx} 178 Q{cx - 8} 176 {cx - 8} 158 Z" '
            f'fill="#eef3f5" stroke="#9fb7bf" stroke-width="1"/>'
            f'<path d="M{cx - 7.5} 166 L{cx + 7.5} 166 Q{cx + 7} 176 {cx} 177 Q{cx - 7} 176 {cx - 7.5} 166 Z" fill="{farbe}"/>'
            f'<line x1="{cx}" y1="178" x2="{cx}" y2="190" stroke="#9fb7bf" stroke-width="2"/>'
            f'<ellipse cx="{cx}" cy="191" rx="6" ry="2" fill="#9fb7bf"/>')


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Wand, Boden
    a(f'<rect width="400" height="300" fill="{ROSA}"/>')
    a('<rect x="0" y="272" width="400" height="28" fill="#b98a5e"/>')

    # Fenster mit Nachthimmel, Mond und Sternen
    a('<rect x="30" y="28" width="100" height="104" fill="#2c3a63"/>')
    a('<circle cx="104" cy="50" r="11" fill="#f6e7b0"/><circle cx="110" cy="46" r="10" fill="#2c3a63"/>')
    for sx, sy in ((54, 46), (76, 70), (58, 110), (98, 104)):
        if (sx, sy) == (76, 70) and "stern" in f:
            continue
        a(stern(sx, sy, 6, "#f6e7b0"))
    a('<rect x="30" y="28" width="100" height="104" fill="none" stroke="#fbf8f1" stroke-width="6"/>')
    a('<line x1="80" y1="28" x2="80" y2="132" stroke="#fbf8f1" stroke-width="3"/>')
    a('<rect x="22" y="130" width="116" height="7" fill="#fbf8f1"/>')
    # Vorhänge mit Raffband
    a(f'<rect x="12" y="18" width="136" height="6" rx="3" fill="{HOLZ_DUNKEL}"/>')
    a(f'<path d="M16 24 L46 24 Q34 80 44 140 L16 140 Z" fill="{VORHANG}"/>')
    rechts = "#3a6ea8" if "vorhang" in f else VORHANG
    a(f'<path d="M144 24 L114 24 Q126 80 116 140 L144 140 Z" fill="{rechts}"/>')
    a(f'<rect x="16" y="84" width="24" height="5" fill="{GOLD}"/><rect x="120" y="84" width="24" height="5" fill="{GOLD}"/>')

    # Herz-Girlande
    a('<path d="M170 14 Q280 44 390 14" fill="none" stroke="#8a6a5a" stroke-width="1.5"/>')
    for x in (200, 245, 290, 335, 372):
        if x == 290 and "girlande" in f:
            continue
        tt = (x - 170) / 220
        y = 14 + 60 * tt * (1 - tt)
        a(f'<line x1="{x}" y1="{y:.1f}" x2="{x}" y2="{y + 4:.1f}" stroke="#8a6a5a" stroke-width="1"/>')
        a(herz(x, y + 11, 7, ROT if x % 2 == 0 else "#e98a9a"))

    # Bild an der Wand
    a(f'<rect x="300" y="52" width="56" height="52" fill="{GOLD}"/>')
    a('<rect x="306" y="58" width="44" height="40" fill="#fbf8f1"/>')
    a(stern(328, 78, 13, ROT) if "bild" in f else herz(328, 80, 9, ROT))

    # Stühle
    a(stuhl(68, "stuhl" not in f))
    a(stuhl(342, True))

    # Tisch mit Tischdecke
    a('<rect x="115" y="184" width="220" height="22" fill="#fbf8f1"/>')
    a('<path d="M112 204 L338 204 L338 262 Q326 268 314 262 Q302 268 290 262 Q278 268 266 262 Q254 268 242 262 '
      'Q230 268 218 262 Q206 268 194 262 Q182 268 170 262 Q158 268 146 262 Q134 268 122 262 Q117 266 112 262 Z" '
      'fill="#fff" stroke="#e2d6cf" stroke-width="1.5"/>')
    a(f'<rect x="112" y="204" width="226" height="5" fill="{VORHANG}"/>')

    # Teller und Besteck
    for cx in (150, 300):
        a(f'<ellipse cx="{cx}" cy="196" rx="20" ry="6" fill="#fff" stroke="#c8bfb8" stroke-width="1.5"/>')
        a(f'<ellipse cx="{cx}" cy="196" rx="11" ry="3" fill="{ROSA}"/>')
    a(f'<rect x="122" y="187" width="3" height="18" fill="{STAHL}"/><path d="M120 186 v5 M123.5 186 v5 M127 186 v5" stroke="{STAHL}" stroke-width="1.5"/>')
    if "messer" not in f:
        a(f'<path d="M324 180 q6 4 5 17 l-5 0 z" fill="{STAHL}"/><rect x="324" y="196" width="5" height="11" rx="1" fill="{LINIE}"/>')

    # Gläser
    a(glas(172, WEINROT))
    a(glas(279, "#f0d36a" if "wein" in f else WEINROT))

    # Kerzen in Leuchtern
    for cx in (192, 258):
        a(f'<rect x="{cx - 2}" y="178" width="4" height="10" fill="{GOLD}"/><ellipse cx="{cx}" cy="190" rx="8" ry="3" fill="{GOLD}"/>')
        a(f'<rect x="{cx - 4}" y="148" width="8" height="30" fill="#fbf8f1" stroke="#e2d6cf" stroke-width="1"/>')
        a(f'<line x1="{cx}" y1="148" x2="{cx}" y2="144" stroke="{LINIE}" stroke-width="1.5"/>')
        if not (cx == 258 and "kerze" in f):
            a(f'<ellipse cx="{cx}" cy="138" rx="4" ry="7" fill="#f2a93b"/><ellipse cx="{cx}" cy="140" rx="1.8" ry="3.5" fill="#fff3b0"/>')

    # Vase mit Rosen
    for x, y in ((213, 126), (225, 116), (237, 126)):
        if (x, y) == (213, 126) and "rose" in f:
            continue
        a(f'<path d="M{x} {y} Q{(x + 225) / 2} {y + 30} 225 172" fill="none" stroke="#3f6e3a" stroke-width="2"/>')
        a(f'<circle cx="{x}" cy="{y}" r="7" fill="{ROT}"/>')
        a(f'<path d="M{x - 3} {y - 1} q3 -4 6 0 q-3 4 -6 0" fill="none" stroke="{WEINROT}" stroke-width="1.5"/>')
    a('<path d="M212 160 Q209 176 214 190 L236 190 Q241 176 238 160 Z" fill="#9fc8d6" stroke="#6f9fb0" stroke-width="1.5"/>')
    a('<path d="M230 150 q8 -4 10 4 q-7 2 -10 -4 Z" fill="#3f6e3a"/>')

    # Geschenk auf dem Boden
    a(f'<rect x="20" y="246" width="38" height="30" fill="{VORHANG}"/>')
    a(f'<rect x="20" y="246" width="38" height="7" fill="{WEINROT}"/>')
    a(f'<rect x="36" y="246" width="6" height="30" fill="{GOLD}"/>')
    if "schleife" not in f:
        a(f'<path d="M39 246 q-14 -12 -12 -4 q1 6 12 4 q14 -12 12 -4 q-1 6 -12 4 Z" fill="{GOLD}"/>')
        a(f'<circle cx="39" cy="244" r="3" fill="{GOLD}"/>')
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
