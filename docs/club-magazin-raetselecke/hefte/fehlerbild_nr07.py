"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 7 (Juli): Picknick am Mühlteich.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild. So können A und B nie versehentlich
an weiteren Stellen auseinanderlaufen.

Aufruf:  python3 fehlerbild_nr07.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "07"
THEMA = "picknick"
NAME = "Picknick am Mühlteich"

# Club-Farben (Weinrot, Beige, Gold) plus Holz- und Sommertöne
WEINROT = "#7a1f2b"
BEIGE = "#f3ead8"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
HIMMEL = "#cfe9f5"
WASSER = "#6fb3d2"
GRUEN = "#5f9a45"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("wolke", "Eine Wolke fehlt", (235, 36, 28)),
    ("fenster", "An der Mühle fehlt ein Fenster", (81, 105, 13)),
    ("schaufel", "Am Wasserrad fehlt eine Schaufel", (141, 121, 12)),
    ("ente", "Eine Ente schwimmt in die andere Richtung", (205, 159, 23)),
    ("vogelhaus", "Das Vogelhäuschen am Baum fehlt", (365, 123, 16)),
    ("henkel", "Der Picknickkorb hat keinen Henkel", (135, 207, 26)),
    ("schuessel", "Die Gurkensalat-Schüssel ist blau", (215, 238, 27)),
    ("becher", "Ein Becher fehlt", (318, 240, 13)),
    ("blume", "Eine Blume blüht blau statt rot", (370, 255, 12)),
    ("falter", "Der Schmetterling fehlt", (40, 196, 14)),
]


def wolke(cx, cy):
    return (f'<ellipse cx="{cx}" cy="{cy + 6}" rx="24" ry="7" fill="#fff"/>'
            f'<circle cx="{cx - 12}" cy="{cy + 2}" r="9" fill="#fff"/>'
            f'<circle cx="{cx + 1}" cy="{cy - 4}" r="12" fill="#fff"/>'
            f'<circle cx="{cx + 13}" cy="{cy + 2}" r="8" fill="#fff"/>')


def ente(cx, cy, richtung, farbe="#fff"):
    d = richtung
    return (f'<polygon points="{cx - 11 * d},{cy - 2} {cx - 19 * d},{cy - 8} {cx - 13 * d},{cy + 4}" fill="{farbe}" stroke="#9aa5aa"/>'
            f'<ellipse cx="{cx}" cy="{cy}" rx="13" ry="7" fill="{farbe}" stroke="#9aa5aa"/>'
            f'<circle cx="{cx + 9 * d}" cy="{cy - 9}" r="6" fill="{farbe}" stroke="#9aa5aa"/>'
            f'<polygon points="{cx + 14 * d},{cy - 10} {cx + 21 * d},{cy - 8} {cx + 14 * d},{cy - 6}" fill="#f0a030"/>'
            f'<circle cx="{cx + 10 * d}" cy="{cy - 10}" r="1.3" fill="{LINIE}"/>')


