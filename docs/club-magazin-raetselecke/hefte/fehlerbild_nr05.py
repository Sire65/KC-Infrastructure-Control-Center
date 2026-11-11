"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 5 (Mai): Spargelzeit in der Landküche.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild. So können A und B nie versehentlich
an weiteren Stellen auseinanderlaufen.

Aufruf:  python3 fehlerbild_nr05.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "05"
THEMA = "spargelzeit"
TITEL = "Spargelzeit in der Landküche"

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
KUPFER = "#c06a3b"
SPARGEL = "#f4efdc"
SPARGEL_KOPF = "#e3d6b0"
RHABARBER = "#c23b4a"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("pfanne", "An der Wand hängt eine Pfanne weniger", (76, 50, 21)),
    ("kranz", "Am Maibaum fehlt der Kranz", (205, 68, 20)),
    ("dampf", "Aus dem Spargeltopf steigt kein Dampf", (51, 99, 18)),
    ("rhabarber", "Ein Rhabarberblatt fehlt", (378, 110, 19)),
    ("band", "Das Band um den Spargelbund ist grün statt rot", (136, 171, 16)),
    ("gruen", "Eine Spargelstange ist grün statt weiß", (205, 186, 21)),
    ("loeffel", "In der Sauciere steckt ein Löffel", (270, 158, 15)),
    ("kartoffel", "In der Schüssel fehlt eine Kartoffel", (330, 162, 12)),
    ("schleife", "Am Vorhang fehlt die Schleife", (200, 238, 14)),
    ("lila", "Im Korb ist eine Spargelstange lila", (62, 247, 13)),
]


def stange(x1, y, x2, farbe=SPARGEL, kopf=SPARGEL_KOPF):
    """Liegende Spargelstange von x1 (Ende) bis x2 (Kopf)."""
    return (f'<line x1="{x1}" y1="{y}" x2="{x2 - 6}" y2="{y}" stroke="#b8a77c" stroke-width="7.5" stroke-linecap="round"/>'
            f'<line x1="{x1}" y1="{y}" x2="{x2 - 6}" y2="{y}" stroke="{farbe}" stroke-width="5" stroke-linecap="round"/>'
            f'<ellipse cx="{x2 - 3}" cy="{y}" rx="5" ry="3.4" fill="{kopf}" stroke="#b8a77c" stroke-width="0.8"/>')


