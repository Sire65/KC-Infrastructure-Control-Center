# KICC-ADVENT-NASCHHEFT – baut das A5-Heft „Weihnachtliche Naschereien“ (HTML -> PDF A5 + druckbares Heft auf A4).
# Daten: daten/club-app-advent.json (aus der Club-App, siehe daten-holen.mjs) + daten/ergaenzungen.json (Internet, eigene Texte).
# Fotos: fotos/<nr>-<id>.jpg|png|webp + Eintrag in fotos/quellen.csv. Fehlt ein Foto, steht ein Platzhalter „Foto folgt“ im Heft.
# Aufruf: python3 bauen.py   (braucht Node + Playwright für das PDF, pypdf für das Heft)
import csv, html, json, re, subprocess, sys
from collections import OrderedDict
from pathlib import Path
from urllib.parse import urlparse

HIER = Path(__file__).resolve().parent
HEFT_VERSION = "1.0"
STAND = "27.11.2026"
FOTO_ENDUNGEN = (".jpg", ".jpeg", ".png", ".webp")

# ---------- Kapitel und Reihenfolge (Titel exakt wie in den Daten) ----------
KAPITEL = OrderedDict([
    ("haeuser", ("Häuser, Züge & Schlitten", "#9b2c2c")),
    ("schnee", ("Schneemänner & Nikoläuse", "#2b6cb0")),
    ("tiere", ("Tiere", "#8a5a2b")),
    ("baeume", ("Bäume, Sterne & Lichter", "#2f6b3f")),
    ("schenken", ("Zum Verschenken", "#b7791f")),
    ("deko", ("Basteln & Deko – nicht zum Essen", "#6b46c1")),
])
# titel: (id, kapitel, dauer, stufe 1-3, kinder, essbar, suchbegriff_en)
META = {
    "Hexenhaus aus Butterkeksen": ("hexenhaus", "haeuser", "ca. 45 Min. + trocknen", 2, "mit Hilfe", True, "butter biscuit gingerbread house"),
    "Lokomotive aus Dominosteinen": ("lokomotive", "haeuser", "ca. 30 Min. + trocknen", 2, "ja", True, "candy train chocolate christmas"),
    "Stall aus Zwieback": ("stall", "haeuser", "ca. 45 Min. + trocknen", 2, "mit Hilfe", True, "rusk nativity stable edible"),
    "Iglu aus Mini-Marshmallows": ("iglu", "haeuser", "ca. 45 Min. + trocknen", 2, "ja", True, "marshmallow igloo"),
    "Schlitten aus Zuckerstangen": ("schlitten", "haeuser", "ca. 15 Min.", 1, "ja", True, "candy cane sleigh"),
    "Schneemann aus Pfeffernüssen": ("schneemann-pfeffernuss", "schnee", "ca. 20 Min. + trocknen", 1, "ja", True, "pfeffernuesse snowman"),
    "Marshmallow-Schneemann am Spieß": ("marshmallow-schneemann", "schnee", "ca. 10 Min.", 1, "ja", True, "marshmallow snowman on a stick"),
    "Schneemann-Muffin": ("schneemann-muffin", "schnee", "ca. 15 Min. (ohne Backen)", 1, "ja", True, "melting snowman cupcake"),
    "Schneemann-Lollis aus Doppelkeksen": ("schneemann-lolli", "schnee", "ca. 40 Min. + fest werden", 2, "mit Hilfe", True, "oreo snowman pops"),
    "Bananen-Schneemänner am Spieß": ("bananen-schneemann", "schnee", "ca. 15 Min.", 1, "ja", True, "banana snowman skewer"),
    "Nikolaus aus Schokokuss": ("nikolaus-schokokuss", "schnee", "ca. 10 Min.", 1, "ja", True, "chocolate marshmallow santa strawberry"),
    "Nikolaus-Erdbeeren": ("nikolaus-erdbeeren", "schnee", "ca. 20 Min.", 1, "ja", True, "strawberry santa cream"),
    "Brownie-Weihnachtsmützen": ("brownie-muetzen", "schnee", "ca. 20 Min. (ohne Backen)", 1, "ja", True, "santa hat brownies"),
    "Grinch-Spieße": ("grinch-spiesse", "schnee", "ca. 15 Min.", 1, "ja", True, "grinch fruit kabobs"),
    "Rentier aus Marshmallow": ("rentier-marshmallow", "tiere", "ca. 20 Min. + fest werden", 1, "ja", True, "marshmallow reindeer pretzel antlers"),
    "Rentier aus Lebkuchenmann": ("rentier-lebkuchen", "tiere", "ca. 15 Min.", 1, "ja", True, "gingerbread man reindeer upside down"),
    "Rentier-Bruchschokolade": ("rentier-bruchschokolade", "tiere", "ca. 20 Min. + kühlen", 1, "ja", True, "reindeer chocolate bark"),
    "Pinguin aus Mini-Schokoküssen": ("pinguin", "tiere", "ca. 20 Min.", 2, "ja", True, "chocolate penguin treat"),
    "Apfel-Igel": ("apfel-igel", "tiere", "ca. 10 Min.", 1, "ja", True, "apple hedgehog almonds"),
    "Tannenbaum aus Eiswaffel": ("eiswaffel-tanne", "baeume", "ca. 20 Min. + trocknen", 1, "ja", True, "ice cream cone christmas tree"),
    "Keks-Tannen": ("keks-tannen", "baeume", "ca. 20 Min. + trocknen", 1, "ja", True, "star cookie christmas tree stack"),
    "Obst-Tannenbaum": ("obst-tanne", "baeume", "ca. 20 Min.", 1, "ja", True, "fruit christmas tree kiwi"),
    "Lebkuchen-Kerze mit Mandel-Flamme": ("lebkuchen-kerze", "baeume", "ca. 20 Min. + fest werden", 2, "mit Hilfe", True, "edible candle wafer roll almond flame"),
    "Mandarinen-Licht (Luciatag)": ("mandarinen-licht", "baeume", "ca. 15 Min.", 2, "mit Hilfe", True, "clementine candle"),
    "Schneeflocke aus Brezeln": ("brezel-schneeflocke", "baeume", "ca. 15 Min. + fest werden", 1, "ja", True, "pretzel snowflake white chocolate"),
    "Brezelkränze mit Schokolade": ("brezel-kranz", "baeume", "ca. 20 Min. + fest werden", 1, "ja", True, "pretzel wreath chocolate"),
    "Zauberstäbe aus Salzstangen": ("zauberstaebe", "baeume", "ca. 15 Min. + fest werden", 1, "ja", True, "chocolate dipped pretzel rods sprinkles"),
    "Schokolöffel für heiße Milch": ("schokoloeffel", "schenken", "ca. 15 Min. + kühlen", 1, "ja", True, "hot chocolate spoons"),
    "Naschglas-Schneekugel": ("naschglas", "schenken", "ca. 20 Min.", 1, "ja", True, "candy jar snow globe"),
    "Päckchen aus Dominosteinen": ("domino-paeckchen", "schenken", "ca. 15 Min. + trocknen", 1, "ja", True, "Dominostein"),
    "Zuckerstangen-Herz": ("zuckerstangen-herz", "schenken", "ca. 15 Min. + kühlen", 1, "ja", True, "candy cane heart chocolate"),
    "Engel aus Nudeln (Baumschmuck)": ("nudel-engel", "deko", "ca. 30 Min. + trocknen", 2, "ja", False, "pasta angel ornament"),
    "Popcorn-Girlande": ("popcorn-girlande", "deko", "ca. 45 Min.", 1, "ja", False, "popcorn cranberry garland"),
    "Sterne aus Butterbrottüten": ("tueten-sterne", "deko", "ca. 30 Min.", 2, "ja", False, "paper bag star"),
    "Schneeflocken aus Papier": ("papier-schneeflocken", "deko", "ca. 15 Min.", 1, "ja", False, "paper snowflake"),
    "Nikolausstiefel aus Filz": ("filz-stiefel", "deko", "ca. 45 Min.", 2, "mit Hilfe", False, "felt christmas stocking"),
    "Karte mit Stehauf-Tannenbäumen": ("stehauf-karte", "deko", "ca. 30 Min.", 2, "ja", False, "pop up christmas tree card"),
    "Geschenkpapier mit Kartoffeldruck": ("kartoffeldruck", "deko", "ca. 45 Min. + trocknen", 1, "mit Hilfe", False, "potato stamp wrapping paper"),
    "Geschenke natürlich verpacken": ("natur-verpackung", "deko", "ca. 30 Min.", 1, "ja", False, "kraft paper gift cinnamon orange"),
    "Frost-Windlicht mit Salzkristallen": ("salz-windlicht", "deko", "10 Min. + einige Tage", 1, "ja", False, "salt crystal jar lantern"),
    "Girlande aus Orangenscheiben": ("orangen-girlande", "deko", "ca. 1½ Std.", 1, "mit Hilfe", False, "dried orange garland"),
    "Duft-Orange mit Nelken": ("nelken-orange", "deko", "ca. 20 Min.", 1, "ja", False, "orange cloves pomander"),
    "Zapfenwichtel": ("zapfenwichtel", "deko", "ca. 1 Std.", 2, "mit Hilfe", False, "pine cone gnome"),
    "Leuchtende Doppelvase": ("doppelvase", "deko", "ca. 20 Min.", 1, "ja", False, "vase in vase fairy lights baubles"),
    "Servietten-Tannenbaum": ("servietten-tanne", "deko", "ca. 5 Min. je Stück", 2, "ja", False, "christmas tree napkin fold"),
}
# Grundzutaten für die Einkaufsliste: Anzeige -> Suchmuster in Zutatenliste
EINKAUF = [
    ("Puderzucker (für Zuckerguss)", r"puderzucker|zuckerguss|guss\b|^guss"), ("Eier (Eiweiß für Guss)", r"eiweiß"),
    ("Kuvertüre / Zartbitter- oder Vollmilchschokolade", r"kuvertüre|zartbitter|vollmilch|schokolade(?!n)|flüssige schokolade"), ("weiße Schokolade", r"weiße schokolade|weiße kuvertüre|candy melts"),
    ("Butterkekse", r"butterkeks"), ("Dominosteine", r"dominostein"), ("Lebkuchen / Lebkuchenmänner", r"lebkuchen"), ("weiße Pfeffernüsse", r"pfeffernüss"),
    ("Schokoküsse", r"schokokuss|schokoküss"), ("große Marshmallows", r"(?<!mini-)marshmallows?\b(?! \()|große marshmallows"), ("Mini-Marshmallows", r"mini-marshmallow"),
    ("Salzbrezeln / Salzstangen", r"brezel|salzstange"), ("Zuckerstangen", r"zuckerstange"), ("Eiswaffeln (spitz)", r"eiswaffel"),
    ("Smarties / Schokolinsen", r"smarties|schokolinsen|schokolinse|rote linse"), ("Zuckerperlen / Streusel", r"zuckerperlen|streusel|sternchen"), ("Zuckeraugen / Schokoaugen", r"zuckeraugen|schokoaugen"),
    ("Lebensmittelstift / Zuckerschrift", r"lebensmittelstift|zuckerschrift"), ("Lebensmittelfarbe grün", r"lebensmittelfarbe"), ("Marzipan", r"marzipan"), ("Kokosraspeln", r"kokos"),
    ("Fruchtgummi / Fruchtgummischnur", r"fruchtgummi"), ("Gummibärchen", r"gummibär|gummitiere"), ("Mandeln (ganz / Stifte)", r"mandel"),
    ("Schlagsahne + Sahnesteif", r"sahne"), ("Erdbeeren", r"erdbeer"), ("Bananen", r"banane"), ("Weintrauben", r"weintraube"), ("Äpfel", r"apfel"), ("Orangen / Mandarinen", r"orange|mandarine"),
    ("Holzspieße / Lolli-Stiele", r"spieß|stiele|zahnstocher"), ("Backpapier", r"backpapier"),
]

