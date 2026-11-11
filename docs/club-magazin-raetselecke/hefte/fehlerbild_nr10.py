"""Fehlerbild „Finde die 10 Fehler“ – Heft Nr. 10 (Oktober 2027): Kürbissuppe & Herbstküche.

Erzeugt aus EINER Szenenbeschreibung Bild A (Original), Bild B (mit genau
10 Abweichungen) und ein Lösungsbild – Aufbau wie fehlerbild.py (Heft 1).

Aufruf:  python3 fehlerbild_nr10.py   (schreibt die SVGs neben dieses Skript)
"""
import json
import math
from pathlib import Path

HIER = Path(__file__).resolve().parent
NR = "10"
THEMA = "herbstkueche"
TITEL = "Herbstküche mit Kürbissuppe"

WEINROT = "#7a1f2b"
BEIGE = "#f3ead8"
GOLD = "#c9a44c"
HOLZ = "#9a6a45"
HOLZ_DUNKEL = "#6f4a2f"
LINIE = "#3b2a20"
GRUEN = "#4f8a3a"

# Die 10 Fehler: Schlüssel, Beschreibung, Fundstelle (x, y, Radius) im Bild
FEHLER = [
    ("lampe", "Der Lampenschirm hat eine andere Farbe", (200, 43, 22)),
    ("baum", "Am Baum vor dem Fenster ist ein Teil noch grün", (120, 78, 20)),
    ("kerze", "Die Kerze auf der Fensterbank brennt nicht", (45, 112, 13)),
    ("teller", "Auf dem Regal fehlt ein Teller", (320, 57, 20)),
    ("stiel", "Dem großen Kürbis fehlt der Stiel", (80, 143, 13)),
    ("kuerbis", "Der kleine Kürbis ist grün statt orange", (135, 186, 20)),
    ("rosmarin", "Im Glas steckt ein Rosmarinzweig weniger", (171, 153, 17)),
    ("kelle", "Die Kelle im Topf fehlt", (247, 136, 25)),
    ("sahne", "In der Suppenschale fehlt der Sahneklecks", (352, 178, 14)),
    ("apfel", "In der Kiste liegt ein Apfel weniger", (215, 246, 14)),
]


def blatt(cx, cy, w, farbe):
    """Kleines fallendes Herbstblatt (Ellipse, gedreht)."""
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="5" ry="2.6" fill="{farbe}" '
            f'transform="rotate({w} {cx} {cy})"/>')


def kuerbis(cx, cy, rx, ry, farbe, rippe):
    t = [f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{farbe}"/>']
    for f in (0.62, 0.28):
        t.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx * f:.1f}" ry="{ry}" fill="none" '
                 f'stroke="{rippe}" stroke-width="1.6"/>')
    return "".join(t)


