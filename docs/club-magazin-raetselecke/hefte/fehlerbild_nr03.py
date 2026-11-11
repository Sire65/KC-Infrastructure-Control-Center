"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 3 (März): Fischstand auf dem Wochenmarkt im Frühling.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild. So können A und B nie versehentlich
an weiteren Stellen auseinanderlaufen.

Aufruf:  python3 fehlerbild_nr03.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "03"
THEMA = "fischmarkt"
TITEL = "Fischstand auf dem Wochenmarkt"

# Club-Farben (Weinrot, Beige, Gold) plus neutrale Töne
WEINROT = "#7a1f2b"
BEIGE = "#f3ead8"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
HOLZ_HELL = "#c89a6a"
LINIE = "#3b2a20"
BLAU = "#2f6f8f"
GRUEN = "#4f8a3a"
HIMMEL = "#cfe9f5"
FISCH = "#9fb3bf"
FISCH_RUECKEN = "#5f7a8a"
ZITRONE = "#f2d23a"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("moewe", "Am Himmel fehlt eine Möwe", (300, 28, 13)),
    ("markise", "Ein Streifen der Markise ist gelb", (170, 70, 23)),
    ("ring", "Der Rettungsring hat blaue statt rote Streifen", (120, 128, 25)),
    ("baerlauch", "Am Brett hängt ein Bärlauchbund weniger", (292, 115, 24)),
    ("fischrichtung", "Ein Fisch liegt andersherum", (115, 184, 26)),
    ("fischfehlt", "Auf dem Eis fehlt ein Fisch", (215, 184, 26)),
    ("waage", "Die Waage zeigt ein anderes Gewicht", (288, 173, 17)),
    ("schild", "Das Fischschild am Tresen ist rot statt golden", (204, 236, 23)),
    ("zitrone", "Eine Zitrone ist grün", (138, 259, 12)),
    ("narzisse", "Eine Narzisse blüht weiß statt gelb", (366, 210, 13)),
]


def zeiger(cx, cy, laenge, uhr_grad, breite, farbe=LINIE):
    w = math.radians(uhr_grad - 90)
    return (f'<line x1="{cx}" y1="{cy}" x2="{cx + laenge * math.cos(w):.1f}" '
            f'y2="{cy + laenge * math.sin(w):.1f}" stroke="{farbe}" '
            f'stroke-width="{breite}" stroke-linecap="round"/>')


def fisch(cx, cy, kopf_rechts=False):
    """Fisch auf dem Eis, Kopf normalerweise links."""
    s = -1 if kopf_rechts else 1
    return (f'<g transform="translate({cx} {cy}) scale({s} 1)">'
            f'<polygon points="12,0 24,-8 24,8" fill="{FISCH_RUECKEN}"/>'
            f'<ellipse cx="0" cy="0" rx="16" ry="7" fill="{FISCH}"/>'
            f'<path d="M-14 -2 Q0 -9 14 -2" fill="none" stroke="{FISCH_RUECKEN}" stroke-width="3"/>'
            f'<line x1="-8" y1="-5" x2="-8" y2="5" stroke="{FISCH_RUECKEN}" stroke-width="1.5"/>'
            f'<circle cx="-11" cy="-1" r="1.8" fill="{LINIE}"/></g>')


def baerlauch(x):
    t = [f'<line x1="{x}" y1="92" x2="{x}" y2="102" stroke="{LINIE}" stroke-width="1"/>']
    for w in (-22, -11, 0, 11, 22):
        t.append(f'<ellipse cx="{x}" cy="122" rx="3.5" ry="14" fill="{GRUEN}" '
                 f'transform="rotate({w} {x} 104)"/>')
    t.append(f'<rect x="{x - 5}" y="100" width="10" height="5" rx="1" fill="{WEINROT}"/>')
    return "".join(t)


def wolke(x, y):
    return (f'<g fill="#fff"><circle cx="{x - 12}" cy="{y + 3}" r="8"/><circle cx="{x}" cy="{y - 2}" r="11"/>'
            f'<circle cx="{x + 13}" cy="{y + 3}" r="8"/><rect x="{x - 12}" y="{y + 3}" width="25" height="8"/></g>')


def moewe(x, y):
    return (f'<path d="M{x - 10} {y} q5 -7 10 0 q5 -7 10 0" fill="none" stroke="{LINIE}" '
            f'stroke-width="2.5" stroke-linecap="round"/>')


