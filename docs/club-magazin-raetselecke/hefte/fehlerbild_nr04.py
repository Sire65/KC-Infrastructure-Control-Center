"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 4 (April): Osterfrühstück.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild. So können A und B nie versehentlich
an weiteren Stellen auseinanderlaufen.

Aufruf:  python3 fehlerbild_nr04.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "04"
THEMA = "osterfruehstueck"
TITEL = "Osterfrühstück"

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
ROSA = "#e04a5f"
GELB = "#f2c230"
TEIG = "#d9a35f"
PORZELLAN = "#fbfbf5"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("wolke", "Vor dem Fenster fehlt die Wolke", (112, 43, 23)),
    ("kanne", "Die Kaffeekanne hat keine Tülle", (87, 148, 19)),
    ("eifehlt", "Am Osterstrauß fehlt ein Ei", (234, 82, 13)),
    ("eifarbe", "Ein Ei am Osterstrauß ist blau statt rot", (165, 116, 12)),
    ("kranz", "Am Osterkranz ist ein Ei anders gefärbt", (305, 72, 12)),
    ("tulpe", "Eine Tulpe ist gelb statt rot", (348, 97, 13)),
    ("tasse", "Eine Tasse ist blau statt rot", (281, 191, 21)),
    ("broetchen", "Im Brotkorb fehlt ein Brötchen", (216, 208, 13)),
    ("hase", "Dem Teighasen fehlt ein Ohr", (122, 212, 13)),
    ("muetze", "Ein Frühstücksei trägt eine Mütze", (320, 224, 15)),
]


def wolke(x, y):
    return (f'<g fill="#fff"><circle cx="{x - 12}" cy="{y + 3}" r="8"/><circle cx="{x}" cy="{y - 2}" r="11"/>'
            f'<circle cx="{x + 13}" cy="{y + 3}" r="8"/><rect x="{x - 12}" y="{y + 3}" width="25" height="8"/></g>')


def haenge_ei(x, y_ast, farbe):
    """Bemaltes Ei an einem Faden unter dem Zweig."""
    return (f'<line x1="{x}" y1="{y_ast}" x2="{x}" y2="{y_ast + 6}" stroke="{LINIE}" stroke-width="1"/>'
            f'<ellipse cx="{x}" cy="{y_ast + 14}" rx="6" ry="8" fill="{farbe}"/>'
            f'<line x1="{x - 5}" y1="{y_ast + 14}" x2="{x + 5}" y2="{y_ast + 14}" stroke="#fff" stroke-width="1.5"/>')


def tulpe(x, y, farbe):
    return (f'<path d="M{x - 6} {y - 6} L{x - 3} {y - 1} L{x} {y - 7} L{x + 3} {y - 1} L{x + 6} {y - 6} '
            f'Q{x + 7} {y + 7} {x} {y + 7} Q{x - 7} {y + 7} {x - 6} {y - 6}Z" fill="{farbe}"/>')