def pfanne(cx, cy, r):
    return (f'<rect x="{cx - 2.5}" y="30" width="5" height="{cy - r - 28}" rx="2" fill="{HOLZ_DUNKEL}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{KUPFER}" stroke="#8f4a26" stroke-width="2"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r * 0.6:.1f}" fill="#d98a5c"/>')


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Gekalkte Wand mit Fachwerkbalken
    a('<rect width="400" height="300" fill="#f7f1e3"/>')
    a(f'<rect x="0" y="0" width="400" height="14" fill="{HOLZ_DUNKEL}"/>')
    for x in (100, 300):
        a(f'<rect x="{x}" y="14" width="8" height="176" fill="{HOLZ_DUNKEL}"/>')
    a(f'<path d="M8 14 L28 14 L8 34 Z M392 14 L372 14 L392 34 Z" fill="{HOLZ_DUNKEL}"/>')

    # Fenster mit Dorfplatz und Maibaum
    a('<rect x="124" y="30" width="162" height="108" fill="#cfe9f5"/>')
    a('<path d="M124 112 Q170 96 210 108 T286 104 V138 H124Z" fill="#9cc77a"/>')
    for hx, dach in ((148, WEINROT), (266, WEINROT)):
        a(f'<rect x="{hx - 11}" y="112" width="22" height="18" fill="#fbf6ec"/>')
        a(f'<polygon points="{hx - 14},113 {hx},100 {hx + 14},113" fill="{dach}"/>')
        a(f'<rect x="{hx - 3}" y="120" width="6" height="10" fill="{HOLZ}"/>')
    a('<rect x="203" y="44" width="5" height="92" fill="#fff"/>')
    for y in range(50, 134, 10):
        a(f'<polygon points="203,{y} 208,{y - 4} 208,{y} 203,{y + 4}" fill="{WEINROT}"/>')
    a(f'<polygon points="205.5,30 198,46 213,46" fill="{GRUEN}"/>')
    if "kranz" not in f:
        for i, c in enumerate((WEINROT, GOLD, BLAU, GRUEN)):
            x = 193 + i * 8
            a(f'<path d="M{x} 64 q3 8 -1 16" fill="none" stroke="{c}" stroke-width="2.5"/>')
        a(f'<ellipse cx="205.5" cy="62" rx="15" ry="4.5" fill="none" stroke="{GRUEN}" stroke-width="4"/>')
    a('<rect x="124" y="30" width="162" height="108" fill="none" stroke="#fff" stroke-width="6"/>')
    for x in (178, 232):
        a(f'<line x1="{x}" y1="30" x2="{x}" y2="138" stroke="#fff" stroke-width="4"/>')
    a(f'<rect x="116" y="138" width="178" height="7" fill="{HOLZ}"/>')
    # Schnittlauch auf der Fensterbank
    a(f'<path d="M140 138 L156 138 L154 126 L142 126 Z" fill="{KUPFER}"/>')
    for dx in (-5, -2, 1, 4):
        a(f'<line x1="{148 + dx}" y1="126" x2="{148 + dx * 2}" y2="110" stroke="{GRUEN}" stroke-width="1.8"/>')

    # Kupferpfannen links
    a(f'<rect x="14" y="26" width="80" height="4" rx="2" fill="{HOLZ}"/>')
    a(pfanne(38, 64, 16))
    if "pfanne" not in f:
        a(pfanne(76, 58, 12))

    # Spargeltopf mit Dampf
    if "dampf" not in f:
        for x in (44, 58):
            a(f'<path d="M{x} 110 q-6 -6 0 -11 q6 -5 0 -11" fill="none" stroke="#b9b2a6" '
              f'stroke-width="3" stroke-linecap="round"/>')
    a('<rect x="18" y="124" width="12" height="7" rx="3" fill="#8e979c"/>')
    a('<rect x="72" y="124" width="12" height="7" rx="3" fill="#8e979c"/>')
    a('<rect x="28" y="116" width="46" height="74" rx="3" fill="#c7ccd0" stroke="#8e979c" stroke-width="2"/>')
    a('<rect x="28" y="150" width="46" height="4" fill="#aab2b6"/>')
    a('<ellipse cx="51" cy="116" rx="25" ry="4" fill="#aab2b6"/>')
    a(f'<rect x="46" y="108" width="10" height="6" rx="3" fill="{LINIE}"/>')

    # Regal rechts mit Gläsern, davor Rhabarber
    a(f'<rect x="312" y="70" width="74" height="5" fill="{HOLZ}"/>')
    a('<rect x="318" y="48" width="18" height="22" rx="3" fill="#eaf4f7" stroke="#9fb7bf"/>')
    a(f'<rect x="320" y="56" width="14" height="12" rx="2" fill="{GOLD}"/>')
    a(f'<rect x="317" y="44" width="20" height="5" rx="2" fill="{WEINROT}"/>')
    a('<rect x="344" y="52" width="16" height="18" rx="3" fill="#eaf4f7" stroke="#9fb7bf"/>')
    a('<rect x="346" y="58" width="12" height="10" rx="2" fill="#e8892b"/>')
    a(f'<rect x="343" y="48" width="18" height="5" rx="2" fill="{WEINROT}"/>')
    blaetter = [(360, 124, 352, 186), (378, 110, 368, 188), (390, 132, 382, 188)]
    for lx, ly, sx, sy in blaetter:
        a(f'<line x1="{sx}" y1="{sy}" x2="{lx}" y2="{ly + 8}" stroke="{RHABARBER}" stroke-width="4" stroke-linecap="round"/>')
    for lx, ly, _, _ in blaetter:
        if lx == 378 and "rhabarber" in f:
            continue
        a(f'<path d="M{lx} {ly + 10} q-18 -6 -14 -18 q6 -10 14 -4 q8 -6 14 4 q4 12 -14 18z" fill="{GRUEN}"/>')
        a(f'<line x1="{lx}" y1="{ly + 9}" x2="{lx}" y2="{ly - 6}" stroke="#8fbf6a" stroke-width="1.2"/>')

    # Arbeitsplatte, Unterschrank mit Vorhang, Boden
    a(f'<rect x="0" y="190" width="400" height="10" fill="{HOLZ}"/>')
    a(f'<rect x="0" y="200" width="400" height="92" fill="{HOLZ_HELL}"/>')
    for x in (10, 310):
        a(f'<rect x="{x}" y="206" width="80" height="80" rx="3" fill="none" stroke="{HOLZ}" stroke-width="2"/>')
    a(f'<path d="M100 200 L200 200 Q190 240 196 292 L100 292Z M300 200 L200 200 Q210 240 204 292 L300 292Z" '
      f'fill="{BEIGE}" stroke="#d9c9a6" stroke-width="1.5"/>')
    for x in range(112, 300, 18):
        for y in range(212, 292, 18):
            if abs(x - 200) > 14:
                a(f'<circle cx="{x}" cy="{y}" r="2.5" fill="{WEINROT}"/>')
    if "schleife" not in f:
        a(f'<path d="M200 238 l-12 -7 l0 14 z M200 238 l12 -7 l0 14 z" fill="{GOLD}"/>')
        a(f'<circle cx="200" cy="238" r="3" fill="{HOLZ}"/>')
    a('<rect x="0" y="292" width="400" height="8" fill="#b5654a"/>')

    # Schneidebrett mit Spargelbund und loser Stange
    a(f'<rect x="100" y="182" width="132" height="9" rx="4" fill="{GOLD}" stroke="{HOLZ_DUNKEL}"/>')
    for i, y in enumerate((178, 172, 166, 175, 169)):
        a(stange(108 + (i % 2) * 4, y, 180 + (i % 3) * 2))
    band = GRUEN if "band" in f else WEINROT
    a(f'<rect x="132" y="163" width="8" height="19" fill="{band}"/>')
    a(f'<path d="M136 164 l-8 -6 l0 10 z M136 164 l8 -6 l0 10 z" fill="{band}"/>')
    if "gruen" in f:
        a(stange(188, 186, 224, "#7fae4a", "#5f8f34"))
    else:
        a(stange(188, 186, 224))

    # Sauciere mit Hollandaise
    if "loeffel" in f:
        a('<line x1="262" y1="172" x2="276" y2="148" stroke="#9aa5aa" stroke-width="3.5" stroke-linecap="round"/>')
    a(f'<ellipse cx="258" cy="190" rx="26" ry="4" fill="#fbfbf5" stroke="#cfc6b4"/>')
    a(f'<path d="M236 174 q-10 2 -7 10 q2 4 8 2" fill="none" stroke="#fbfbf5" stroke-width="3.5"/>')
    a(f'<path d="M236 172 L282 168 L276 178 Q270 188 252 188 Q238 188 236 172Z" fill="#fbfbf5" stroke="#cfc6b4"/>')
    a(f'<path d="M238 173 L280 169 L276 174 Z" fill="#f2d23a"/>')

    # Schüssel mit Kartoffeln
    for x, y in ((320, 172), (338, 171), (330, 162)):
        if (x, y) == (330, 162) and "kartoffel" in f:
            continue
        a(f'<ellipse cx="{x}" cy="{y}" rx="9" ry="7" fill="#d9b36a" stroke="#a9834a" stroke-width="1"/>')
    a(f'<path d="M306 174 L354 174 Q350 190 330 190 Q310 190 306 174Z" fill="{BLAU}"/>')
    a('<path d="M309 179 L351 179" stroke="#fff" stroke-width="2"/>')

    # Spargelkorb auf dem Boden
    for i, x in enumerate((40, 51, 62, 73, 84)):
        lila = x == 62 and "lila" in f
        a(f'<line x1="{x}" y1="262" x2="{x}" y2="{240 - (i % 2) * 4}" stroke="{"#9a5aa6" if lila else SPARGEL}" '
          f'stroke-width="7" stroke-linecap="round"/>')
        a(f'<ellipse cx="{x}" cy="{240 - (i % 2) * 4}" rx="4" ry="5" fill="{"#6f3a7f" if lila else SPARGEL_KOPF}"/>')
    a(f'<path d="M28 256 L96 256 L90 292 L34 292 Z" fill="{HOLZ}" stroke="{HOLZ_DUNKEL}" stroke-width="1.5"/>')
    for y in (264, 272, 280):
        a(f'<line x1="31" y1="{y}" x2="93" y2="{y}" stroke="{HOLZ_DUNKEL}" stroke-width="1"/>')
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
