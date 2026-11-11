"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 12 (Dezember 2027): Weihnachtsbäckerei.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr12.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "12"
THEMA = "weihnachtsbaeckerei"
TITEL = "Weihnachtsbäckerei"

WEINROT = "#7a1f2b"
BEIGE = "#f3ead8"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
TANNE = "#3f6e3a"
STAHL = "#9aa5aa"
LEBKUCHEN = "#a0612e"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("stern", "Der Stern an der Decke hat weniger Zacken", (205, 50, 22)),
    ("schneemann", "Vor dem Fenster fehlt der Schneemann", (122, 100, 22)),
    ("ausstecher", "Am Haken hängt ein Mond statt Herz", (305, 42, 16)),
    ("schornstein", "Am Lebkuchenhaus fehlt der Schornstein", (274, 75, 13)),
    ("kerze", "Am Adventskranz brennt eine Kerze mehr", (90, 150, 13)),
    ("plaetzchen", "Auf dem Blech fehlt ein Plätzchen", (232, 182, 13)),
    ("nudelholz", "Am Nudelholz fehlt ein Griff", (319, 186, 12)),
    ("schneebesen", "In der Schüssel steckt ein Löffel statt Schneebesen", (370, 146, 22)),
    ("katze", "Der Katze fehlt der Schwanz", (138, 269, 15)),
    ("mehlsack", "Der Mehlsack hat keinen roten Streifen", (300, 254, 26)),
]