def lade():
    club = json.loads((HIER / "daten/club-app-advent.json").read_text(encoding="utf-8"))
    erg = json.loads((HIER / "daten/ergaenzungen.json").read_text(encoding="utf-8"))
    alle = {}
    for e in club["nasch"] + club["bastel"]:
        alle[e["t"]] = {**e, "herkunft": "club"}
    for e in erg["eintraege"]:
        alle[e["t"]] = {**e, "herkunft": "netz"}
    fehlend = set(alle) ^ set(META)
    if fehlend:
        sys.exit(f"Titel ohne Zuordnung: {sorted(fehlend)}")
    liste = []
    for kap in KAPITEL:
        for titel, m in META.items():
            if m[1] == kap:
                e = alle[titel]
                liste.append({**e, "id": m[0], "kap": kap, "dauer": e.get("dauer") or m[2], "stufe": m[3], "kinder": m[4], "essbar": m[5], "such_en": m[6]})
    for i, e in enumerate(liste, 1):
        e["nr"] = i
        e["datei_basis"] = f"{i:02d}-{e['id']}"
    return club["stand"], liste

def fotos_lesen():
    q = {}
    p = HIER / "fotos/quellen.csv"
    if p.exists():
        with p.open(encoding="utf-8") as f:
            for r in csv.DictReader(f, delimiter=";"):
                q[r["id"].strip()] = {k: (v or "").strip() for k, v in r.items()}
    return q

