"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 2 (Februar): Karneval in der Backstube.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild. So können A und B nie versehentlich
an weiteren Stellen auseinanderlaufen.

Aufruf:  python3 fehlerbild_nr02.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "02"
THEMA = "karneval"
TITEL = "Karneval in der Backstube"

# Club-Farben (Weinrot, Beige, Gold) plus neutrale Töne
WEINROT = "#7a1f2b"
BEIGE = "#f3ead8"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
SCHRANK = "#e6d6b8"
LINIE = "#3b2a20"
BLAU = "#2f6f8f"
GRUEN = "#4f8a3a"
TEIG = "#c98a46"
ZUCKER = "#fbf6ec"
SCHOKO = "#5a3420"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("uhr", "Die Uhr zeigt eine andere Zeit", (45, 62, 24)),
    ("kappe", "Die Narrenkappe hat nur noch zwei Zipfel", (110, 66, 23)),
    ("ballon", "Vor dem Fenster fehlt der blaue Luftballon", (226, 92, 18)),
    ("feder", "An der Maske fehlt die Feder", (360, 90, 15)),
    ("korbgriff", "Am Frittierkorb fehlt der Griff", (104, 138, 21)),
    ("berliner", "Auf dem Blech fehlt ein Berliner", (172, 185, 16)),
    ("schoko", "Ein Berliner hat Schokoguss statt Puderzucker", (260, 175, 16)),
    ("tuch", "Das Geschirrtuch hat blaue statt rote Streifen", (150, 244, 14)),
    ("ei", "Im Korb fehlt ein Ei", (50, 255, 13)),
    ("aehre", "Auf dem Mehlsack fehlt die Ähre", (353, 268, 17)),
]


def zeiger(cx, cy, laenge, uhr_grad, breite):
    w = math.radians(uhr_grad - 90)
    return (f'<line x1="{cx}" y1="{cy}" x2="{cx + laenge * math.cos(w):.1f}" '
            f'y2="{cy + laenge * math.sin(w):.1f}" stroke="{LINIE}" '
            f'stroke-width="{breite}" stroke-linecap="round"/>')