def stern(cx, cy, r, zacken, farbe):
    pkte = []
    for i in range(2 * zacken):
        rr = r if i % 2 == 0 else r * 0.48
        w = math.radians(-90 + i * 180 / zacken)
        pkte.append(f"{cx + rr * math.cos(w):.1f},{cy + rr * math.sin(w):.1f}")
    return f'<polygon points="{" ".join(pkte)}" fill="{farbe}"/>'


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Wand, Deckenbalken mit Tannengirlande, Boden
    a(f'<rect width="400" height="300" fill="{BEIGE}"/>')
    a('<rect x="0" y="280" width="400" height="20" fill="#b98a5e"/>')
    a(f'<rect x="0" y="0" width="400" height="8" fill="{HOLZ_DUNKEL}"/>')
    for x in range(10, 400, 24):
        a(f'<ellipse cx="{x}" cy="10" rx="14" ry="5" fill="{TANNE}"/>')
    for x in (46, 166, 286):
        a(f'<circle cx="{x}" cy="15" r="3.5" fill="{WEINROT}"/>')

    # Hängender Stern
    a(f'<line x1="205" y1="12" x2="205" y2="32" stroke="{LINIE}" stroke-width="1.5"/>')
    a(stern(205, 50, 19, 5 if "stern" in f else 8, GOLD))
    a('<circle cx="205" cy="50" r="4" fill="#fff3b0"/>')

    # Fenster: Abendhimmel, Schnee, Tanne, Schneemann
    a('<rect x="30" y="30" width="120" height="100" fill="#3a4f7a"/>')
    a('<ellipse cx="90" cy="132" rx="72" ry="16" fill="#f4f7fb"/>')
    a(f'<path d="M58 118 L72 82 L86 118 Z" fill="{TANNE}"/><path d="M62 100 L72 74 L82 100 Z" fill="{TANNE}"/>')
    a('<path d="M66 90 L72 74 L78 90 Z" fill="#f4f7fb"/>')
    if "schneemann" not in f:
        a('<circle cx="122" cy="114" r="10" fill="#f4f7fb"/><circle cx="122" cy="99" r="7" fill="#f4f7fb"/>')
        a(f'<rect x="116" y="89" width="12" height="3" fill="{LINIE}"/><rect x="118" y="83" width="8" height="7" fill="{LINIE}"/>')
        a('<path d="M122 100 l6 1.5 l-6 1.5 z" fill="#ec8a2b"/>')
    for sx, sy in ((42, 44), (58, 62), (100, 40), (138, 52), (46, 92), (110, 70), (138, 80), (84, 56)):
        a(f'<circle cx="{sx}" cy="{sy}" r="2" fill="#fff"/>')
    a('<rect x="30" y="30" width="120" height="100" fill="none" stroke="#fbf8f1" stroke-width="6"/>')
    a('<line x1="90" y1="30" x2="90" y2="80" stroke="#fbf8f1" stroke-width="3"/>')
    a(f'<rect x="22" y="130" width="136" height="8" fill="{HOLZ}"/>')
    a('<rect x="24" y="126" width="132" height="5" rx="2.5" fill="#fff"/>')

    # Leiste mit Ausstechern
    a(f'<rect x="240" y="16" width="146" height="4" rx="2" fill="{HOLZ_DUNKEL}"/>')
    for x in (265, 305, 345):
        a(f'<path d="M{x} 20 v6" stroke="#555" stroke-width="2"/>')
    a(f'<g fill="none" stroke="{STAHL}" stroke-width="3">')
    a(stern(265, 42, 13, 5, "none").replace("/>", ' stroke="#9aa5aa" stroke-width="3"/>'))
    if "ausstecher" in f:
        a('<path d="M309 30 a12 12 0 1 0 0 24 a9 9 0 1 1 0 -24 z"/>')
    else:
        s = 8
        cx, cy = 305, 40
        a(f'<path d="M{cx} {cy + s} C{cx - 2 * s} {cy - s / 2} {cx - s} {cy - 1.6 * s} '
          f'{cx} {cy - 0.6 * s} C{cx + s} {cy - 1.6 * s} {cx + 2 * s} {cy - s / 2} {cx} {cy + s}Z"/>')
    a('<path d="M345 29 L357 52 L333 52 Z M345 52 v4"/>')
    a('</g>')

    # Regal mit Lebkuchenhaus und Streuselglas
    a(f'<rect x="240" y="120" width="148" height="6" fill="{HOLZ}"/>')
    a(f'<path d="M250 126 l0 10 l10 -10 z M322 126 l0 10 l10 -10 z" fill="{HOLZ_DUNKEL}"/>')
    if "schornstein" not in f:
        a(f'<rect x="269" y="66" width="10" height="20" fill="{LEBKUCHEN}"/><rect x="267" y="64" width="14" height="4" fill="#fff"/>')
    a(f'<rect x="265" y="96" width="50" height="24" fill="{LEBKUCHEN}"/>')
    a('<path d="M258 98 L290 70 L322 98 Z" fill="#8a5126" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>')
    for x, y, farbe in ((282, 88, "#d2453a"), (298, 88, "#4f8a3a"), (290, 80, GOLD)):
        a(f'<circle cx="{x}" cy="{y}" r="2.5" fill="{farbe}"/>')
    a(f'<rect x="284" y="106" width="12" height="14" rx="5" fill="{WEINROT}"/>')
    a('<rect x="270" y="101" width="9" height="8" fill="#f6d36b"/><rect x="301" y="101" width="9" height="8" fill="#f6d36b"/>')
    a('<rect x="342" y="94" width="26" height="26" rx="3" fill="#eaf4f7" stroke="#9fb7bf"/>')
    for i, (dx, dy) in enumerate(((5, 14), (11, 18), (17, 13), (8, 21), (20, 20), (14, 9))):
        a(f'<circle cx="{342 + dx}" cy="{94 + dy}" r="1.8" fill="{("#d2453a", "#4f8a3a", GOLD)[i % 3]}"/>')
    a(f'<rect x="341" y="89" width="28" height="6" rx="2" fill="{GOLD}"/>')

    # Tisch mit Beinen
    a(f'<rect x="10" y="192" width="380" height="10" fill="#c49a6c"/>')
    a(f'<rect x="14" y="202" width="372" height="16" fill="{HOLZ}"/>')
    for x in (22, 364):
        a(f'<rect x="{x}" y="218" width="14" height="64" fill="{HOLZ_DUNKEL}"/>')

    # Katzenkorb unter dem Tisch
    a(f'<path d="M74 266 L138 266 L132 284 L80 284 Z" fill="{HOLZ}"/>')
    katze, katze_d = "#e0903a", "#b86a22"
    a(f'<ellipse cx="110" cy="262" rx="24" ry="11" fill="{katze}"/>')
    a(f'<circle cx="89" cy="255" r="9" fill="{katze}"/>')
    a(f'<path d="M82 250 l1 -9 l6 6 z M92 247 l4 -8 l3 9 z" fill="{katze}"/>')
    a(f'<path d="M100 255 q8 -4 16 0 M108 268 q8 -4 16 0" fill="none" stroke="{katze_d}" stroke-width="2"/>')
    if "katze" not in f:
        a(f'<path d="M128 262 q20 -2 11 17" fill="none" stroke="{katze}" stroke-width="6" stroke-linecap="round"/>')
    a(f'<rect x="72" y="264" width="68" height="5" rx="2" fill="{HOLZ_DUNKEL}"/>')

    # Mehlsack
    a('<path d="M282 230 Q276 256 280 282 L320 282 Q324 256 318 230 Q300 224 282 230 Z" fill="#eadfc8" stroke="#bfae8a" stroke-width="2"/>')
    a(f'<path d="M292 230 l8 -8 l8 8" fill="none" stroke="{HOLZ}" stroke-width="2.5"/>')
    if "mehlsack" not in f:
        a(f'<rect x="279" y="250" width="42" height="8" fill="{WEINROT}"/>')

    # Adventskranz mit vier Kerzen (zwei brennen)
    for i, x in enumerate((50, 70, 90, 110)):
        h = 22 if i in (1, 2) else 28
        a(f'<rect x="{x - 4.5}" y="{184 - h}" width="9" height="{h}" fill="{WEINROT}"/>')
        if i < 2 or (i == 2 and "kerze" in f):
            a(f'<ellipse cx="{x}" cy="{184 - h - 7}" rx="4" ry="7" fill="#f2a93b"/>'
              f'<ellipse cx="{x}" cy="{184 - h - 5}" rx="1.8" ry="3.5" fill="#fff3b0"/>')
    a(f'<ellipse cx="80" cy="186" rx="46" ry="9" fill="{TANNE}"/>')
    for x, y in ((44, 186), (62, 190), (98, 191), (116, 186), (80, 192)):
        a(f'<circle cx="{x}" cy="{y}" r="3" fill="#c8362b"/>')
    a(f'<path d="M80 184 l-8 -5 l0 10 z M80 184 l8 -5 l0 10 z" fill="{GOLD}"/>')

    # Backblech mit Plätzchen
    a('<rect x="148" y="162" width="104" height="30" rx="2" fill="#4a4a4a"/>')
    a('<rect x="152" y="165" width="96" height="24" fill="#5a5a5a"/>')
    keks = [(168, 171, "s"), (200, 171, "r"), (232, 171, "s"), (168, 182, "r"), (200, 182, "s"), (232, 182, "r")]
    for x, y, art in keks:
        if (x, y) == (232, 182) and "plaetzchen" in f:
            continue
        if art == "s":
            a(stern(x, y, 7, 5, "#e3b65a"))
        else:
            a(f'<circle cx="{x}" cy="{y}" r="5.5" fill="#a8693a"/><circle cx="{x}" cy="{y}" r="2" fill="#fff"/>')

    # Teig mit Nudelholz
    a('<ellipse cx="290" cy="192" rx="36" ry="5" fill="#f2dcb0"/>')
    a(f'<rect x="254" y="183" width="14" height="7" rx="3" fill="{HOLZ}"/>')
    if "nudelholz" not in f:
        a(f'<rect x="312" y="183" width="14" height="7" rx="3" fill="{HOLZ}"/>')
    a('<rect x="268" y="178" width="44" height="14" rx="6" fill="#dcbc8c"/>')

    # Rührschüssel mit Schneebesen
    if "schneebesen" in f:
        a(f'<line x1="372" y1="128" x2="368" y2="160" stroke="{HOLZ}" stroke-width="4" stroke-linecap="round"/>')
        a(f'<ellipse cx="368" cy="161" rx="6" ry="9" fill="{HOLZ}"/>')
    else:
        a('<line x1="370" y1="128" x2="370" y2="140" stroke="#777" stroke-width="4" stroke-linecap="round"/>')
        for rx in (3, 6, 9):
            a(f'<ellipse cx="370" cy="154" rx="{rx}" ry="14" fill="none" stroke="#888" stroke-width="1.5"/>')
    a(f'<path d="M344 166 L390 166 Q388 192 367 192 Q346 192 344 166 Z" fill="#fbf8f1" stroke="{GOLD}" stroke-width="2"/>')
    a('<rect x="348" y="171" width="38" height="4" fill="#2f6f8f"/>')
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
    # Selbstprüfung: genau 10, jeder Fehler allein wirksam, Kreise passend und ohne Überschneidung
    assert len(FEHLER) == 10
    for k, _, (x, y, r) in FEHLER:
        assert szene(frozenset([k])) != a, f"Fehler {k} ändert nichts"
        assert 12 <= r <= 28 and r <= x <= 400 - r and r <= y <= 300 - r, f"Kreis {k} unpassend"
    for i, (k1, _, (x1, y1, r1)) in enumerate(FEHLER):
        for k2, _, (x2, y2, r2) in FEHLER[i + 1:]:
            assert math.hypot(x1 - x2, y1 - y2) > r1 + r2, f"Kreise {k1}/{k2} überschneiden sich"
    print(f"Fehlerbild Nr. {NR}: 10 Fehler, alle wirksam")


if __name__ == "__main__":
    main()