def tasse(cx, farbe):
    return (f'<ellipse cx="{cx}" cy="203" rx="20" ry="5" fill="{PORZELLAN}" stroke="#cfc6b4"/>'
            f'<path d="M{cx + 12} 186 q9 0 8 7 q-1 6 -9 5" fill="none" stroke="{farbe}" stroke-width="3.5"/>'
            f'<path d="M{cx - 14} 182 L{cx + 14} 182 L{cx + 11} 201 L{cx - 11} 201 Z" fill="{farbe}"/>'
            f'<ellipse cx="{cx}" cy="182" rx="14" ry="3" fill="#5a3420"/>')


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Wand mit Streifentapete
    a(f'<rect width="400" height="300" fill="#efe4cc"/>')
    for x in range(0, 400, 24):
        a(f'<rect x="{x}" y="0" width="12" height="170" fill="#f5eddc"/>')

    # Fenster in den Frühlingsgarten
    a('<rect x="30" y="20" width="120" height="100" fill="#cfe9f5"/>')
    a('<circle cx="55" cy="42" r="10" fill="#fff1a8"/>')
    if "wolke" not in f:
        a(wolke(112, 44))
    a('<path d="M30 96 Q70 86 110 94 T150 92 V120 H30Z" fill="#9cc77a"/>')
    for x, c in ((52, ROSA), (66, GELB), (128, ROSA)):
        a(f'<circle cx="{x}" cy="104" r="3" fill="{c}"/>')
    a('<rect x="30" y="20" width="120" height="100" fill="none" stroke="#fff" stroke-width="6"/>')
    a('<line x1="90" y1="20" x2="90" y2="120" stroke="#fff" stroke-width="4"/>')
    a('<line x1="30" y1="70" x2="150" y2="70" stroke="#fff" stroke-width="4"/>')
    a(f'<rect x="24" y="120" width="132" height="7" fill="{HOLZ}"/>')

    # Osterkranz an der Wand
    a(f'<circle cx="305" cy="50" r="20" fill="none" stroke="{GRUEN}" stroke-width="9"/>')
    for i in range(8):
        w = math.radians(i * 45 + 20)
        a(f'<circle cx="{305 + 20 * math.cos(w):.1f}" cy="{50 + 20 * math.sin(w):.1f}" r="2.5" fill="#fff"/>')
    a(f'<path d="M297 26 l8 6 l8 -6 l0 10 l-8 -4 l-8 4 z" fill="{WEINROT}"/>')
    for x, y, c in ((289, 66, GOLD), (305, 72, BLAU if "kranz" in f else ROSA), (321, 66, GOLD)):
        a(f'<ellipse cx="{x}" cy="{y}" rx="6" ry="8" fill="{c}" stroke="{LINIE}" stroke-width="0.8"/>')

    # Tischdecke mit Borte
    a('<rect x="0" y="165" width="400" height="135" fill="#fbf8f1"/>')
    a('<rect x="0" y="165" width="400" height="3" fill="#e2d6bd"/>')
    a(f'<rect x="0" y="284" width="400" height="8" fill="{WEINROT}"/>')
    for x in range(10, 400, 20):
        a(f'<circle cx="{x}" cy="288" r="2" fill="{GOLD}"/>')

    # Osterstrauß in der Vase
    for ex, ey in ((160, 40), (188, 22), (220, 24), (248, 46), (150, 90), (252, 95)):
        a(f'<line x1="200" y1="130" x2="{ex}" y2="{ey}" stroke="{HOLZ_DUNKEL}" stroke-width="2.5" stroke-linecap="round"/>')
    for x, y in ((166, 50), (190, 32), (218, 34), (244, 54)):
        a(f'<circle cx="{x}" cy="{y}" r="3" fill="#b9d98a"/>')   # junge Blätter
    a(haenge_ei(170, 62, GOLD))
    a(haenge_ei(190, 44, BLAU))
    a(haenge_ei(215, 49, ROSA))
    if "eifehlt" not in f:
        a(haenge_ei(234, 71, GRUEN))
    a(haenge_ei(165, 102, BLAU if "eifarbe" in f else WEINROT))
    a(haenge_ei(239, 101, GELB))
    a(f'<path d="M188 128 L212 128 L216 172 L184 172 Z" fill="{WEINROT}"/>')
    a(f'<rect x="185" y="146" width="30" height="5" fill="{GOLD}"/>')

    # Tulpen in der Glasvase
    for x, y in ((334, 110), (348, 97), (362, 112)):
        a(f'<line x1="{x}" y1="{y}" x2="346" y2="168" stroke="{GRUEN}" stroke-width="2.5"/>')
    a(f'<path d="M340 168 q-14 -20 -6 -40 q4 18 10 40z M352 168 q14 -18 8 -36 q-6 16 -12 36z" fill="{GRUEN}"/>')
    a(tulpe(334, 110, ROSA))
    a(tulpe(348, 97, GELB if "tulpe" in f else ROSA))
    a(tulpe(362, 112, ROSA))
    a('<rect x="334" y="140" width="24" height="32" rx="5" fill="#d9eef5" opacity="0.85" stroke="#9fb7bf"/>')

    # Kaffeekanne
    a(f'<path d="M44 136 q-14 4 -10 22 q2 6 8 4" fill="none" stroke="{PORZELLAN}" stroke-width="5"/>')
    if "kanne" not in f:
        a(f'<polygon points="77,150 92,133 97,136 80,164" fill="{PORZELLAN}" stroke="#cfc6b4"/>')
    a(f'<path d="M42 172 L46 128 Q60 120 74 128 L78 172 Z" fill="{PORZELLAN}" stroke="#cfc6b4"/>')
    a(f'<path d="M43.6 152 L76.4 152 L76.9 158 L43.1 158 Z" fill="{WEINROT}"/>')
    a(f'<ellipse cx="60" cy="127" rx="14" ry="4" fill="{PORZELLAN}" stroke="#cfc6b4"/>')
    a(f'<circle cx="60" cy="121" r="3.5" fill="{GOLD}"/>')

    # Tassen
    a(tasse(130, WEINROT))
    a(tasse(277, BLAU if "tasse" in f else WEINROT))

    # Brotkorb mit Brötchen
    for x, y in ((176, 211), (196, 206), (216, 209)):
        if x == 216 and "broetchen" in f:
            continue
        a(f'<ellipse cx="{x}" cy="{y}" rx="11" ry="7" fill="#d29a5a" stroke="{HOLZ_DUNKEL}" stroke-width="1"/>')
        a(f'<path d="M{x - 6} {y - 2} q6 -4 12 0" fill="none" stroke="#f0d3a4" stroke-width="2"/>')
    a(f'<path d="M160 212 L240 212 L232 240 L168 240 Z" fill="{HOLZ}"/>')
    for y in (219, 226, 233):
        a(f'<line x1="163" y1="{y}" x2="237" y2="{y}" stroke="{HOLZ_DUNKEL}" stroke-width="1.2"/>')
    a(f'<rect x="158" y="209" width="84" height="5" rx="2" fill="{HOLZ_DUNKEL}"/>')

    # Teighase auf dem Brett
    a(f'<ellipse cx="100" cy="258" rx="42" ry="10" fill="{HOLZ_HELL}" stroke="{HOLZ}" stroke-width="2"/>')
    a(f'<ellipse cx="114" cy="214" rx="3.5" ry="10" fill="{TEIG}" transform="rotate(-10 114 214)"/>')
    if "hase" not in f:
        a(f'<ellipse cx="122" cy="214" rx="3.5" ry="10" fill="{TEIG}" transform="rotate(18 122 214)"/>')
    a(f'<ellipse cx="100" cy="244" rx="20" ry="13" fill="{TEIG}"/>')
    a(f'<circle cx="117" cy="230" r="9" fill="{TEIG}"/>')
    a(f'<circle cx="81" cy="242" r="4.5" fill="#fbf6ec"/>')
    a(f'<circle cx="120" cy="228" r="1.6" fill="{LINIE}"/>')
    a(f'<path d="M92 238 q4 -5 10 0" fill="none" stroke="#b9823f" stroke-width="1.5"/>')

    # Eierbecher mit Ei (und Mütze)
    for cx, ei in ((320, PORZELLAN), (362, "#9fc6e0")):
        a(f'<ellipse cx="{cx}" cy="234" rx="10" ry="13" fill="{ei}" stroke="#d0c7b5"/>')
        a(f'<path d="M{cx - 11} 238 Q{cx} 254 {cx + 11} 238 Z M{cx - 3} 248 L{cx + 3} 248 L{cx + 6} 260 '
          f'L{cx - 6} 260 Z" fill="{GOLD}"/>')
        a(f'<ellipse cx="{cx}" cy="260" rx="10" ry="3" fill="{GOLD}"/>')
    if "muetze" in f:
        a(f'<path d="M310 230 Q311 213 320 213 Q329 213 330 230 Z" fill="{WEINROT}"/>')
        a(f'<rect x="309" y="228" width="22" height="4" rx="2" fill="{GOLD}"/>')
        a(f'<circle cx="320" cy="213" r="3.5" fill="#fff"/>')

    # Teller mit Butter, bunte Eier auf dem Tisch
    a(f'<ellipse cx="240" cy="264" rx="26" ry="8" fill="{PORZELLAN}" stroke="#cfc6b4"/>')
    a(f'<rect x="228" y="254" width="22" height="9" rx="2" fill="#f7e08a"/>')
    a(f'<ellipse cx="34" cy="270" rx="7" ry="9" fill="{GOLD}" transform="rotate(70 34 270)"/>')
    a(f'<ellipse cx="54" cy="275" rx="7" ry="9" fill="{ROSA}" transform="rotate(-60 54 275)"/>')
    a(f'<ellipse cx="380" cy="272" rx="7" ry="9" fill="{GRUEN}" transform="rotate(80 380 272)"/>')
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