def schlange(x, y0, laenge, farbe):
    """Geringelte Luftschlange, hängt senkrecht von (x, y0) herab."""
    d = f"M{x} {y0}"
    for i in range(int(laenge // 10)):
        s = 6 if i % 2 == 0 else -6
        d += f" q{s} 5 0 10"
    return (f'<path d="{d}" fill="none" stroke="{farbe}" stroke-width="3" '
            f'stroke-linecap="round"/>')


def berliner(cx, cy, schoko=False):
    t = [f'<ellipse cx="{cx}" cy="{cy}" rx="13" ry="9" fill="{TEIG}" stroke="{HOLZ_DUNKEL}" stroke-width="1"/>']
    if schoko:
        t.append(f'<path d="M{cx - 12} {cy - 1} Q{cx} {cy - 13} {cx + 12} {cy - 1} '
                 f'Q{cx} {cy + 3} {cx - 12} {cy - 1}Z" fill="{SCHOKO}"/>')
    else:
        t.append(f'<path d="M{cx - 11} {cy - 2} Q{cx} {cy - 12} {cx + 11} {cy - 2} '
                 f'Q{cx} {cy + 1} {cx - 11} {cy - 2}Z" fill="{ZUCKER}"/>')
    t.append(f'<line x1="{cx - 13}" y1="{cy + 2}" x2="{cx + 13}" y2="{cy + 2}" '
             f'stroke="#e9d3ae" stroke-width="2"/>')  # heller Rand in der Mitte
    return "".join(t)


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Wand, Arbeitsplatte, Schränke, Boden
    a(f'<rect width="400" height="300" fill="{BEIGE}"/>')
    a(f'<rect x="0" y="198" width="400" height="9" fill="{HOLZ}"/>')
    a(f'<rect x="0" y="207" width="400" height="85" fill="{SCHRANK}"/>')
    for x in (0, 100, 200, 300):
        a(f'<rect x="{x + 5}" y="212" width="90" height="74" rx="3" fill="none" '
          f'stroke="#c9b48e" stroke-width="2"/>')
        a(f'<rect x="{x + 40}" y="216" width="20" height="4" rx="2" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="0" y="290" width="400" height="10" fill="{HOLZ_DUNKEL}"/>')

    # Konfetti an der Wand (feste Lagen, ändert sich nie)
    konfetti = [(140, 140, WEINROT), (128, 112, GOLD), (275, 130, BLAU), (300, 150, GRUEN),
                (20, 110, BLAU), (75, 100, GRUEN), (150, 30, GOLD), (262, 40, WEINROT),
                (385, 20, GOLD), (395, 150, WEINROT), (122, 160, GRUEN), (270, 168, GOLD)]
    for x, y, c in konfetti:
        a(f'<rect x="{x - 3}" y="{y - 2}" width="6" height="4" rx="1" fill="{c}" '
          f'transform="rotate({(x * 7) % 90} {x} {y})"/>')

    # Wimpelkette quer über die Wand
    def kette_y(x):
        return 6 + 8 * math.sin(math.pi * x / 400)
    pkt = " ".join(f"{x},{kette_y(x):.1f}" for x in range(0, 401, 20))
    a(f'<polyline points="{pkt}" fill="none" stroke="{LINIE}" stroke-width="1.5"/>')
    farben = [WEINROT, GOLD, BLAU, GRUEN]
    for k in range(10):
        x = 20 + 40 * k
        y0 = kette_y(x)
        c = farben[k % 4]
        a(f'<polygon points="{x - 12},{y0:.1f} {x + 12},{y0:.1f} {x},{y0 + 20:.1f}" fill="{c}"/>')

    # Uhr
    a(f'<circle cx="45" cy="62" r="20" fill="#fff" stroke="{GOLD}" stroke-width="4"/>')
    for i in range(12):
        w = math.radians(i * 30)
        a(f'<circle cx="{45 + 15 * math.sin(w):.1f}" cy="{62 - 15 * math.cos(w):.1f}" r="1.2" fill="{LINIE}"/>')
    stunde, minute = (255, 180) if "uhr" in f else (60, 0)   # halb neun bzw. 2 Uhr
    a(zeiger(45, 62, 9, stunde, 3))
    a(zeiger(45, 62, 14, minute, 2))
    a(f'<circle cx="45" cy="62" r="2" fill="{WEINROT}"/>')

    # Narrenkappe am Haken
    a(f'<circle cx="110" cy="92" r="2" fill="{HOLZ_DUNKEL}"/>')
    a(f'<polygon points="90,88 103,88 82,58" fill="{WEINROT}"/>')
    a(f'<circle cx="82" cy="58" r="4" fill="{GOLD}"/>')
    if "kappe" not in f:
        a(f'<polygon points="102,88 118,88 110,48" fill="{GRUEN}"/>')
        a(f'<circle cx="110" cy="48" r="4" fill="{GOLD}"/>')
    a(f'<polygon points="117,88 130,88 138,58" fill="{WEINROT}"/>')
    a(f'<circle cx="138" cy="58" r="4" fill="{GOLD}"/>')
    a(f'<rect x="88" y="87" width="44" height="11" rx="3" fill="{GOLD}"/>')
    for x in (95, 110, 125):
        a(f'<circle cx="{x}" cy="92.5" r="2.5" fill="{WEINROT}"/>')

    # Fenster mit Luftballons draußen
    a('<rect x="165" y="42" width="90" height="74" fill="#cfe9f5" stroke="#fff" stroke-width="6"/>')
    a('<path d="M168 100 q20 -10 40 0 t44 -2 v15 h-84 z" fill="#b9d9a8"/>')  # Hügel
    a('<line x1="182" y1="68" x2="186" y2="96" stroke="#777" stroke-width="1"/>')
    a(f'<ellipse cx="182" cy="58" rx="8" ry="10" fill="#d8392b"/>')
    if "ballon" not in f:
        a('<line x1="226" y1="96" x2="223" y2="108" stroke="#777" stroke-width="1"/>')
        a(f'<ellipse cx="226" cy="86" rx="8" ry="10" fill="{BLAU}"/>')
    a('<line x1="210" y1="42" x2="210" y2="116" stroke="#fff" stroke-width="4"/>')
    a('<line x1="165" y1="79" x2="255" y2="79" stroke="#fff" stroke-width="4"/>')
    a(f'<rect x="157" y="116" width="106" height="6" fill="{HOLZ}"/>')
    # Luftschlangen an den Fensterecken
    a(schlange(158, 40, 60, GOLD))
    a(schlange(262, 40, 60, WEINROT))

    # Regal mit Puderzucker, Marmelade, Streuseln
    a(f'<rect x="282" y="70" width="110" height="6" fill="{HOLZ}"/>')
    a(f'<path d="M290 76 l0 10 l10 -10 z M374 76 l0 10 l10 -10 z" fill="{HOLZ_DUNKEL}"/>')
    a('<rect x="290" y="40" width="22" height="30" rx="3" fill="#fff" stroke="#c9c9c9"/>')
    a(f'<rect x="288" y="35" width="26" height="7" rx="2" fill="{GOLD}"/>')
    for dx in (296, 301, 306):
        a(f'<circle cx="{dx}" cy="38" r="1.3" fill="{HOLZ_DUNKEL}"/>')
    a('<rect x="324" y="46" width="22" height="24" rx="3" fill="#eaf4f7" stroke="#9fb7bf"/>')
    a('<rect x="326" y="52" width="18" height="16" rx="2" fill="#b3202f"/>')
    a(f'<rect x="323" y="41" width="24" height="6" rx="2" fill="{WEINROT}"/>')
    a('<rect x="360" y="44" width="20" height="26" rx="3" fill="#eaf4f7" stroke="#9fb7bf"/>')
    for i, c in enumerate([WEINROT, GOLD, BLAU, GRUEN, "#e04a5f", GOLD]):
        a(f'<circle cx="{364 + (i % 3) * 6}" cy="{56 + (i // 3) * 7}" r="2" fill="{c}"/>')
    a(f'<rect x="359" y="40" width="22" height="5" rx="2" fill="{GOLD}"/>')
    # Luftschlangen unter dem Regal
    a(schlange(290, 76, 50, BLAU))
    a(schlange(388, 76, 50, GRUEN))

    # Maske mit Feder
    if "feder" not in f:
        a(f'<ellipse cx="359" cy="90" rx="4" ry="11" fill="{GOLD}" transform="rotate(30 359 90)"/>')
        a(f'<line x1="354" y1="99" x2="364" y2="81" stroke="{HOLZ_DUNKEL}" stroke-width="1"/>')
    a(f'<path d="M314 100 Q337 92 360 100 Q362 118 346 118 Q337 110 328 118 Q312 118 314 100Z" '
      f'fill="{WEINROT}" stroke="{GOLD}" stroke-width="2"/>')
    a(f'<ellipse cx="327" cy="106" rx="6" ry="4" fill="{BEIGE}"/>')
    a(f'<ellipse cx="347" cy="106" rx="6" ry="4" fill="{BEIGE}"/>')

    # Fritteuse mit Berlinern im Fett
    a('<rect x="18" y="148" width="82" height="50" rx="4" fill="#c7ccd0" stroke="#8e979c" stroke-width="2"/>')
    a('<rect x="24" y="148" width="70" height="8" fill="#d9a441"/>')
    a(f'<path d="M34 152 a10 9 0 0 1 20 0 z" fill="{TEIG}"/>')
    a(f'<path d="M60 152 a10 9 0 0 1 20 0 z" fill="{TEIG}"/>')
    a('<circle cx="32" cy="182" r="5" fill="#555"/><rect x="31" y="177" width="2" height="5" fill="#ddd"/>')
    a('<circle cx="50" cy="182" r="3" fill="#e0262f"/>')
    a('<rect x="62" y="172" width="30" height="18" rx="2" fill="#aab2b6"/>')
    if "korbgriff" not in f:
        a('<line x1="90" y1="150" x2="112" y2="130" stroke="#555" stroke-width="3" stroke-linecap="round"/>')
        a(f'<rect x="106" y="124" width="12" height="7" rx="3" fill="{LINIE}" transform="rotate(-42 112 128)"/>')

    # Blech mit Berlinern
    a('<rect x="138" y="192" width="146" height="6" rx="2" fill="#8a8f93"/>')
    for x in (155, 190, 225, 260):
        a(berliner(x, 175, schoko=(x == 260 and "schoko" in f)))
    for x in (172, 207, 242):
        if x == 172 and "berliner" in f:
            continue
        a(berliner(x, 185))

    # Spritzbeutel auf der Arbeitsplatte
    a('<path d="M300 190 L352 182 L352 198 Z" fill="#fff" stroke="#c9c9c9"/>')
    a('<path d="M352 184 L366 189 L366 191 L352 196 Z" fill="#a9a9a9"/>')
    a(f'<circle cx="372" cy="192" r="4" fill="#b3202f"/>')

    # Geschirrtuch am Schrankgriff
    a('<rect x="138" y="218" width="24" height="40" rx="2" fill="#fff" stroke="#d0c7b5"/>')
    streifen = BLAU if "tuch" in f else WEINROT
    for y in (238, 245):
        a(f'<rect x="138" y="{y}" width="24" height="3" fill="{streifen}"/>')

    # Mehlsack vor dem rechten Schrank
    a('<path d="M330 292 Q326 252 336 240 L370 240 Q380 252 376 292Z" fill="#efe6d2" stroke="#c9b48e" stroke-width="2"/>')
    a(f'<path d="M336 240 q17 -10 34 0" fill="none" stroke="{HOLZ_DUNKEL}" stroke-width="2"/>')
    if "aehre" not in f:
        a(f'<line x1="353" y1="282" x2="353" y2="256" stroke="{GOLD}" stroke-width="2"/>')
        for dy in (258, 265, 272):
            a(f'<ellipse cx="349" cy="{dy}" rx="2.5" ry="4" fill="{GOLD}" transform="rotate(-30 349 {dy})"/>')
            a(f'<ellipse cx="357" cy="{dy}" rx="2.5" ry="4" fill="{GOLD}" transform="rotate(30 357 {dy})"/>')

    # Eierkorb vor dem linken Schrank
    for x, y in ((34, 262), (50, 255), (66, 259), (79, 264)):
        if x == 50 and "ei" in f:
            continue
        a(f'<ellipse cx="{x}" cy="{y}" rx="7" ry="9" fill="#fbf6ec" stroke="#d0c7b5"/>')
    a(f'<path d="M20 264 L90 264 L84 292 L26 292 Z" fill="{HOLZ}" stroke="{HOLZ_DUNKEL}" stroke-width="1.5"/>')
    for y in (271, 278, 285):
        a(f'<line x1="23" y1="{y}" x2="87" y2="{y}" stroke="{HOLZ_DUNKEL}" stroke-width="1"/>')
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