def blume(cx, cy, farbe):
    t = f'<line x1="{cx}" y1="{cy}" x2="{cx}" y2="{cy + 16}" stroke="#3f7a35" stroke-width="2"/>'
    for i in range(5):
        w = math.radians(i * 72 - 90)
        t += f'<circle cx="{cx + 4.5 * math.cos(w):.1f}" cy="{cy + 4.5 * math.sin(w):.1f}" r="3.5" fill="{farbe}"/>'
    return t + f'<circle cx="{cx}" cy="{cy}" r="2.2" fill="#fff4c2"/>'


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Himmel, Sonne, Wolken, Hügel, Wiese
    a(f'<rect width="400" height="300" fill="{HIMMEL}"/>')
    for i in range(8):
        w = math.radians(i * 45)
        a(f'<line x1="{310 + 21 * math.cos(w):.1f}" y1="{38 + 21 * math.sin(w):.1f}" '
          f'x2="{310 + 29 * math.cos(w):.1f}" y2="{38 + 29 * math.sin(w):.1f}" stroke="#f2c230" '
          f'stroke-width="3" stroke-linecap="round"/>')
    a('<circle cx="310" cy="38" r="16" fill="#f6d55c"/>')
    a(wolke(95, 30))
    if "wolke" not in f:
        a(wolke(235, 36))
    a('<ellipse cx="110" cy="150" rx="190" ry="52" fill="#a8cf86"/>')
    a('<ellipse cx="330" cy="155" rx="140" ry="45" fill="#9cc47a"/>')
    a('<rect x="0" y="140" width="400" height="160" fill="#8cbf62"/>')

    # Baum mit Vogelhäuschen
    a(f'<rect x="358" y="92" width="14" height="80" fill="{HOLZ}"/>')
    a(f'<circle cx="345" cy="98" r="18" fill="{GRUEN}"/><circle cx="386" cy="98" r="18" fill="{GRUEN}"/>')
    a('<circle cx="365" cy="80" r="28" fill="#6aa84f"/>')
    if "vogelhaus" not in f:
        a(f'<rect x="357" y="120" width="16" height="15" fill="{WEINROT}"/>')
        a(f'<polygon points="353,121 365,110 377,121" fill="{HOLZ_DUNKEL}"/>')
        a(f'<circle cx="365" cy="127" r="3" fill="{LINIE}"/>')

    # Mühlteich mit Schilf und Enten
    a(f'<ellipse cx="230" cy="168" rx="122" ry="22" fill="{WASSER}"/>')
    for x, y in ((180, 172), (250, 178), (290, 163)):
        a(f'<line x1="{x}" y1="{y}" x2="{x + 18}" y2="{y}" stroke="#a9d6ea" stroke-width="2" stroke-linecap="round"/>')
    for x in (330, 337, 344):
        a(f'<line x1="{x}" y1="178" x2="{x + (x - 337) / 2}" y2="150" stroke="#4f7a35" stroke-width="2"/>')
        a(f'<ellipse cx="{x + (x - 337) / 2}" cy="152" rx="2.5" ry="6" fill="{HOLZ_DUNKEL}"/>')
    a(ente(205, 163, -1 if "ente" in f else 1))
    a(ente(275, 170, -1))

    # Mühle (Fachwerk) mit Wasserrad
    a(f'<rect x="78" y="52" width="11" height="24" fill="{HOLZ_DUNKEL}"/>')
    a('<rect x="20" y="86" width="80" height="64" fill="#f7efe0"/>')
    a(f'<path d="M20 118 h80 M44 86 v64 M76 86 v64" stroke="{HOLZ_DUNKEL}" stroke-width="3"/>')
    a(f'<polygon points="12,88 60,48 108,88" fill="{WEINROT}"/>')
    a(f'<path d="M52 150 v-22 a8 8 0 0 1 16 0 v22 z" fill="{HOLZ_DUNKEL}"/>')
    for x in (35,) if "fenster" in f else (35, 81):
        a(f'<rect x="{x - 7}" y="96" width="14" height="14" fill="#bfe0ef" stroke="{HOLZ_DUNKEL}" stroke-width="2"/>')
        a(f'<path d="M{x} 96 v14 M{x - 7} 103 h14" stroke="{HOLZ_DUNKEL}" stroke-width="1.5"/>')
    a(f'<circle cx="122" cy="140" r="24" fill="none" stroke="{HOLZ_DUNKEL}" stroke-width="4"/>')
    for i in range(4):
        w = math.radians(i * 45)
        a(f'<line x1="{122 + 24 * math.cos(w):.1f}" y1="{140 + 24 * math.sin(w):.1f}" '
          f'x2="{122 - 24 * math.cos(w):.1f}" y2="{140 - 24 * math.sin(w):.1f}" stroke="{HOLZ_DUNKEL}" stroke-width="3"/>')
    for i in range(8):
        if i == 7 and "schaufel" in f:
            continue
        g = i * 45
        w = math.radians(g)
        x, y = 122 + 27 * math.cos(w), 140 + 27 * math.sin(w)
        a(f'<rect x="{x - 5:.1f}" y="{y - 4:.1f}" width="10" height="8" fill="{HOLZ}" stroke="{HOLZ_DUNKEL}" '
          f'transform="rotate({g} {x:.1f} {y:.1f})"/>')
    a(f'<circle cx="122" cy="140" r="5" fill="{GOLD}"/>')
    a('<path d="M104 166 q8 6 18 2 q10 -4 18 2" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>')

    # Picknickdecke (kariert)
    for r in range(4):
        for s in range(13):
            farbe = WEINROT if (r + s) % 2 == 0 else BEIGE
            a(f'<rect x="{70 + 20 * s}" y="{205 + 20 * r}" width="20" height="20" fill="{farbe}"/>')

    # Korb
    if "henkel" not in f:
        a(f'<path d="M116 222 Q135 186 154 222" fill="none" stroke="{HOLZ_DUNKEL}" stroke-width="5"/>')
    a(f'<rect x="110" y="218" width="50" height="30" rx="5" fill="{HOLZ}"/>')
    for y in (226, 234, 242):
        a(f'<line x1="112" y1="{y}" x2="158" y2="{y}" stroke="{HOLZ_DUNKEL}" stroke-width="1.5"/>')
    a(f'<path d="M110 220 h50 l-6 8 h-38 z" fill="{GOLD}"/>')

    # Gurkensalat
    a(f'<path d="M190 234 a25 15 0 0 0 50 0 z" fill="{"#3f7fb0" if "schuessel" in f else "#fff"}" stroke="#9aa5aa"/>')
    a('<ellipse cx="215" cy="234" rx="25" ry="5" fill="#d6ecb4"/>')
    for x in (200, 211, 222, 232):
        a(f'<ellipse cx="{x}" cy="232" rx="5" ry="3" fill="#a6d672" stroke="#3f7a35"/>')

    # Flasche und Becher
    a('<rect x="274" y="216" width="16" height="36" rx="3" fill="#3f8a4a"/>')
    a('<rect x="279" y="203" width="6" height="14" fill="#3f8a4a"/>')
    a(f'<rect x="279" y="198" width="6" height="6" fill="{HOLZ}"/>')
    a(f'<rect x="274" y="228" width="16" height="11" fill="{GOLD}"/>')
    for x in (300,) if "becher" in f else (300, 318):
        a(f'<path d="M{x - 7} 233 L{x + 7} 233 L{x + 5} 249 L{x - 5} 249 Z" fill="#fff" stroke="#9aa5aa"/>')
        a(f'<rect x="{x - 7}" y="233" width="14" height="3" fill="{GOLD}"/>')

    # Blumen in der Wiese
    a(blume(25, 250, "#e04a5f"))
    a(blume(42, 268, "#f2c230"))
    a(blume(370, 255, "#3f7fb0" if "blume" in f else "#e04a5f"))
    a(blume(388, 272, "#f2c230"))

    # Schmetterling
    if "falter" not in f:
        a(f'<ellipse cx="34" cy="192" rx="7" ry="5" fill="{GOLD}" transform="rotate(-25 34 192)"/>')
        a(f'<ellipse cx="46" cy="192" rx="7" ry="5" fill="{GOLD}" transform="rotate(25 46 192)"/>')
        a(f'<ellipse cx="35" cy="201" rx="5" ry="4" fill="{WEINROT}"/>')
        a(f'<ellipse cx="45" cy="201" rx="5" ry="4" fill="{WEINROT}"/>')
        a(f'<rect x="39" y="188" width="2" height="16" rx="1" fill="{LINIE}"/>')
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
