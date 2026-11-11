"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 9 (September): Erntedank im Hofladen.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild. So können A und B nie versehentlich
an weiteren Stellen auseinanderlaufen.

Aufruf:  python3 fehlerbild_nr09.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "09"
THEMA = "hofladen"
NAME = "Erntedank im Hofladen"

# Club-Farben (Weinrot, Beige, Gold) plus Holz- und Herbsttöne
WEINROT = "#7a1f2b"
BEIGE = "#f3ead8"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
ZWETSCHGE = "#4b2a5e"
KUERBIS = "#e07b26"
APFEL = "#c8322b"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("sonne", "Im Fenster fehlt die Sonne", (68, 40, 13)),
    ("honig", "Im Regal fehlt ein Honigglas", (80, 97, 17)),
    ("band", "Ein Band der Erntekrone ist grün", (231, 83, 22)),
    ("tafel", "Auf der Tafel: Birne statt Apfel", (337, 60, 22)),
    ("kuchen", "Vom Zwetschgenkuchen fehlt ein Stück", (199, 158, 17)),
    ("waage", "Die Waage zeigt ein anderes Gewicht", (255, 152, 15)),
    ("sonnenblume", "Einer Sonnenblume fehlt die Blüte", (309, 130, 15)),
    ("apfel", "In der Kiste liegt ein grüner Apfel", (60, 224, 12)),
    ("sack", "Das Band am Kartoffelsack ist blau", (215, 224, 15)),
    ("kuerbis", "Ein Kürbis ist grün statt orange", (345, 267, 24)),
]