def zweig(x1, y1, x2, y2):
    """Rosmarinzweig: Stiel mit Nadelpaaren."""
    t = [f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#5b7a46" stroke-width="2"/>']
    for i in range(1, 6):
        s = i / 6
        px, py = x1 + (x2 - x1) * s, y1 + (y2 - y1) * s
        t.append(f'<path d="M{px:.1f} {py:.1f} l-5 -3 M{px:.1f} {py:.1f} l5 -3" '
                 f'stroke="#6f9a5a" stroke-width="2" stroke-linecap="round"/>')
    return "".join(t)


def szene(fehler=frozenset()):
    f = set(fehler)
    t = []
    a = t.append
    # Wand, Deckenbalken, Boden
    a(f'<rect width="400" height="300" fill="{BEIGE}"/>')
    a('<rect x="0" y="150" width="400" height="50" fill="#ead9bb"/>')
    a(f'<rect x="0" y="0" width="400" height="12" fill="{HOLZ_DUNKEL}"/>')
    a('<rect x="0" y="282" width="400" height="18" fill="#b98a5e"/>')

    # Hängelampe
    a(f'<line x1="200" y1="12" x2="200" y2="34" stroke="{LINIE}" stroke-width="2"/>')
    schirm = "#3f7a4a" if "lampe" in f else WEINROT
    a(f'<path d="M184 52 L216 52 L208 34 L192 34 Z" fill="{schirm}"/>')
    a('<path d="M193 52 a7 6 0 0 0 14 0 z" fill="#fff3b0"/>')

    # Fenster mit Herbstbaum und fallendem Laub
    a('<rect x="30" y="30" width="120" height="110" fill="#cfe3ee"/>')
    a('<ellipse cx="90" cy="140" rx="70" ry="14" fill="#b9c98f"/>')
    a(f'<rect x="96" y="92" width="8" height="45" fill="{HOLZ_DUNKEL}"/>')
    krone = [(80, 75, 16, "#d9772b"), (100, 60, 18, "#b8432c"), (98, 86, 14, "#e0a63a"),
             (120, 78, 15, "#5f8f3e" if "baum" in f else "#e08a2e")]
    for x, y, r, farbe in krone:
        a(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{farbe}"/>')
    a(blatt(52, 108, 30, "#d9772b") + blatt(60, 52, -25, "#b8432c") + blatt(138, 112, 15, "#e0a63a"))
    a(f'<rect x="30" y="30" width="120" height="110" fill="none" stroke="{HOLZ}" stroke-width="6"/>')
    a(f'<line x1="90" y1="30" x2="90" y2="140" stroke="{HOLZ}" stroke-width="3"/>')
    a(f'<rect x="22" y="138" width="136" height="8" fill="{HOLZ}"/>')
    # Kerze und Zierkürbis auf der Fensterbank
    a('<rect x="40" y="118" width="10" height="20" fill="#fbf3e0" stroke="#d9c9a3"/>')
    if "kerze" not in f:
        a('<ellipse cx="45" cy="110" rx="4.5" ry="7.5" fill="#f2a93b"/>'
          '<ellipse cx="45" cy="112" rx="2" ry="3.5" fill="#fff3b0"/>')
    a(kuerbis(128, 131, 11, 8, "#e8902f", "#c06a1f"))

    # Regal mit Tellern (oben) und Vorräten (unten)
    for y in (72, 128):
        a(f'<rect x="262" y="{y}" width="126" height="6" fill="{HOLZ}"/>')
        a(f'<path d="M270 {y + 6} l0 10 l10 -10 z M370 {y + 6} l0 10 l10 -10 z" fill="{HOLZ_DUNKEL}"/>')
    teller = [285, 355] if "teller" in f else [285, 320, 355]
    for x in teller:
        a(f'<circle cx="{x}" cy="57" r="15" fill="#fff" stroke="{GOLD}" stroke-width="3"/>')
        a(f'<circle cx="{x}" cy="57" r="7" fill="none" stroke="{WEINROT}" stroke-width="2"/>')
    a('<rect x="270" y="102" width="22" height="26" rx="3" fill="#eaf4f7" stroke="#9fb7bf"/>'
      '<rect x="272" y="110" width="18" height="16" rx="2" fill="#e8b84a"/>'
      f'<rect x="269" y="97" width="24" height="6" rx="2" fill="{GOLD}"/>')
    a(f'<rect x="308" y="108" width="20" height="20" rx="3" fill="{WEINROT}"/>'
      f'<path d="M328 112 a6 6 0 0 1 0 12" fill="none" stroke="{WEINROT}" stroke-width="3"/>')
    a('<path d="M355 128 L355 104 L360 96 L360 88 L366 88 L366 96 L371 104 L371 128 Z" fill="#b8a33c"/>')

    # Tisch mit Läufer, Beine, Apfelkiste darunter
    a(f'<rect x="10" y="196" width="380" height="10" fill="{HOLZ}"/>')
    a(f'<rect x="14" y="206" width="372" height="18" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="150" y="196" width="100" height="28" fill="{WEINROT}"/>')
    a(f'<rect x="150" y="214" width="100" height="3" fill="{GOLD}"/>')
    for x in (25, 360):
        a(f'<rect x="{x}" y="224" width="15" height="62" fill="{HOLZ_DUNKEL}"/>')
    a(f'<rect x="160" y="252" width="80" height="34" fill="{HOLZ}" stroke="{HOLZ_DUNKEL}" stroke-width="2"/>')
    a(f'<line x1="160" y1="269" x2="240" y2="269" stroke="{HOLZ_DUNKEL}" stroke-width="2"/>')
    aepfel = [175, 195, 230] if "apfel" in f else [175, 195, 215, 230]
    for x in aepfel:
        a(f'<circle cx="{x}" cy="247" r="9" fill="#c8362b"/>'
          f'<line x1="{x}" y1="239" x2="{x + 1}" y2="234" stroke="{HOLZ_DUNKEL}" stroke-width="2"/>')

    # Großer Kürbis und kleiner Kürbis
    a(kuerbis(80, 171, 38, 26, "#e07b2a", "#b85e1a"))
    if "stiel" not in f:
        a('<path d="M76 148 L77 138 Q80 134 86 136 L84 148 Z" fill="#6b7a2f"/>')
    a(kuerbis(135, 186, 16, 11, "#6f8f3a" if "kuerbis" in f else "#e8902f", "#4c6a24" if "kuerbis" in f else "#c06a1f"))

    # Glas mit Rosmarin
    zweige = [(152, 168, 146, 138), (160, 168, 160, 134)]
    if "rosmarin" not in f:
        zweige.append((166, 168, 176, 140))
    for z in zweige:
        a(zweig(*z))
    a('<rect x="151" y="166" width="20" height="30" rx="3" fill="#dcecf1" stroke="#9fb7bf" opacity="0.9"/>')

    # Suppentopf mit Kelle und Dampf
    for x in (200, 218):
        a(f'<path d="M{x} 150 q-6 -8 0 -14 q6 -6 0 -14" fill="none" stroke="#b9b2a6" '
          f'stroke-width="3" stroke-linecap="round"/>')
    if "kelle" not in f:
        a('<line x1="234" y1="160" x2="256" y2="128" stroke="#8a8a8a" stroke-width="4" stroke-linecap="round"/>'
          '<path d="M256 128 q6 -6 0 -10" fill="none" stroke="#8a8a8a" stroke-width="3"/>')
    a('<rect x="180" y="160" width="70" height="36" rx="6" fill="#4a4a4a"/>')
    a('<rect x="172" y="168" width="10" height="5" rx="2" fill="#333"/>'
      '<rect x="248" y="168" width="10" height="5" rx="2" fill="#333"/>')
    a('<ellipse cx="215" cy="160" rx="35" ry="6" fill="#e58a2e"/>')

    # Brot
    a('<ellipse cx="294" cy="187" rx="26" ry="11" fill="#c98a4b"/>')
    for x in (282, 294, 306):
        a(f'<line x1="{x - 3}" y1="182" x2="{x + 3}" y2="192" stroke="#8e5a2c" stroke-width="2.5"/>')

    # Suppenschale mit Sahne und Petersilie, Löffel
    a(f'<path d="M330 178 a24 18 0 0 0 48 0 z" fill="{BEIGE}" stroke="{GOLD}" stroke-width="2"/>')
    a('<ellipse cx="354" cy="178" rx="24" ry="6" fill="#e58a2e"/>')
    if "sahne" not in f:
        a('<ellipse cx="350" cy="178" rx="9" ry="3.5" fill="#fffaf0"/>')
    a(f'<circle cx="361" cy="177" r="1.8" fill="{GRUEN}"/><circle cx="365" cy="179" r="1.8" fill="{GRUEN}"/>')
    a('<line x1="382" y1="194" x2="388" y2="168" stroke="#8a8a8a" stroke-width="3" stroke-linecap="round"/>')
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
