"""Fehlerbild „Finde die 10 Fehler“ – Küchenszene als SVG.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild. So können A und B nie versehentlich
an weiteren Stellen auseinanderlaufen.

Aufruf:  python3 fehlerbild.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent

# Club-Farben (Weinrot, Beige, Gold) plus neutrale Küchentöne
WEINROT = "#7a1f2b"
BEIGE = "#f3ead8"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
SCHRANK = "#e6d6b8"
LINIE = "#3b2a20"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("uhr", "Die Uhr zeigt eine andere Zeit", (55, 42, 26)),
    ("vorhang", "Der linke Vorhang hat eine andere Farbe", (160, 66, 22)),
    ("glas", "Auf dem Regal fehlt ein Vorratsglas", (356, 42, 20)),
    ("deckelknauf", "Der Griff auf dem Topfdeckel fehlt", (200, 151, 14)),
    ("dampf", "Eine Dampfwolke fehlt", (218, 128, 16)),
    ("utensil", "Statt der Kelle hängt ein Schneebesen", (335, 128, 22)),
    ("moehrengruen", "Die Möhre hat kein Grün mehr", (352, 182, 16)),
    ("herdknopf", "Am Herd fehlt ein Drehknopf", (240, 222, 14)),
    ("bluete", "Die Blume auf der Fensterbank blüht in anderer Farbe", (233, 88, 14)),
    ("magnet", "Am Kühlschrank: Stern statt Herz", (55, 132, 16)),
]


def zeiger(cx, cy, laenge, uhr_grad, breite):
    w = math.radians(uhr_grad - 90)
    return (f'<line x1="{cx}" y1="{cy}" x2="{cx + laenge * math.cos(w):.1f}" '
            f'y2="{cy + laenge * math.sin(w):.1f}" stroke="{LINIE}" '
            f'stroke-width="{breite}" stroke-linecap="round"/>')


def herz(cx, cy, s, farbe):
    return (f'<path d="M{cx} {cy + s} C{cx - 2 * s} {cy - s / 2} {cx - s} {cy - 1.6 * s} '
            f'{cx} {cy - 0.6 * s} C{cx + s} {cy - 1.6 * s} {cx + 2 * s} {cy - s / 2} '
            f'{cx} {cy + s}Z" fill="{farbe}"/>')


def stern(cx, cy, r, farbe):
    pkte = []
    for i in range(10):
        rr = r if i % 2 == 0 else r * 0.45
        w = math.radians(-90 + i * 36)
        pkte.append(f"{cx + rr * math.cos(w):.1f},{cy + rr * math.sin(w):.1f}")
    return f'<polygon points="{" ".join(pkte)}" fill="{farbe}"/>'


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Wand, Fliesenspiegel, Arbeitsplatte, Schränke
    a(f'<rect width="400" height="300" fill="{BEIGE}"/>')
    a('<rect x="100" y="150" width="300" height="50" fill="#fbf8f1"/>')
    for x in range(100, 401, 25):
        a(f'<line x1="{x}" y1="150" x2="{x}" y2="200" stroke="#d9cdb6" stroke-width="1"/>')
    a('<line x1="100" y1="175" x2="400" y2="175" stroke="#d9cdb6" stroke-width="1"/>')
    a(f'<rect x="100" y="198" width="300" height="9" fill="{HOLZ}"/>')
    a(f'<rect x="100" y="207" width="300" height="93" fill="{SCHRANK}"/>')
    for x in (100, 270, 335):
        a(f'<rect x="{x + 4}" y="212" width="{(170 if x == 100 else 61) - 8}" height="82" '
          f'rx="3" fill="none" stroke="#c9b48e" stroke-width="2"/>')
    a(f'<rect x="0" y="290" width="400" height="10" fill="{HOLZ_DUNKEL}"/>')

    # Uhr über dem Kühlschrank
    a(f'<circle cx="55" cy="42" r="22" fill="#fff" stroke="{GOLD}" stroke-width="4"/>')
    for i in range(12):
        w = math.radians(i * 30)
        a(f'<circle cx="{55 + 17 * math.sin(w):.1f}" cy="{42 - 17 * math.cos(w):.1f}" r="1.2" fill="{LINIE}"/>')
    stunde = 150 if "uhr" in f else 90       # 3 Uhr bzw. 5 Uhr
    a(zeiger(55, 42, 10, stunde, 3))
    a(zeiger(55, 42, 15, 0, 2))
    a(f'<circle cx="55" cy="42" r="2" fill="{WEINROT}"/>')

    # Kühlschrank
    a('<rect x="10" y="78" width="90" height="214" rx="8" fill="#e9eef0" stroke="#b9c3c7" stroke-width="2"/>')
    a('<line x1="10" y1="160" x2="100" y2="160" stroke="#b9c3c7" stroke-width="2"/>')
    a('<rect x="86" y="95" width="5" height="45" rx="2" fill="#9aa5aa"/>')
    a('<rect x="86" y="175" width="5" height="60" rx="2" fill="#9aa5aa"/>')
    a('<rect x="28" y="190" width="34" height="44" fill="#fff" stroke="#c9c9c9"/>')  # Zettel
    for y in (200, 208, 216, 224):
        a(f'<line x1="33" y1="{y}" x2="57" y2="{y}" stroke="#9db4c0" stroke-width="2"/>')
    a(f'<circle cx="45" cy="190" r="3" fill="{GOLD}"/>')
    a(stern(55, 132, 9, GOLD) if "magnet" in f else herz(55, 132, 7, WEINROT))

    # Fenster mit Vorhängen und Fensterbank
    a('<rect x="150" y="25" width="100" height="80" fill="#cfe9f5" stroke="#fff" stroke-width="6"/>')
    a('<line x1="200" y1="25" x2="200" y2="105" stroke="#fff" stroke-width="4"/>')
    a('<line x1="150" y1="65" x2="250" y2="65" stroke="#fff" stroke-width="4"/>')
    a('<circle cx="228" cy="45" r="8" fill="#fff6c9"/>')  # Sonne
    a(f'<rect x="140" y="18" width="120" height="5" rx="2" fill="{HOLZ_DUNKEL}"/>')
    links = "#2f6f8f" if "vorhang" in f else WEINROT
    a(f'<path d="M142 22 L180 22 Q165 60 172 108 L142 108 Z" fill="{links}"/>')
    a(f'<path d="M258 22 L220 22 Q235 60 228 108 L258 108 Z" fill="{WEINROT}"/>')
    a(f'<rect x="138" y="105" width="124" height="7" fill="{HOLZ}"/>')
    # Blume (steht vor dem rechten Vorhang)
    a(f'<rect x="226" y="96" width="14" height="10" fill="{HOLZ_DUNKEL}"/>')
    a('<line x1="233" y1="96" x2="233" y2="84" stroke="#4f8a3a" stroke-width="2"/>')
    a('<ellipse cx="228" cy="92" rx="4" ry="2" fill="#4f8a3a"/>')
    bluete = "#f2c230" if "bluete" in f else "#e04a5f"
    for i in range(5):
        w = math.radians(i * 72)
        a(f'<circle cx="{233 + 4 * math.cos(w):.1f}" cy="{82 + 4 * math.sin(w):.1f}" r="3" fill="{bluete}"/>')
    a('<circle cx="233" cy="82" r="2" fill="#fff4c2"/>')

    # Herd mit Topf
    a('<rect x="130" y="200" width="140" height="92" fill="#d7d7d7" stroke="#a9a9a9" stroke-width="2"/>')
    a('<rect x="148" y="236" width="104" height="46" rx="4" fill="#3d3d3d"/>')
    a('<rect x="152" y="240" width="96" height="10" rx="2" fill="#5a5a5a"/>')
    for x in (160, 185, 215, 240):
        if x == 240 and "herdknopf" in f:
            continue
        a(f'<circle cx="{x}" cy="222" r="6" fill="#555"/><rect x="{x - 1}" y="216" width="2" height="6" fill="#ddd"/>')
    a(f'<rect x="165" y="160" width="70" height="38" rx="4" fill="{WEINROT}"/>')
    a('<rect x="157" y="168" width="10" height="5" rx="2" fill="#333"/>')
    a('<rect x="233" y="168" width="10" height="5" rx="2" fill="#333"/>')
    a('<ellipse cx="200" cy="160" rx="38" ry="6" fill="#8b8b8b"/>')
    if "deckelknauf" not in f:
        a('<rect x="194" y="149" width="12" height="7" rx="3" fill="#333"/>')
    dampf = [182, 200] if "dampf" in f else [182, 200, 218]
    for x in dampf:
        a(f'<path d="M{x} 145 q-6 -8 0 -14 q6 -6 0 -14" fill="none" stroke="#b9b2a6" '
          f'stroke-width="3" stroke-linecap="round"/>')

    # Regal mit Vorratsgläsern
    a(f'<rect x="282" y="60" width="110" height="6" fill="{HOLZ}"/>')
    a(f'<path d="M290 66 l0 10 l10 -10 z M374 66 l0 10 l10 -10 z" fill="{HOLZ_DUNKEL}"/>')
    glaeser = [(296, "#e8c27a"), (326, "#b7553f")] + ([] if "glas" in f else [(356, "#7c9a4b")])
    for x, inhalt in glaeser:
        a(f'<rect x="{x - 11}" y="34" width="22" height="26" rx="3" fill="#eaf4f7" stroke="#9fb7bf"/>')
        a(f'<rect x="{x - 9}" y="42" width="18" height="16" rx="2" fill="{inhalt}"/>')
        a(f'<rect x="{x - 12}" y="29" width="24" height="6" rx="2" fill="{GOLD}"/>')

    # Hakenleiste mit Küchenhelfern
    a(f'<rect x="285" y="92" width="105" height="5" rx="2" fill="{HOLZ_DUNKEL}"/>')
    for x in (300, 335, 370):
        a(f'<path d="M{x} 97 v5" stroke="#555" stroke-width="2"/>')
    # Pfannenwender
    a(f'<line x1="300" y1="102" x2="300" y2="138" stroke="{HOLZ_DUNKEL}" stroke-width="4" stroke-linecap="round"/>')
    a('<rect x="293" y="136" width="14" height="18" rx="2" fill="#555"/>')
    # Mitte: Kelle oder Schneebesen
    if "utensil" in f:
        a('<line x1="335" y1="102" x2="335" y2="126" stroke="#777" stroke-width="4" stroke-linecap="round"/>')
        for rx in (3, 6, 9):
            a(f'<ellipse cx="335" cy="140" rx="{rx}" ry="15" fill="none" stroke="#888" stroke-width="1.5"/>')
    else:
        a('<line x1="335" y1="102" x2="335" y2="142" stroke="#777" stroke-width="4" stroke-linecap="round"/>')
        a('<path d="M325 142 a10 10 0 0 0 20 0 z" fill="#888"/>')
    # Holzlöffel
    a(f'<line x1="370" y1="102" x2="370" y2="140" stroke="{HOLZ}" stroke-width="4" stroke-linecap="round"/>')
    a(f'<ellipse cx="370" cy="146" rx="6" ry="9" fill="{HOLZ}"/>')

    # Schneidebrett mit Möhre und Tomate
    a(f'<rect x="282" y="186" width="104" height="13" rx="5" fill="{GOLD}" stroke="{HOLZ_DUNKEL}"/>')
    a('<path d="M300 191 L345 187 L345 196 Z" fill="#ec8a2b"/>')
    if "moehrengruen" not in f:
        a('<path d="M345 191 l10 -9 M345 191 l12 -3 M345 191 l9 -12" stroke="#4f8a3a" '
          'stroke-width="2.5" stroke-linecap="round"/>')
    a('<circle cx="372" cy="186" r="8" fill="#d8392b"/><path d="M369 179 l3 2 l3 -2" '
      'stroke="#4f8a3a" stroke-width="2" fill="none"/>')
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
    (HIER / "fehlerbild-a.svg").write_text(svg(a, "Küchenszene – Bild A"), encoding="utf-8")
    (HIER / "fehlerbild-b.svg").write_text(svg(b, "Küchenszene – Bild B"), encoding="utf-8")
    (HIER / "fehlerbild-loesung.svg").write_text(
        svg(b + kreise, "Küchenszene – Lösung mit 10 markierten Fehlern"), encoding="utf-8")
    (HIER / "fehlerbild.json").write_text(json.dumps(
        [{"nr": i + 1, "id": k, "text": t, "x": x, "y": y, "r": r}
         for i, (k, t, (x, y, r)) in enumerate(FEHLER)], ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8")
    # Selbstprüfung: jeder Fehler allein muss das Bild verändern
    for k, _, _ in FEHLER:
        assert szene(frozenset([k])) != a, f"Fehler {k} ändert nichts"
    assert len(FEHLER) == 10
    print("Fehlerbild: 10 Fehler, alle wirksam")


if __name__ == "__main__":
    main()