def narzisse(cx, cy, farbe):
    t = []
    for i in range(6):
        w = math.radians(i * 60)
        t.append(f'<circle cx="{cx + 5 * math.cos(w):.1f}" cy="{cy + 5 * math.sin(w):.1f}" r="4" fill="{farbe}"/>')
    t.append(f'<circle cx="{cx}" cy="{cy}" r="3.2" fill="#e8892b"/>')
    return "".join(t)


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Himmel, Pflaster
    a(f'<rect width="400" height="300" fill="{HIMMEL}"/>')
    a('<rect x="0" y="240" width="400" height="60" fill="#d8d0c2"/>')
    for reihe, y in enumerate((250, 264, 278, 292)):
        for x in range(-10 + (reihe % 2) * 12, 410, 24):
            a(f'<rect x="{x}" y="{y - 5}" width="20" height="10" rx="4" fill="none" stroke="#bfb5a3" stroke-width="1.5"/>')
    a('<circle cx="370" cy="28" r="14" fill="#fff1a8"/>')
    a(wolke(40, 26))
    a(wolke(228, 20))
    a(moewe(130, 24))
    if "moewe" not in f:
        a(moewe(300, 30))

    # Blühender Baum links
    a(f'<rect x="24" y="140" width="9" height="105" fill="{HOLZ_DUNKEL}"/>')
    for x, y, r in ((18, 120, 16), (40, 112, 16), (28, 98, 15), (46, 132, 12), (12, 138, 11)):
        a(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#f4c1cf"/>')
    for x, y in ((20, 110), (36, 100), (44, 124), (14, 132), (30, 128)):
        a(f'<circle cx="{x}" cy="{y}" r="2.2" fill="#fff"/>')

    # Stand: Pfosten, Rückwand
    a(f'<rect x="70" y="60" width="8" height="200" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="322" y="60" width="8" height="200" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="78" y="88" width="244" height="90" fill="{HOLZ_HELL}"/>')
    for y in (110, 132, 154):
        a(f'<line x1="78" y1="{y}" x2="322" y2="{y}" stroke="{HOLZ}" stroke-width="1.5"/>')

    # Markise mit Streifen und Bogenkante
    for i in range(14):
        x = 60 + 20 * i
        c = WEINROT if i % 2 == 0 else BEIGE
        if i == 5 and "markise" in f:
            c = "#f2d23a"
        a(f'<rect x="{x}" y="50" width="20" height="30" fill="{c}"/>')
        a(f'<path d="M{x} 80 a10 10 0 0 0 20 0 z" fill="{c}"/>')
    a(f'<rect x="56" y="46" width="288" height="6" rx="2" fill="{HOLZ_DUNKEL}"/>')

    # Rettungsring
    a(f'<circle cx="120" cy="92" r="2" fill="{LINIE}"/>')
    a('<line x1="120" y1="92" x2="120" y2="106" stroke="#bfa57a" stroke-width="2"/>')
    a('<circle cx="120" cy="128" r="17" fill="none" stroke="#fff" stroke-width="10"/>')
    ring = BLAU if "ring" in f else "#d8392b"
    a(f'<circle cx="120" cy="128" r="17" fill="none" stroke="{ring}" stroke-width="10" '
      f'stroke-dasharray="13.35 13.35" transform="rotate(-22 120 128)"/>')

    # Kreidetafel mit Fisch
    a(f'<rect x="172" y="102" width="56" height="46" rx="2" fill="{HOLZ_DUNKEL}"/>')
    a('<rect x="176" y="106" width="48" height="38" fill="#2f3a33"/>')
    a('<path d="M188 125 Q200 113 212 125 Q200 137 188 125 Z M212 125 l8 -6 v12 z" fill="none" '
      'stroke="#f4f4f4" stroke-width="1.8" stroke-linejoin="round"/>')
    a('<circle cx="193" cy="123" r="1.3" fill="#f4f4f4"/>')

    # Bärlauchbunde
    a(baerlauch(262))
    if "baerlauch" not in f:
        a(baerlauch(292))

    # Eisbett mit Fischen
    a('<rect x="84" y="170" width="168" height="28" rx="4" fill="#e8f4f8"/>')
    for i in range(16):
        x = 90 + (i * 37) % 156
        y = 174 + (i * 11) % 20
        a(f'<rect x="{x}" y="{y}" width="6" height="4" rx="1" fill="#bfdde9"/>')
    a(fisch(115, 184, kopf_rechts=("fischrichtung" in f)))
    a(fisch(165, 186))
    if "fischfehlt" not in f:
        a(fisch(215, 184))
    for x in (140, 190):   # Petersilie
        a(f'<circle cx="{x}" cy="190" r="3" fill="{GRUEN}"/><circle cx="{x + 4}" cy="187" r="3" fill="{GRUEN}"/>')

    # Waage mit Zifferblatt
    a('<rect x="286" y="140" width="4" height="10" fill="#888"/>')
    a('<ellipse cx="288" cy="140" rx="24" ry="4" fill="#a9a9a9"/>')
    a('<rect x="276" y="130" width="22" height="10" rx="2" fill="#fff" stroke="#c9c9c9"/>')
    a('<rect x="262" y="150" width="52" height="48" rx="4" fill="#d7d7d7" stroke="#a9a9a9" stroke-width="2"/>')
    a('<circle cx="288" cy="173" r="14" fill="#fff" stroke="#777" stroke-width="1.5"/>')
    for i in range(-3, 4):
        w = math.radians(i * 30)
        a(f'<line x1="{288 + 10 * math.sin(w):.1f}" y1="{173 - 10 * math.cos(w):.1f}" '
          f'x2="{288 + 13 * math.sin(w):.1f}" y2="{173 - 13 * math.cos(w):.1f}" stroke="{LINIE}" stroke-width="1.2"/>')
    a(zeiger(288, 173, 11, 60 if "waage" in f else -60, 3, WEINROT))
    a(f'<circle cx="288" cy="173" r="2" fill="{LINIE}"/>')

    # Tresen mit Fischschild
    a(f'<rect x="78" y="198" width="244" height="64" fill="{HOLZ}"/>')
    a(f'<rect x="74" y="195" width="252" height="6" rx="2" fill="{HOLZ_DUNKEL}"/>')
    for x in range(108, 322, 30):
        a(f'<line x1="{x}" y1="201" x2="{x}" y2="262" stroke="{HOLZ_DUNKEL}" stroke-width="1.5"/>')
    schild = "#d8392b" if "schild" in f else GOLD
    a(f'<polygon points="210,236 222,227 222,245" fill="{schild}" stroke="{LINIE}" stroke-width="1"/>')
    a(f'<ellipse cx="197" cy="236" rx="15" ry="9" fill="{schild}" stroke="{LINIE}" stroke-width="1"/>')
    a(f'<circle cx="188" cy="234" r="1.8" fill="{LINIE}"/>')

    # Zitronenkiste
    for x, y in ((104, 259), (121, 257), (138, 259), (155, 261)):
        farbe = "#8cbf3f" if (x == 138 and "zitrone" in f) else ZITRONE
        a(f'<ellipse cx="{x}" cy="{y}" rx="9" ry="7" fill="{farbe}" stroke="#c9a12a" stroke-width="1"/>')
    a(f'<rect x="90" y="262" width="74" height="30" fill="{HOLZ_HELL}" stroke="{HOLZ_DUNKEL}" stroke-width="2"/>')
    a(f'<line x1="90" y1="277" x2="164" y2="277" stroke="{HOLZ_DUNKEL}" stroke-width="1.5"/>')

    # Narzissen im Eimer rechts
    for x, y in ((352, 218), (366, 210), (380, 220)):
        a(f'<line x1="{x}" y1="{y}" x2="{(x + 366) / 2:.0f}" y2="250" stroke="{GRUEN}" stroke-width="2.5"/>')
    a(f'<path d="M358 250 l-8 -26 M374 250 l9 -24" stroke="{GRUEN}" stroke-width="3" stroke-linecap="round"/>')
    for x, y in ((352, 218), (366, 210), (380, 220)):
        weiss = x == 366 and "narzisse" in f
        a(narzisse(x, y, "#fbfbf5" if weiss else ZITRONE))
    a('<path d="M346 248 L386 248 L381 292 L351 292 Z" fill="#b9c3c7" stroke="#8e979c" stroke-width="2"/>')
    a('<line x1="348" y1="262" x2="384" y2="262" stroke="#8e979c" stroke-width="1.5"/>')
    return "".join(t)


def svg(inhalt, titel):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" '
            f'aria-label="{titel}"><title>{titel}</title>{inhalt}</svg>\n')


def main():
    alle = frozenset(k for k, _, _ in FEHLER)
    a = szene()
    b = szene(alle)
    kreise = "".join(
        f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="#e0262f" stroke-width="3"/>'
        f'<text x="{x + r * 0.7:.0f}" y="{y - r * 0.7:.0f}" font-size="11" font-family="sans-serif" '
        f'font-weight="700" fill="#e0262f">{i + 1}</text>'
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
    # Selbstprüfung: jeder Fehler allein muss das Bild verändern
    for k, _, _ in FEHLER:
        assert szene(frozenset([k])) != a, f"Fehler {k} ändert nichts"
    assert len(FEHLER) == 10 and len({k for k, _, _ in FEHLER}) == 10
    print(f"Fehlerbild Nr. {NR}: 10 Fehler, alle wirksam")


if __name__ == "__main__":
    main()