def foto_datei(e):
    for end in FOTO_ENDUNGEN:
        p = HIER / "fotos" / (e["datei_basis"] + end)
        if p.exists():
            return p
    return None

def quellen_vorlage(liste, q):
    # fotos/quellen.csv: eine Zeile je Anleitung; vorhandene Angaben bleiben erhalten
    felder = ["id", "nr", "titel", "suchbegriff_de", "suchbegriff_en", "datei", "art", "urheber", "lizenz", "quelle"]
    with (HIER / "fotos/quellen.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=felder, delimiter=";")
        w.writeheader()
        for e in liste:
            alt = q.get(e["id"], {})
            w.writerow({"id": e["id"], "nr": e["nr"], "titel": e["t"], "suchbegriff_de": e["t"], "suchbegriff_en": e["such_en"],
                        "datei": alt.get("datei") or e["datei_basis"] + ".jpg", "art": alt.get("art", ""), "urheber": alt.get("urheber", ""),
                        "lizenz": alt.get("lizenz", ""), "quelle": alt.get("quelle", "")})

esc = lambda s: html.escape(str(s), quote=True)
def domain(u):
    d = urlparse(u).netloc.lower()
    return d[4:] if d.startswith("www.") else d

CSS = """
@page { size: 148mm 210mm; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: 'Inter', 'DejaVu Sans', sans-serif; color: #2a2420; font-size: 9pt; line-height: 1.4; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.seite { width: 148mm; height: 210mm; position: relative; overflow: hidden; page-break-after: always; padding: 11mm 11mm 13mm; background: #fff; }
.seite:last-child { page-break-after: auto; }
h1, h2, h3 { font-family: 'Caladea', 'Liberation Serif', serif; margin: 0; font-weight: 700; }
.fuss { position: absolute; left: 11mm; right: 11mm; bottom: 6mm; display: flex; justify-content: space-between; font-size: 6.4pt; color: #8a7f76; border-top: .3mm solid #eadfd3; padding-top: 1.4mm; }
.fuss b { color: #5b514a; font-weight: 600; }
/* Rezeptseite */
.band { position: absolute; left: 0; top: 0; bottom: 0; width: 4mm; }
.kopf { display: flex; justify-content: space-between; align-items: baseline; font-size: 6.6pt; text-transform: uppercase; letter-spacing: .08em; font-weight: 600; margin-bottom: 2mm; }
.kopf .nr { font-family: 'Caladea', serif; font-size: 11pt; letter-spacing: 0; }
.bild { width: 100%; height: 84mm; border-radius: 3mm; overflow: hidden; position: relative; background: #f3ece4; }
.bild img { width: 100%; height: 100%; object-fit: cover; display: block; }
.bild .credit { position: absolute; right: 0; bottom: 0; background: rgba(0,0,0,.55); color: #fff; font-size: 5.4pt; padding: .6mm 1.6mm; border-top-left-radius: 1.6mm; max-width: 100%; }
.platz { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2mm; }
.platz .sym { font-family: 'Noto Color Emoji'; font-size: 46pt; line-height: 1; }
.platz .hin { font-size: 7pt; color: #8a7f76; letter-spacing: .05em; text-transform: uppercase; }
h2.titel { font-size: 17.5pt; line-height: 1.12; margin: 3.4mm 0 1.8mm; }
.chips { display: flex; flex-wrap: wrap; gap: 1.4mm; margin-bottom: 2.6mm; }
.chip { font-size: 7.2pt; background: #f6f0e8; border-radius: 4mm; padding: .7mm 2.2mm; white-space: nowrap; }
.chip.warn { background: #ede7fb; color: #4c2f99; font-weight: 600; }
.chip .e { font-family: 'Noto Color Emoji'; }
.zut { background: #fbf7f1; border-radius: 2.4mm; padding: 2mm 3mm 2.2mm; margin-bottom: 2.6mm; }
.zut h3, .schritte h3 { font-size: 9.6pt; margin-bottom: 1mm; }
.zut ul { margin: 0; padding: 0 0 0 3.4mm; columns: 2; column-gap: 5mm; }
.zut li { margin: 0 0 .5mm; break-inside: avoid; }
.schritte ol { margin: 0; padding: 0; list-style: none; counter-reset: s; }
.schritte li { counter-increment: s; position: relative; padding-left: 6mm; margin-bottom: 1.4mm; }
.schritte li::before { content: counter(s); position: absolute; left: 0; top: .2mm; width: 4.2mm; height: 4.2mm; border-radius: 50%; color: #fff; font-size: 6.6pt; font-weight: 700; display: flex; align-items: center; justify-content: center; background: var(--k); }
.tipp { margin-top: 2mm; border-left: 1.2mm solid var(--k); background: #fdfaf5; padding: 1.6mm 2.6mm; border-radius: 0 2mm 2mm 0; }
.tipp b { color: var(--k); }
/* Titel */
.titelseite { padding: 0; background: #1d1a17; color: #fff; }
.titelseite .foto { position: absolute; inset: 0; background-size: cover; background-position: center; }
.titelseite .schleier { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20,16,14,.15) 0%, rgba(20,16,14,.05) 35%, rgba(20,16,14,.82) 66%, rgba(20,16,14,.95) 100%); }
.titelseite .text { position: absolute; left: 12mm; right: 12mm; bottom: 16mm; }
.titelseite .ober { font-size: 7.6pt; letter-spacing: .22em; text-transform: uppercase; color: #e8c37a; font-weight: 600; }
.titelseite .text h1 { color: #fff; font-size: 30pt; line-height: 1.02; margin: 3mm 0 4mm; }
.titelseite .unter { font-size: 9.4pt; color: #efe6da; line-height: 1.45; }
.titelseite .marke { margin-top: 7mm; font-size: 7pt; color: #c9bba9; letter-spacing: .06em; }
/* Textseiten */
.text h1 { font-size: 21pt; margin-bottom: 4mm; color: #9b2c2c; }
.text h3 { font-size: 10.4pt; margin: 3.4mm 0 1mm; color: #2f6b3f; }
.text p { margin: 0 0 2mm; }
.text ul { margin: 0 0 2mm; padding-left: 4mm; }
.inhalt .kap { font-family: 'Caladea', serif; font-weight: 700; font-size: 9.8pt; margin: 2.6mm 0 1mm; display: flex; align-items: center; gap: 2mm; }
.inhalt .kap i { width: 3mm; height: 3mm; border-radius: 1mm; display: inline-block; }
.inhalt .zeile { display: flex; gap: 1.6mm; font-size: 7.9pt; line-height: 1.5; }
.inhalt .zeile .t { flex: 1; border-bottom: .25mm dotted #cbbfb2; }
.inhalt .zeile .s { width: 6mm; text-align: right; }
.inhalt .zeile .e { font-family: 'Noto Color Emoji'; width: 4.4mm; }
.einkauf .liste { columns: 2; column-gap: 6mm; font-size: 7.6pt; }
.einkauf .p { break-inside: avoid; margin-bottom: 1.3mm; display: flex; gap: 1.6mm; }
.einkauf .box { width: 3mm; height: 3mm; border: .3mm solid #8a7f76; border-radius: .6mm; flex: none; margin-top: .6mm; }
.einkauf .p small { color: #8a7f76; display: block; font-size: 6.4pt; }
.quellen { font-size: 6.4pt; line-height: 1.34; }
.quellen .q { margin-bottom: .9mm; word-break: break-all; }
.quellen .q b { word-break: normal; }
.notiz .linien { position: absolute; left: 11mm; right: 11mm; top: 26mm; bottom: 18mm; background: repeating-linear-gradient(180deg, transparent 0, transparent 7.6mm, #e6dcd0 7.6mm, #e6dcd0 7.9mm); }
.rueck { background: #1d1a17; color: #efe6da; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
.rueck .sym { font-family: 'Noto Color Emoji'; font-size: 30pt; }
.rueck h2 { font-size: 15pt; margin: 4mm 0 2mm; color: #e8c37a; }
.rueck p { font-size: 8pt; max-width: 100mm; color: #c9bba9; }
"""

ANPASSEN = """<script>/* Bildhöhe je Seite anpassen: bei langem Text wird das Foto kleiner (min. 56 mm), damit nichts abgeschnitten wird */
document.querySelectorAll(".rezept").forEach(function (el) {
  var b = el.querySelector(".bild"), f = el.querySelector(".fuss"), h = 84;
  function zuLang() { var t = el.querySelector(".tipp") || el.querySelector(".schritte"); return t.getBoundingClientRect().bottom > f.getBoundingClientRect().top - 4; }
  while (zuLang() && h > 56) { h -= 2; b.style.height = h + "mm"; }
});</script>"""

STUFE = {1: "★ leicht", 2: "★★ mittel", 3: "★★★ knifflig"}

def fuss(nr, links="Weihnachtliche Naschereien · Köcheclub Werne"):
    return f'<div class="fuss"><span>{links}</span><b>{nr}</b></div>'

def rezeptseite(e, seite, fotos):
    name, farbe = KAPITEL[e["kap"]]
    p = foto_datei(e)
    if p:
        info = fotos.get(e["id"], {})
        cred = " · ".join(x for x in [("KI-Bild" if info.get("art", "").lower().startswith("ki") else ("Foto: " + info["urheber"] if info.get("urheber") else "")), info.get("lizenz", "")] if x)
        bild = f'<img src="fotos/{esc(p.name)}" alt="">' + (f'<span class="credit">{esc(cred)}</span>' if cred else "")
    else:
        bild = f'<div class="platz" style="background:linear-gradient(135deg,{farbe}18,{farbe}38)"><span class="sym">{e["sym"]}</span><span class="hin">Foto folgt · {e["datei_basis"]}</span></div>'
    chips = [f'<span class="chip"><span class="e">⏱️</span> {esc(e["dauer"])}</span>', f'<span class="chip">{STUFE[e["stufe"]]}</span>']
    k = e["kinder"]
    chips.append(f'<span class="chip"><span class="e">👧</span> {"mit Kindern" if k in ("ja", True) else "Kinder mit Hilfe"}</span>')
    if e.get("tuerchen"):
        chips.append(f'<span class="chip"><span class="e">📅</span> Türchen {e["tuerchen"]}</span>')
    if not e["essbar"]:
        chips.append('<span class="chip warn">Nicht zum Essen</span>')
    zut = "".join(f"<li>{esc(z)}</li>" for z in e["z"])
    sch = "".join(f"<li>{esc(s)}</li>" for s in e["s"])
    tipp = f'<div class="tipp"><b>Tipp:</b> {esc(e["tipp"])}</div>' if e.get("tipp") else ""
    if e["herkunft"] == "club":
        herk = "Aus dem Adventskalender der Club-App" + (f" · Anleitung: {esc(domain(e['link']))}" if e.get("link") else "")
    else:
        herk = f"Idee nach: {esc(domain(e['link']))}"
    return (f'<section class="seite rezept" style="--k:{farbe}"><div class="band" style="background:{farbe}"></div>'
            f'<div class="kopf" style="color:{farbe}"><span>{esc(name)}</span><span class="nr">Nr. {e["nr"]}</span></div>'
            f'<div class="bild">{bild}</div><h2 class="titel">{esc(e["t"])}</h2><div class="chips">{"".join(chips)}</div>'
            f'<div class="zut"><h3>{"Zutaten" if e["essbar"] else "Material"}</h3><ul>{zut}</ul></div>'
            f'<div class="schritte"><h3>So geht’s</h3><ol>{sch}</ol></div>{tipp}{fuss(seite, herk)}</section>')

def baue_html(stand, liste, fotos):
    S = []
    titel_bild = "daten/titel-rathaus.jpg"
    S.append(f'''<section class="seite titelseite"><div class="foto" style="background-image:url('{titel_bild}')"></div><div class="schleier"></div>
<div class="text"><div class="ober">Köcheclub Werne · Advent {STAND[-4:]}</div><h1>Weihnachtliche<br>Naschereien</h1>
<div class="unter">{len(liste)} Bastelanleitungen zum Naschen und Schmücken –<br>aus dem Adventskalender der Club-App und weitere Ideen.</div>
<div class="marke">Heft {HEFT_VERSION} · Stand {STAND}</div></div></section>''')
    n_club = sum(1 for e in liste if e["herkunft"] == "club"); n_netz = len(liste) - n_club
    n_fotos = sum(1 for e in liste if foto_datei(e))
    S.append(f'''<section class="seite text"><h1>Hallo und schöne Adventszeit!</h1>
<p>In der Club-App öffnet sich vom 1. bis 24. Dezember jeden Tag ein Türchen – mit kleinen Naschereien zum Selberbauen, Bastelideen und Deko. Damit nichts davon verloren geht, stehen hier <b>alle {n_club} Anleitungen aus dem Adventskalender</b> in einem Heft – dazu <b>{n_netz} weitere Ideen</b>, die gut dazu passen.</p>
<h3>So ist das Heft aufgebaut</h3>
<ul><li>Jede Anleitung hat <b>eine eigene Seite</b> mit Foto, Zutaten und Schritten.</li>
<li>Die Zeichen oben zeigen <b>Dauer</b>, <b>Schwierigkeit</b> und ob Kinder <b>allein</b> oder <b>mit Hilfe</b> mitmachen können.</li>
<li><b>📅 Türchen</b> zeigt, an welchem Tag die Anleitung im Adventskalender der Club-App steckt.</li>
<li>Fast alles klebt mit <b>Zuckerguss</b> oder <b>Schokolade</b>. Wie das gelingt, steht einmal vorne auf der Seite „Grundrezepte“.</li>
<li>Hinten gibt es eine <b>Einkaufsliste</b> zum Abhaken und Platz für eigene Notizen.</li></ul>
<h3>Bitte beachten</h3>
<ul><li>Bei <b>echten Flammen</b> (Mandarinen-Licht, Windlicht) nie unbeaufsichtigt brennen lassen.</li>
<li>Anleitungen im lila Kapitel sind <b>nicht zum Essen</b> – auch wenn Nudeln oder Popcorn darin stecken.</li>
<li>Rohes Eiweiß im Guss: für Kinder, Schwangere und Ältere besser den Guss mit Wasser oder Zitronensaft anrühren.</li></ul>
<p style="margin-top:4mm;color:#8a7f76;font-size:7.4pt">Viel Spaß beim Basteln und Naschen!<br>Euer Köcheclub Werne</p>
{fuss(2)}</section>''')
    # Inhalt (2 Seiten)
    seite_von = {}
    erste = 6
    for i, e in enumerate(liste):
        seite_von[e["id"]] = erste + i
    zeilen = []
    for kap, (name, farbe) in KAPITEL.items():
        zeilen.append(f'<div class="kap"><i style="background:{farbe}"></i>{esc(name)}</div>')
        for e in [x for x in liste if x["kap"] == kap]:
            zeilen.append(f'<div class="zeile"><span class="e">{e["sym"]}</span><span class="t">{e["nr"]}. {esc(e["t"])}</span><span class="s">{seite_von[e["id"]]}</span></div>')
    teilung = next(i for i, z in enumerate(zeilen) if "Bäume, Sterne" in z)
    S.append(f'<section class="seite text inhalt"><h1>Inhalt</h1>{"".join(zeilen[:teilung])}{fuss(3)}</section>')
    S.append(f'<section class="seite text inhalt" style="padding-top:14mm">{"".join(zeilen[teilung:])}'
             f'<div class="kap" style="margin-top:4mm"><i style="background:#8a7f76"></i>Zum Schluss</div>'
             f'<div class="zeile"><span class="e">🧾</span><span class="t">Einkaufsliste zum Abhaken</span><span class="s">{erste + len(liste)}</span></div>'
             f'<div class="zeile"><span class="e">📚</span><span class="t">Quellen und Bildnachweis</span><span class="s">{erste + len(liste) + 1}</span></div>{fuss(4)}</section>')
    # Grundrezepte
    S.append(f'''<section class="seite text"><h1>Grundrezepte</h1>
<h3>Zuckerguss als Kleber</h3>
<p><b>250 g Puderzucker</b> mit <b>1 Eiweiß</b> (oder 2–3 EL Wasser bzw. Zitronensaft) glatt rühren. Zum <b>Kleben</b> muss der Guss so dick wie Zahnpasta sein – er darf nicht vom Löffel laufen. Zum <b>Verzieren</b> tropfenweise Wasser dazugeben.</p>
<ul><li>Guss trocknet an der Luft schnell: Schüssel mit einem feuchten Tuch abdecken.</li><li>Geklebte Teile 10–30 Minuten stützen (Gläser, Tassen), bis der Guss hält.</li><li>Für Farbe ein paar Tropfen Lebensmittelfarbe einrühren.</li></ul>
<h3>Schokolade schmelzen</h3>
<p>Schokolade grob hacken und in einer Schüssel über einen Topf mit <b>heißem, nicht kochendem</b> Wasser stellen. Rühren, bis alles geschmolzen ist. Es darf <b>kein Wasser</b> in die Schokolade kommen, sonst wird sie klumpig. In der Mikrowelle: in Abständen von 20 Sekunden erwärmen und jedes Mal umrühren.</p>
<h3>Spritzbeutel in einer Minute</h3>
<p>Guss oder Schokolade in einen <b>Gefrierbeutel</b> füllen, oben verdrehen und an einer Ecke ein <b>winziges</b> Stück abschneiden. Lieber zu klein anfangen – nachschneiden geht immer.</p>
<h3>Aufbewahren</h3>
<ul><li>Naschereien mit Sahne oder frischem Obst gleich essen oder kühl stellen.</li><li>Alles mit Guss und Schokolade hält in einer Dose einige Tage.</li></ul>
{fuss(5)}</section>''')
    return S, seite_von

def montiere(stand, liste, fotos):
    S, _ = baue_html(stand, liste, fotos)
    # Seitenzahlen: Titel 1, Vorwort 2, Inhalt 3-4, Grundrezepte 5, Rezepte ab 6
    start = 6
    for i, e in enumerate(liste):
        S.append(rezeptseite(e, start + i, fotos))
    s_einkauf = start + len(liste)
    # Einkaufsliste
    posten = []
    for anzeige, muster in EINKAUF:
        rx = re.compile(muster, re.I)
        nrn = [e["nr"] for e in liste if e["essbar"] and any(rx.search(z) for z in e["z"])]
        if nrn:
            posten.append((anzeige, nrn))
    pz = "".join(f'<div class="p"><span class="box"></span><span>{esc(a)}<small>für Nr. {", ".join(map(str, n))}</small></span></div>' for a, n in posten)
    S.append(f'<section class="seite text einkauf"><h1>Einkaufsliste</h1><p style="font-size:7.6pt">Die Grundzutaten für alle Naschereien – mit den Nummern, für die du sie brauchst. Genaue Mengen stehen bei jeder Anleitung.</p><div class="liste">{pz}</div>{fuss(s_einkauf)}</section>')
    # Quellen + Bildnachweis
    q = []
    for e in liste:
        teile = []
        if e["herkunft"] == "club":
            teile.append("Club-App-Adventskalender" + (f" (Türchen {e['tuerchen']})" if e.get("tuerchen") else " (Fach „Alle Naschereien“)"))
        if e.get("link"):
            teile.append(("Anleitung: " if e["herkunft"] == "club" else "Idee nach: ") + e["link"])
        info = fotos.get(e["id"], {})
        if foto_datei(e):
            if info.get("art", "").lower().startswith("ki"):
                teile.append("Bild: KI-generiert" + (f" ({info['quelle']})" if info.get("quelle") else ""))
            else:
                teile.append("Foto: " + ", ".join(x for x in [info.get("urheber"), info.get("lizenz"), info.get("quelle")] if x))
        else:
            teile.append("Foto: folgt")
        q.append(f'<div class="q"><b>{e["nr"]}. {esc(e["t"])}</b> – {esc(" · ".join(teile))}</div>')
    mitte = (len(q) + 1) // 2
    S.append(f'<section class="seite text quellen"><h1 style="font-size:16pt">Quellen und Bildnachweis</h1><p>Texte: eigene Fassung des Köcheclubs. Fotos: frei lizenziert, Urheber und Lizenz wie angegeben. Titelbild: Rathaus-Gestaltung aus dem Club-App-Adventskalender.</p>{"".join(q[:mitte])}{fuss(s_einkauf + 1)}</section>')
    S.append(f'<section class="seite text quellen" style="padding-top:14mm">{"".join(q[mitte:])}{fuss(s_einkauf + 2)}</section>')
    # auffüllen auf Vielfaches von 4 (Heft), Rückseite zuletzt
    gesamt = len(S) + 1
    notizen = (-gesamt) % 4
    for k in range(notizen):
        S.append(f'<section class="seite text notiz"><h1 style="font-size:16pt">Notizen</h1><div class="linien"></div>{fuss(len(S) + 1)}</section>')
    S.append('<section class="seite rueck"><div class="sym">🎄🍪⭐</div><h2>Frohe Weihnachten!</h2><p>Köcheclub Werne<br>Weihnachtliche Naschereien · Heft ' + HEFT_VERSION + '</p></section>')
    return S

def chatgpt_auftrag(liste):
    # fotos/AUFTRAG-CHATGPT.md: zum Kopieren in ChatGPT – sucht freie Fotos und liefert eine fertige quellen.csv
    z = "\n".join(f"{e['datei_basis']} | {e['t']} | {e['such_en']}" for e in liste)
    txt = f"""# Fotos für das Heft „Weihnachtliche Naschereien“ mit ChatGPT besorgen

So gehst du vor:

1. ChatGPT öffnen (am besten mit Websuche, also das Symbol 🌐 „Suche“ einschalten).
2. Den **ganzen Kasten unten** kopieren und in ChatGPT einfügen.
3. ChatGPT arbeitet die Liste in Portionen ab (z. B. 10 Fotos pro Antwort). Schreibe danach jeweils **„weiter“**.
4. Die Bilder herunterladen und genau so benennen, wie in der ersten Spalte steht (z. B. `01-hexenhaus.jpg`).
5. Alle Bilder **und** die Tabelle (quellen.csv) an Claude geben. Claude legt sie in `docs/advent-naschereien/fotos/` und baut das Heft neu.

Wichtig: Nur Fotos mit freier Lizenz. Fotos von Rezeptseiten (lecker.de, Chefkoch, Instagram, Pinterest …) sind **nicht** erlaubt, auch nicht „nur für den Verein“.

```
Du hilfst mir, freie Fotos für ein Bastelheft unseres Vereins (Köcheclub, nicht kommerziell, wird gedruckt und als PDF weitergegeben) zu finden.

REGELN
- Nur Bilder mit diesen Lizenzen: CC0 / Public Domain, CC BY, CC BY-SA, Pixabay-Lizenz, Unsplash-Lizenz, Pexels-Lizenz.
- Erlaubte Quellen: commons.wikimedia.org, openverse.org, pixabay.com, unsplash.com, pexels.com, flickr.com (nur CC-Lizenzen).
- Verboten: Fotos von Rezept- oder Shop-Seiten, Pinterest, Instagram, Google-Bildersuche ohne Lizenzangabe, Bilder mit Wasserzeichen.
- Das Foto soll möglichst genau das fertige Ergebnis zeigen. Wenn es das nicht frei gibt, nimm ein Foto, das gut passt (z. B. die Hauptzutat oder etwas sehr Ähnliches), und schreibe in die Spalte "art" das Wort "ähnlich".
- Gibt es gar nichts Passendes, schreibe "keins".
- Querformat bevorzugt, mindestens 1200 Pixel breit.
- Erfinde nie einen Link oder Urheber. Jede Angabe muss von der Bildseite stammen.

AUSGABE
Gib mir für jede Zeile:
1. den direkten Link zur Bildseite (nicht nur zur Datei),
2. den direkten Download-Link,
3. eine Zeile für die Tabelle quellen.csv in genau diesem Format (Semikolon getrennt):
id;nr;titel;suchbegriff_de;suchbegriff_en;datei;art;urheber;lizenz;quelle
- datei = Dateiname aus meiner Liste + Endung (z. B. 01-hexenhaus.jpg)
- art = foto | ähnlich | keins
- urheber = Name wie auf der Bildseite
- lizenz = z. B. CC BY 2.0, CC0, Pixabay-Lizenz
- quelle = Link zur Bildseite
Am Ende jeder Portion alle CSV-Zeilen noch einmal zusammen in einem Kasten, damit ich sie kopieren kann.

MEINE LISTE (Dateiname | Titel | englischer Suchbegriff)
{z}
```

## Alternative für Lücken: Bild von ChatGPT erzeugen lassen

Für Motive, die es nirgends frei gibt (z. B. „Schneemann aus Pfeffernüssen“), kann ChatGPT ein Bild **erzeugen**.
Dann im Bildnachweis „KI-Bild“ angeben. Vorlage zum Kopieren (Titel und Zutaten von der Heftseite einsetzen):

```
Erzeuge ein realistisches Foto, Querformat 3:2: <TITEL> – selbst gebastelt aus <ZUTATEN>.
Natürliches Tageslicht, heller Holztisch, etwas Tannengrün und Puderzucker im Hintergrund, leicht unscharf.
Keine Personen, keine Schrift, keine Markenlogos. Es soll aussehen wie zu Hause von einer Familie gebastelt, nicht wie aus einer Konditorei.
```

In der Tabelle dann: `art` = `ki`, `urheber` = `ChatGPT`, `lizenz` = `KI-generiert`, `quelle` leer lassen.
"""
    (HIER / "fotos/AUFTRAG-CHATGPT.md").write_text(txt, encoding="utf-8")

def main():
    stand, liste = lade()
    fotos = fotos_lesen()
    quellen_vorlage(liste, fotos)
    chatgpt_auftrag(liste)
    S = montiere(stand, liste, fotos)
    html_txt = f'<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Weihnachtliche Naschereien</title><style>{CSS}</style></head><body>{"".join(S)}{ANPASSEN}</body></html>'
    (HIER / "naschereien.html").write_text(html_txt, encoding="utf-8")
    (HIER / "fotos/liste.json").write_text(json.dumps([{"nr": e["nr"], "id": e["id"], "datei": e["datei_basis"], "titel": e["t"], "suchbegriff_en": e["such_en"], "essbar": e["essbar"]} for e in liste], ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"HTML: {len(S)} Seiten, {len(liste)} Anleitungen, Fotos vorhanden: {sum(1 for e in liste if foto_datei(e))}")
    if "--nur-html" in sys.argv:
        return
    subprocess.run(["node", str(HIER / "drucken.cjs")], check=True)
    heft()

def heft():
    # Broschüre: A5-Seiten paarweise auf A4 quer, Reihenfolge für Rückenheftung (Duplex, an kurzer Kante spiegeln)
    from pypdf import PdfReader, PdfWriter, Transformation
    from pypdf._page import PageObject
    r = PdfReader(str(HIER / "Weihnachtliche-Naschereien-A5.pdf"))
    n = len(r.pages)
    assert n % 4 == 0, f"Seitenzahl {n} ist kein Vielfaches von 4"
    w = PdfWriter()
    b = float(r.pages[0].mediabox.width); h = float(r.pages[0].mediabox.height)
    for s in range(n // 4):
        for links, rechts in ((n - 1 - 2 * s, 2 * s), (2 * s + 1, n - 2 - 2 * s)):
            blatt = PageObject.create_blank_page(width=2 * b, height=h)
            blatt.merge_transformed_page(r.pages[links], Transformation())
            blatt.merge_transformed_page(r.pages[rechts], Transformation().translate(b, 0))
            w.add_page(blatt)
    w.compress_identical_objects(remove_duplicates=True, remove_unreferenced=True)
    with open(HIER / "Weihnachtliche-Naschereien-Heft-A4-Druck.pdf", "wb") as f:
        w.write(f)
    print(f"Heft: {n // 4} Blätter A4 quer ({n // 2} Druckseiten)")

if __name__ == "__main__":
    main()