def kuerbis(cx, cy, r, farbe):
    return (f'<ellipse cx="{cx - 0.45 * r:.1f}" cy="{cy}" rx="{0.7 * r:.1f}" ry="{0.85 * r:.1f}" fill="{farbe}" stroke="#a8541a"/>'
            f'<ellipse cx="{cx + 0.45 * r:.1f}" cy="{cy}" rx="{0.7 * r:.1f}" ry="{0.85 * r:.1f}" fill="{farbe}" stroke="#a8541a"/>'
            f'<ellipse cx="{cx}" cy="{cy}" rx="{0.55 * r:.1f}" ry="{0.88 * r:.1f}" fill="{farbe}" stroke="#a8541a"/>'
            f'<path d="M{cx - 2} {cy - 0.85 * r:.1f} l1 -{0.4 * r:.1f} l5 -2 l-2 {0.45 * r + 2:.1f} z" fill="#5d7a2e"/>')


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Bretterwand und Boden
    for i, x in enumerate(range(0, 400, 40)):
        a(f'<rect x="{x}" y="0" width="40" height="252" fill="{"#d2a77a" if i % 2 else "#c89a6a"}"/>')
        a(f'<line x1="{x}" y1="0" x2="{x}" y2="252" stroke="#a87a50" stroke-width="2"/>')
    a('<rect x="0" y="252" width="400" height="48" fill="#8a5f3d"/>')

    # Fenster mit Sonne
    a('<rect x="18" y="22" width="70" height="50" fill="#cfe9f5" stroke="#f3ead8" stroke-width="5"/>')
    if "sonne" not in f:
        a('<circle cx="68" cy="40" r="9" fill="#f6d55c"/>')
    a('<path d="M24 66 q14 -14 28 0 q10 -8 30 0 v3 h-58 z" fill="#a9c97a"/>')
    a('<path d="M53 22 v50 M18 47 h70" stroke="#f3ead8" stroke-width="3"/>')

    # Regal mit Honiggläsern
    a(f'<rect x="15" y="110" width="104" height="6" fill="{HOLZ_DUNKEL}"/>')
    a(f'<path d="M22 116 l0 9 l9 -9 z M104 116 l0 9 l9 -9 z" fill="{LINIE}"/>')
    for x in (30, 55, 80, 105):
        if x == 80 and "honig" in f:
            continue
        a(f'<rect x="{x - 9}" y="90" width="18" height="20" rx="3" fill="#e8a530" stroke="#b97c1d"/>')
        a(f'<rect x="{x - 10}" y="85" width="20" height="6" rx="2" fill="{GOLD}"/>')
        a(f'<rect x="{x - 5}" y="96" width="10" height="8" fill="{BEIGE}"/>')

    # Erntekrone mit Bändern
    a(f'<path d="M200 0 V20 M200 0 L166 58 M200 0 L234 58" stroke="{LINIE}" stroke-width="1.5"/>')
    for x, farbe in ((168, WEINROT), (188, GOLD), (212, WEINROT), (232, GOLD)):
        if x == 232 and "band" in f:
            farbe = "#3f9a4a"
        a(f'<path d="M{x - 3} 64 l-2 10 l4 8 l-3 10 l5 8 l5 0 l3 -8 l-4 -10 l3 -8 l-2 -10 z" fill="{farbe}"/>')
    a(f'<path d="M162 62 Q200 -4 238 62" fill="none" stroke="{GOLD}" stroke-width="7"/>')
    a(f'<path d="M184 64 Q200 12 216 64" fill="none" stroke="#e0bf62" stroke-width="7"/>')
    a(f'<path d="M162 62 Q200 -4 238 62" fill="none" stroke="{HOLZ}" stroke-width="2" stroke-dasharray="3 4"/>')
    a(f'<ellipse cx="200" cy="62" rx="40" ry="8" fill="none" stroke="#d9b45a" stroke-width="6"/>')
    for dx in (-6, 0, 6):
        a(f'<ellipse cx="{200 + dx}" cy="24" rx="3" ry="8" fill="#e0bf62" transform="rotate({dx * 4} {200 + dx} 30)"/>')

    # Tafel mit gemaltem Apfel (oder Birne)
    a(f'<rect x="288" y="23" width="99" height="74" rx="3" fill="{HOLZ_DUNKEL}"/>')
    a('<rect x="294" y="29" width="87" height="62" fill="#2f3b33"/>')
    if "tafel" in f:
        a('<path d="M337 44 C330 44 331 56 326 64 C320 74 328 80 337 80 C346 80 354 74 348 64 '
          'C343 56 344 44 337 44 Z" fill="none" stroke="#f3f3f3" stroke-width="3"/>')
    else:
        a('<path d="M337 50 C322 42 318 62 324 70 C328 78 334 80 337 77 C340 80 346 78 350 70 '
          'C356 62 352 42 337 50 Z" fill="none" stroke="#f3f3f3" stroke-width="3"/>')
    a('<path d="M337 47 l2 -8 M339 42 q6 -5 10 0 q-6 4 -10 0" fill="none" stroke="#9fd38a" stroke-width="2.5"/>')

    # Tisch
    a(f'<rect x="120" y="188" width="8" height="66" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="302" y="188" width="8" height="66" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="110" y="180" width="210" height="9" fill="{HOLZ}"/>')

    # Zwetschgenkuchen auf dem Blech
    a('<rect x="125" y="149" width="92" height="31" rx="2" fill="#6d6d6d"/>')
    for r, y in enumerate((151, 165)):
        for s, x in enumerate((128, 157, 186)):
            if (r, s) == (0, 2) and "kuchen" in f:
                continue
            a(f'<rect x="{x}" y="{y}" width="27" height="13" fill="#e2b56a"/>')
            for px in (x + 5, x + 13, x + 21):
                a(f'<ellipse cx="{px}" cy="{y + 6.5}" rx="3.5" ry="4.5" fill="{ZWETSCHGE}"/>')

    # Waage mit Zwetschgen in der Schale
    a(f'<path d="M240 180 L270 180 L266 166 L244 166 Z" fill="{WEINROT}"/>')
    a('<circle cx="255" cy="152" r="13" fill="#fff" stroke="#3b2a20" stroke-width="2"/>')
    for i in range(8):
        w = math.radians(i * 45)
        a(f'<line x1="{255 + 9 * math.sin(w):.1f}" y1="{152 - 9 * math.cos(w):.1f}" '
          f'x2="{255 + 11 * math.sin(w):.1f}" y2="{152 - 11 * math.cos(w):.1f}" stroke="{LINIE}" stroke-width="1.5"/>')
    w = math.radians(120 if "waage" in f else -45)
    a(f'<line x1="255" y1="152" x2="{255 + 10 * math.sin(w):.1f}" y2="{152 - 10 * math.cos(w):.1f}" '
      f'stroke="{APFEL}" stroke-width="2.5" stroke-linecap="round"/>')
    a(f'<rect x="253" y="134" width="4" height="6" fill="{LINIE}"/>')
    a('<path d="M236 134 L274 134 Q270 140 255 140 Q240 140 236 134 Z" fill="#b8c1c5"/>')
    for x in (246, 255, 264):
        a(f'<ellipse cx="{x}" cy="130" rx="4" ry="5" fill="{ZWETSCHGE}"/>')

    # Vase mit Sonnenblumen
    for x, y in ((285, 128), (297, 116), (309, 130)):
        a(f'<line x1="295" y1="165" x2="{x}" y2="{y}" stroke="#4f7a35" stroke-width="2.5"/>')
        if x == 309 and "sonnenblume" in f:
            continue
        for i in range(10):
            ww = math.radians(i * 36)
            a(f'<ellipse cx="{x + 7 * math.cos(ww):.1f}" cy="{y + 7 * math.sin(ww):.1f}" rx="3.5" ry="2" '
              f'fill="#f2c230" transform="rotate({i * 36} {x + 7 * math.cos(ww):.1f} {y + 7 * math.sin(ww):.1f})"/>')
        a(f'<circle cx="{x}" cy="{y}" r="5" fill="{HOLZ_DUNKEL}"/>')
    a(f'<path d="M285 158 L305 158 L302 180 L288 180 Z" fill="#3f6f8f"/>')

    # Apfelkiste
    for i, (x, y) in enumerate([(30 + 15 * k, 224) for k in range(5)] + [(22 + 15 * k, 236) for k in range(6)]):
        farbe = "#8cbf3a" if (x, y) == (60, 224) and "apfel" in f else APFEL
        a(f'<circle cx="{x}" cy="{y}" r="8" fill="{farbe}"/>')
        a(f'<line x1="{x}" y1="{y - 8}" x2="{x + 1}" y2="{y - 11}" stroke="{LINIE}" stroke-width="1.5"/>')
    a(f'<rect x="10" y="240" width="96" height="50" fill="{HOLZ}" stroke="{HOLZ_DUNKEL}" stroke-width="2"/>')
    for y in (256, 272):
        a(f'<line x1="10" y1="{y}" x2="106" y2="{y}" stroke="{HOLZ_DUNKEL}" stroke-width="2"/>')
    a(f'<rect x="48" y="262" width="20" height="6" rx="3" fill="{HOLZ_DUNKEL}"/>')

    # Kartoffelsack unter dem Tisch
    a('<path d="M193 290 C186 262 196 236 207 228 L223 228 C234 236 244 262 237 290 Z" fill="#c9a77a" stroke="#a7875c"/>')
    a('<path d="M205 228 L200 214 L215 220 L230 214 L225 228 Z" fill="#c9a77a" stroke="#a7875c"/>')
    a(f'<rect x="202" y="221" width="26" height="6" rx="3" fill="{"#3f7fb0" if "sack" in f else HOLZ_DUNKEL}"/>')
    for x, y in ((178, 286), (250, 287), (262, 282)):
        a(f'<ellipse cx="{x}" cy="{y}" rx="8" ry="5" fill="#b88a4a"/>')

    # Kürbisse
    a(kuerbis(300, 280, 12, KUERBIS))
    a(kuerbis(345, 268, 18, "#7a9a3a" if "kuerbis" in f else KUERBIS))
    a(kuerbis(385, 278, 13, "#f2c230"))
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
