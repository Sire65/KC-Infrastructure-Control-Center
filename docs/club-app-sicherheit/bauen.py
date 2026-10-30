# Baut die Mitglieder-Info "Sicherheit & Datenschutz der Club-App" als HTML (danach PDF ueber drucken.mjs).
# Alle Zahlen stammen aus den Doku-Dateien von KICC und KC-Clubapp (Stand siehe STAND), nichts ist geschaetzt.
import math, pathlib

STAND = "30.10.2026"
HIER = pathlib.Path(__file__).parent

# Farben: Club (Weinrot/Beige) fuer Rahmen und Ueberschriften, Diagramm-Reihen aus der gepruefte Palette
WEIN, WEIN2, BEIGE, BEIGE2 = "#7a1f2b", "#a33a48", "#f6efe4", "#ecdfcb"
S1, S2, S3, GRAU = "#2a78d6", "#eb6834", "#1baf7a", "#c9c6bd"
GUT, WARN = "#0ca30c", "#fab219"
TEXT, TEXT2, MUTED, LINIE = "#1f1b18", "#52514e", "#77736c", "#e2dccf"


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ---------- Diagramme ----------
def donut(teile, mitte_gross, mitte_klein, titel_aria):
    """teile = [(wert, farbe, beschriftung)]; 2px Luecke zwischen den Segmenten."""
    r, dicke, cx, cy = 70, 26, 90, 90
    summe = sum(t[0] for t in teile)
    umfang = 2 * math.pi * r
    luecke = 2.5
    out, start = [], 0.0
    for wert, farbe, _ in teile:
        laenge = umfang * wert / summe
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{farbe}" stroke-width="{dicke}" '
                   f'stroke-dasharray="{max(laenge - luecke, 0.5):.2f} {umfang:.2f}" stroke-dashoffset="{-start:.2f}" '
                   f'transform="rotate(-90 {cx} {cy})"/>')
        start += laenge
    out.append(f'<text x="{cx}" y="{cy + 2}" text-anchor="middle" class="d-gross">{esc(mitte_gross)}</text>')
    out.append(f'<text x="{cx}" y="{cy + 22}" text-anchor="middle" class="d-klein">{esc(mitte_klein)}</text>')
    leg = "".join(f'<li><span class="pkt" style="background:{f}"></span><b>{esc(w if isinstance(w, str) else fmt(w))}</b> {esc(b)}</li>'
                  for w, f, b in [(t[0], t[1], t[2]) for t in teile])
    return (f'<div class="donut"><svg viewBox="0 0 180 180" width="170" height="170" role="img" aria-label="{esc(titel_aria)}">'
            + "".join(out) + f'</svg><ul class="legende">{leg}</ul></div>')


def fmt(w):
    return f"{w:g}".replace(".", ",")


def balken_h(zeilen, max_wert, einheit, farbe):
    """Waagerechte Balken, eine Reihe: zeilen = [(name, wert, zusatz)]"""
    b, links, zh = 640, 210, 40
    h = len(zeilen) * zh + 30
    breite = b - links - 70
    out = []
    for i in range(0, max_wert + 1, 5):
        x = links + breite * i / max_wert
        out.append(f'<line x1="{x:.1f}" y1="6" x2="{x:.1f}" y2="{h - 22}" class="gitter"/>'
                   f'<text x="{x:.1f}" y="{h - 6}" text-anchor="middle" class="achse">{i}</text>')
    for n, (name, wert, zusatz) in enumerate(zeilen):
        y = 10 + n * zh
        w = breite * wert / max_wert
        out.append(f'<text x="{links - 10}" y="{y + 14}" text-anchor="end" class="lab">{esc(name)}</text>')
        out.append(f'<text x="{links - 10}" y="{y + 28}" text-anchor="end" class="lab2">{esc(zusatz)}</text>')
        out.append(f'<path d="M{links},{y + 4} h{w - 4:.1f} a4,4 0 0 1 4,4 v14 a4,4 0 0 1 -4,4 h{-(w - 4):.1f} z" fill="{farbe}"/>')
        out.append(f'<text x="{links + w + 8:.1f}" y="{y + 20}" class="wert">{wert} {esc(einheit or ("Stand" if wert == 1 else "Stände"))}</text>')
    out.append(f'<line x1="{links}" y1="6" x2="{links}" y2="{h - 22}" class="basis"/>')
    return f'<svg viewBox="0 0 {b} {h}" width="100%" role="img" aria-label="Balkendiagramm">' + "".join(out) + "</svg>"


def saeulen(spalten, max_wert, schritt, farbe):
    """Senkrechte Saeulen, eine Reihe: spalten = [(name, wert, zusatz)]"""
    b, h, unten, links = 640, 250, 200, 50
    breite = b - links - 20
    out = []
    for i in range(0, max_wert + 1, schritt):
        y = unten - (unten - 20) * i / max_wert
        out.append(f'<line x1="{links}" y1="{y:.1f}" x2="{b - 20}" y2="{y:.1f}" class="gitter"/>'
                   f'<text x="{links - 8}" y="{y + 4:.1f}" text-anchor="end" class="achse">{i}</text>')
    fach = breite / len(spalten)
    sb = min(70, fach * 0.45)
    for n, (name, wert, zusatz) in enumerate(spalten):
        x = links + fach * n + (fach - sb) / 2
        hh = (unten - 20) * wert / max_wert
        y = unten - hh
        out.append(f'<path d="M{x:.1f},{unten} v{-(hh - 4):.1f} a4,4 0 0 1 4,-4 h{sb - 8:.1f} a4,4 0 0 1 4,4 v{hh - 4:.1f} z" fill="{farbe}"/>')
        out.append(f'<text x="{x + sb / 2:.1f}" y="{y - 8:.1f}" text-anchor="middle" class="wert">{wert}</text>')
        out.append(f'<text x="{x + sb / 2:.1f}" y="{unten + 18}" text-anchor="middle" class="lab">{esc(name)}</text>')
        out.append(f'<text x="{x + sb / 2:.1f}" y="{unten + 34}" text-anchor="middle" class="lab2">{esc(zusatz)}</text>')
    out.append(f'<line x1="{links}" y1="{unten}" x2="{b - 20}" y2="{unten}" class="basis"/>')
    return f'<svg viewBox="0 0 {b} {h}" width="100%" role="img" aria-label="Saeulendiagramm">' + "".join(out) + "</svg>"


def saegezahn():
    """Alter der Spiegel-Kopie ueber einen Tag (deutsche Winterzeit). Kopie um 5:10, 11:10, 17:10, 23:10 Uhr."""
    b, h, links, unten, oben = 640, 250, 50, 200, 24
    breite = b - links - 20
    X = lambda std: links + breite * std / 24
    Y = lambda alter: unten - (unten - oben) * alter / 7
    kopien = [5 + 10 / 60, 11 + 10 / 60, 17 + 10 / 60, 23 + 10 / 60]
    punkte, t, letzte = [], 0.0, -(24 - kopien[-1])
    pfad = [f"M{X(0):.1f},{Y(0 - letzte):.1f}"]
    for k in kopien:
        pfad.append(f"L{X(k):.1f},{Y(k - letzte):.1f}")
        pfad.append(f"L{X(k):.1f},{Y(0):.1f}")
        punkte.append(k)
        letzte = k
    pfad.append(f"L{X(24):.1f},{Y(24 - letzte):.1f}")
    out = []
    for a in range(0, 8):
        out.append(f'<line x1="{links}" y1="{Y(a):.1f}" x2="{b - 20}" y2="{Y(a):.1f}" class="gitter"/>'
                   f'<text x="{links - 8}" y="{Y(a) + 4:.1f}" text-anchor="end" class="achse">{a} h</text>')
    for s in range(0, 25, 3):
        out.append(f'<text x="{X(s):.1f}" y="{unten + 18}" text-anchor="middle" class="achse">{s:02d}:00</text>')
    out.append(f'<line x1="{links}" y1="{Y(6):.1f}" x2="{b - 20}" y2="{Y(6):.1f}" stroke="{WEIN}" stroke-width="1.5" stroke-dasharray="5 4"/>')
    out.append(f'<text x="{b - 22}" y="{Y(6) - 6:.1f}" text-anchor="end" class="lab" fill="{WEIN}">höchstens 6 Stunden alt</text>')
    out.append(f'<path d="{" ".join(pfad)}" fill="none" stroke="{S1}" stroke-width="2" stroke-linejoin="round"/>')
    for k in punkte:
        out.append(f'<circle cx="{X(k):.1f}" cy="{Y(0):.1f}" r="5" fill="{S1}" stroke="#fff" stroke-width="2"/>')
    out.append(f'<line x1="{links}" y1="{unten}" x2="{b - 20}" y2="{unten}" class="basis"/>')
    out.append(f'<text x="{b / 2:.0f}" y="{h - 8}" text-anchor="middle" class="lab2">Uhrzeit (deutsche Winterzeit) · Punkt = neue Kopie fertig</text>')
    return f'<svg viewBox="0 0 {b} {h}" width="100%" role="img" aria-label="Liniendiagramm Alter der Spiegelkopie">' + "".join(out) + "</svg>"


def tagesband():
    """Ein Tag der Datensicherheit als Zeitstrahl (deutsche Winterzeit)."""
    b, links = 680, 150
    breite = b - links - 20
    X = lambda s: links + breite * s / 24
    reihen = [
        ("Zugriffs-Wächter", [(0, 24, "jede Minute")], S1),
        ("Notbetrieb-Paket", [(0, 24, "alle 15 Minuten, nur bei Änderung")], S1),
        ("Spiegel (Neon London)", [(5.08, 5.5, ""), (11.08, 11.5, ""), (17.08, 17.5, ""), (23.08, 23.5, "")], S2),
        ("Tagessicherung Neon", [(1.67, 8.8, "ab 1:40, große Tabellen bis ca. 8:50")], S3),
        ("Sicherung Frankfurt", [(2, 4, "2–4 Uhr")], S3),
        ("Wiederherstellungs-Test", [(7.5, 8.2, "7:30 Uhr")], WEIN),
    ]
    zh = 34
    h = len(reihen) * zh + 40
    out = []
    for s in range(0, 25, 3):
        out.append(f'<line x1="{X(s):.1f}" y1="4" x2="{X(s):.1f}" y2="{h - 26}" class="gitter"/>'
                   f'<text x="{X(s):.1f}" y="{h - 10}" text-anchor="middle" class="achse">{s:02d}:00</text>')
    for n, (name, stuecke, farbe) in enumerate(reihen):
        y = 8 + n * zh
        out.append(f'<text x="{links - 10}" y="{y + 15}" text-anchor="end" class="lab">{esc(name)}</text>')
        for a, e, txt in stuecke:
            w = max(X(e) - X(a), 5)
            deck = "0.35" if (e - a) >= 23 else "1"
            out.append(f'<rect x="{X(a):.1f}" y="{y + 3}" width="{w:.1f}" height="16" rx="4" fill="{farbe}" fill-opacity="{deck}"/>')
            if txt:
                tx = X(a) + 6 if (e - a) >= 23 else X(e) + 6
                out.append(f'<text x="{tx:.1f}" y="{y + 15}" class="lab2" fill="{TEXT}">{esc(txt)}</text>')
    return f'<svg viewBox="0 0 {b} {h}" width="100%" role="img" aria-label="Tagesablauf der Datensicherheit">' + "".join(out) + "</svg>"


def schaubild():
    """Wer schiebt welche Daten wohin."""
    def box(x, y, w, h, titel, zeilen, art="normal"):
        stile = {"normal": ("#fff", WEIN), "kern": (BEIGE, WEIN), "kopie": ("#fff", S1), "cf": ("#fff", S2), "leise": ("#fff", GRAU)}
        fuell, rand = stile[art]
        s = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fuell}" stroke="{rand}" stroke-width="2"/>',
             f'<text x="{x + w / 2}" y="{y + 20}" text-anchor="middle" class="sb-titel">{esc(titel)}</text>']
        for i, z in enumerate(zeilen):
            s.append(f'<text x="{x + w / 2}" y="{y + 38 + i * 15}" text-anchor="middle" class="sb-text">{esc(z)}</text>')
        return "".join(s)

    def pfeil(d, art="daten", beide=False):
        cls = {"daten": "pf-daten", "kopie": "pf-kopie", "prog": "pf-prog", "cf": "pf-cf"}[art]
        mk = {"daten": "mW", "kopie": "mB", "prog": "mG", "cf": "mO"}[art]
        return f'<path d="{d}" class="{cls}" marker-end="url(#{mk})"' + (f' marker-start="url(#{mk}s)"' if beide else "") + "/>"

    def schild(x, y, txt, w=None):
        w = w or len(txt) * 5.6 + 12
        return (f'<rect x="{x - w / 2:.1f}" y="{y - 10}" width="{w:.1f}" height="16" rx="8" fill="#fff" stroke="{LINIE}"/>'
                f'<text x="{x}" y="{y + 2}" text-anchor="middle" class="sb-schild">{esc(txt)}</text>')

    def marker(id_, farbe, start=False):
        pts = "10,0 0,5 10,10" if start else "0,0 10,5 0,10"
        return (f'<marker id="{id_}" viewBox="0 0 10 10" refX="{0 if start else 10}" refY="5" markerWidth="7" markerHeight="7" orient="auto">'
                f'<polygon points="{pts}" fill="{farbe}"/></marker>')

    defs = "<defs>" + "".join(marker(i, f) + marker(i + "s", f, True) for i, f in
                              [("mW", WEIN), ("mB", S1), ("mG", MUTED), ("mO", S2)]) + "</defs>"
    t = [defs]
    t.append(box(300, 6, 200, 50, "GitHub Pages", ["nur das App-Programm – keine Daten"], "leise"))
    t.append(box(16, 90, 230, 80, "Du (Handy / Tablet)", ["Zusagen, Nachrichten, Fotos,", "Status, Änderungsmeldungen"]))
    t.append(box(554, 90, 230, 80, "Clubleitung", ["Mitgliederpflege, Termine,", "Änderungen eintragen"]))
    t.append(box(270, 196, 260, 84, "Club-Server  (Türsteher)", ["prüft bei JEDER Anfrage:", "Wer bist du?  Darfst du das?"], "kern"))
    t.append(box(16, 210, 190, 60, "Benachrichtigung", ["Push oder E-Mail: „Neue", "Nachricht“ – Hinweis"], "leise"))
    t.append(box(594, 206, 190, 70, "Notbetrieb (Cloudflare)", ["Lesekopie, signiert,", "alle 15 Minuten"], "cf"))
    t.append(box(250, 326, 300, 80, "Datenbank Supabase (London)", ["das Original · verschlüsselt gespeichert", "von außen nur über den Club-Server"], "kern"))
    t.append(box(594, 330, 190, 70, "Tresor (Cloudflare)", ["Kopie des Sicherungs-", "Schlüssels für den Notfall"], "cf"))
    unten = [("Spiegel (Neon London)", ["alle 6 Stunden", "Personendaten gekürzt"], "kopie"),
             ("Tagessicherung (Neon)", ["täglich, verschlüsselt,", "nicht änderbar"], "kopie"),
             ("Sicherung Frankfurt", ["täglich, verschlüsselt,", "14 Tagesstände"], "kopie"),
             ("Zweitkopie (Cloudflare)", ["wöchentlich, verschlüsselt,", "5 Wochenstände"], "cf")]
    xs = [16, 210, 404, 598]
    for x, (ti, z, a) in zip(xs, unten):
        t.append(box(x, 476, 186, 84, ti, z, a))
    # Pfeile
    t.append(pfeil("M300,31 C200,31 150,50 131,88", "prog"))
    t.append(pfeil("M500,31 C600,31 650,50 669,88", "prog"))
    t.append(schild(400, 74, "Programm laden (ohne Daten)"))
    t.append(pfeil("M200,170 C220,200 240,220 268,232", "daten", True))
    t.append(schild(176, 192, "verschlüsselt (TLS)", 110))
    t.append(pfeil("M600,170 C580,200 560,220 532,232", "daten", True))
    t.append(schild(624, 192, "verschlüsselt (TLS)", 110))
    t.append(pfeil("M270,240 L208,240", "daten"))
    t.append(pfeil("M530,240 L592,240", "cf"))
    t.append(pfeil("M400,282 L400,324", "daten", True))
    t.append(schild(400, 304, "nur geprüfte Anfragen", 124))
    t.append(pfeil("M550,366 L592,366", "cf"))
    for x in xs:
        cx = x + 93
        if cx == 691:
            continue
        t.append(pfeil(f"M400,408 L400,436 L{cx},436 L{cx},474", "kopie"))
    t.append(schild(260, 436, "automatische Kopien", 118))
    t.append(pfeil("M303,562 L303,586 L691,586 L691,562", "cf"))
    t.append(schild(497, 586, "wöchentlich – bleibt verschlüsselt", 190))
    return '<svg viewBox="0 0 800 600" width="100%" role="img" aria-label="Schaubild Datenwege">' + "".join(t) + "</svg>"


# ---------- Inhalt ----------
J, N, T = '<span class="ja">✔ ja</span>', '<span class="nein">✘ nein</span>', lambda s: f'<span class="teil">◐ {s}</span>'

SICHT = [
    ("Name, Bild, Status (z. B. „im Urlaub“)", J, J, J),
    ("Handy, Festnetz, E-Mail, Adresse", J, T("nur, wenn du es erlaubst"), J),
    ("Geburtstag", J, T("nur Tag + Monat, wenn erlaubt"), T("Alter nur bei runden Geburtstagen, wenn erlaubt")),
    ("Notfallkontakt", J, N, T("Clubsprecher + Kassenwart")),
    ("Notfallpass (Allergien, Medikamente)", T("nur auf deinem Handy"), N, N),
    ("Chat-Nachrichten und Anhänge", J, T("nur Teilnehmer der Unterhaltung"), T("nur, wenn sie Teilnehmer sind")),
    ("Fotoalbum", J, T("Club-Album: ja · privates Album: nein"), T("Club-Album: ja · privates Album: nein")),
    ("Zu-/Absage zu Terminen", J, J, J),
    ("Eigene Dienstzeiten", J, T("nur mit deiner Freigabe (Standard: aus)"), J),
    ("Online / zuletzt da / Tippen", J, T("nur, wenn eingeschaltet"), T("wie Mitglieder")),
    ("Wie du geheim abgestimmt hast", T("nur, dass du abgestimmt hast"), N, N),
    ("Bankverbindung (zurzeit nicht abgefragt)", J, N, T("nur Kassenwart")),
]

DSGVO = [
    ("Art. 15", "Auskunft", "Kachel „Meine Daten“ zeigt alles, was über dich gespeichert ist – jederzeit, ohne Antrag."),
    ("Art. 16", "Berichtigung", "„Meine Daten haben sich geändert“: Meldung geht automatisch an die zuständigen Ämter."),
    ("Art. 17", "Löschung", "Austritt oder Löschwunsch über die Änderungsmeldung bzw. bei der Clubleitung; der Zugang wird abgeschaltet."),
    ("Art. 20", "Daten mitnehmen", "„Meine Daten“ lässt sich ausdrucken oder als Datei sichern."),
    ("Art. 21", "Widerspruch", "Sichtbarkeit von Kontakt, Geburtstag, Online-Status, Dienstzeiten selbst ausschalten."),
    ("Art. 25", "Datenschutz durch Voreinstellung", "Heikle Schalter stehen ab Werk auf AUS (z. B. Live-Tippen, Dienstzeiten für andere)."),
    ("Art. 5", "Datensparsamkeit", "Spiegel enthält Personendaten nur gekürzt; Bankverbindung wird zurzeit gar nicht abgefragt."),
    ("Art. 32", "Sicherheit der Verarbeitung", "Verschlüsselte Übertragung und Speicherung, Rechteprüfung bei jeder Anfrage, Sicherungen mit täglichem Test."),
    ("Art. 33", "Pannen erkennen und melden", "Wächter melden neue Geräte, neue Konten und Angriffsversuche sofort an den Admin."),
]

CSS = f"""
@page {{ size: A4; margin: 14mm 15mm 16mm 15mm; }}
:root {{ --wein:{WEIN}; --beige:{BEIGE}; --beige2:{BEIGE2}; --text:{TEXT}; --text2:{TEXT2}; --muted:{MUTED}; --linie:{LINIE}; }}
* {{ box-sizing: border-box; }}
html {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
body {{ margin:0; font-family: Inter, "DejaVu Sans", sans-serif; color: var(--text); font-size: 10.4pt; line-height: 1.45; background:#fff; }}
h1 {{ font-size: 27pt; line-height:1.1; margin: 0 0 6px; color: var(--wein); letter-spacing:-.5px; }}
h2 {{ font-size: 17pt; color: var(--wein); margin: 0 0 4px; letter-spacing:-.2px; }}
h3 {{ font-size: 11.5pt; margin: 14px 0 4px; }}
p {{ margin: 4px 0 8px; }}
.seite {{ break-after: page; }}
.seite:last-child {{ break-after: auto; }}
.unter {{ color: var(--text2); margin-bottom: 12px; font-size: 10.5pt; }}
.kopf {{ display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--wein); padding-bottom:4px; margin-bottom:14px; font-size:8.5pt; color:var(--muted); }}
.titelbild {{ background: var(--wein); color:#fff; border-radius:16px; padding: 20px 24px 14px; margin-bottom: 12px; }}
.titelbild h1 {{ color:#fff; }}
.titelbild p {{ color:#f3dfe2; font-size: 11.5pt; }}
.schloss {{ font-size: 34pt; float:right; line-height:1; }}
.kern {{ display:grid; grid-template-columns: 1fr 1fr; gap: 8px; }}
.seite1 .karte {{ padding: 9px 12px; font-size: 9.8pt; }}
.seite1 .kpis {{ margin: 10px 0; }}
.seite1 h1 {{ font-size: 24pt; }}
.karte {{ background: var(--beige); border-radius: 12px; padding: 12px 14px; break-inside: avoid; }}
.karte b.gross {{ display:block; font-size: 11.5pt; color: var(--wein); margin-bottom:2px; }}
.karte.weiss {{ background:#fff; border:1.5px solid var(--beige2); }}
.zahl {{ font-size: 24pt; font-weight: 700; color: var(--wein); line-height:1; }}
.kpis {{ display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0; }}
.kpis .karte {{ text-align:center; padding: 12px 8px; }}
.kpis small {{ display:block; color: var(--text2); font-size: 8.6pt; margin-top: 4px; line-height:1.3; }}
.ampel {{ width:100%; border-collapse: collapse; font-size: 9.6pt; }}
.ampel td {{ padding: 6px 8px; border-bottom: 1px solid var(--linie); vertical-align: top; }}
.ampel td:first-child {{ width: 26%; font-weight:600; }}
table.sicht {{ width:100%; border-collapse: collapse; font-size: 8.8pt; }}
table.sicht th {{ background: var(--wein); color:#fff; text-align:left; padding: 6px 6px; font-weight:600; }}
table.sicht td {{ padding: 5px 6px; border-bottom: 1px solid var(--linie); vertical-align: top; }}
table.sicht tr:nth-child(even) td {{ background: #fbf8f2; }}
.ja {{ color: #0a7a0a; font-weight:600; }} .nein {{ color: #b3261e; font-weight:600; }} .teil {{ color: #8a5a00; }}
.fuss {{ font-size: 8.4pt; color: var(--muted); margin-top: 6px; }}
.zwei {{ display:grid; grid-template-columns: 1fr 1fr; gap: 14px; }}
.diagramm {{ border: 1.5px solid var(--beige2); border-radius: 12px; padding: 12px 14px 8px; margin: 10px 0; break-inside: avoid; }}
.diagramm h3 {{ margin: 0 0 2px; }}
.diagramm .was {{ color: var(--text2); font-size: 9pt; margin: 0 0 6px; }}
svg text {{ font-family: Inter, "DejaVu Sans", sans-serif; }}
.gitter {{ stroke: #ece8df; stroke-width: 1; }}
.basis {{ stroke: #9b968c; stroke-width: 1.2; }}
.achse {{ font-size: 10px; fill: {MUTED}; }}
.lab {{ font-size: 11.5px; fill: {TEXT}; font-weight: 600; }}
.lab2 {{ font-size: 10px; fill: {TEXT2}; }}
.wert {{ font-size: 12px; fill: {TEXT}; font-weight: 700; }}
.d-gross {{ font-size: 26px; font-weight: 700; fill: {WEIN}; }}
.d-klein {{ font-size: 10.5px; fill: {TEXT2}; }}
.donut {{ display:flex; align-items:center; gap: 10px; }}
.legende {{ list-style:none; margin:0; padding:0; font-size: 9pt; }}
.legende li {{ margin: 4px 0; }}
.pkt {{ display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:6px; vertical-align: -1px; }}
.sb-titel {{ font-size: 12.5px; font-weight: 700; fill: {TEXT}; }}
.sb-text {{ font-size: 10.5px; fill: {TEXT2}; }}
.sb-schild {{ font-size: 9.5px; fill: {TEXT}; font-weight:600; }}
.pf-daten {{ fill:none; stroke: {WEIN}; stroke-width: 2.2; }}
.pf-kopie {{ fill:none; stroke: {S1}; stroke-width: 2; stroke-dasharray: 7 4; }}
.pf-cf {{ fill:none; stroke: {S2}; stroke-width: 2; stroke-dasharray: 3 3; }}
.pf-prog {{ fill:none; stroke: {MUTED}; stroke-width: 1.5; stroke-dasharray: 2 3; }}
.zeichen {{ display:flex; flex-wrap: wrap; gap: 14px; font-size: 9pt; color: var(--text2); margin-top: 4px; }}
.zeichen span::before {{ content:""; display:inline-block; width: 28px; height: 0; margin-right: 6px; vertical-align: middle; }}
.z-daten::before {{ border-top: 2.5px solid {WEIN}; }}
.z-kopie::before {{ border-top: 2.5px dashed {S1}; }}
.z-cf::before {{ border-top: 2.5px dotted {S2}; }}
.z-prog::before {{ border-top: 2px dotted {MUTED}; }}
.liste {{ margin: 4px 0 8px; padding-left: 18px; }}
.liste li {{ margin: 3px 0; }}
.hinweis {{ border-left: 4px solid {WARN}; background: #fff8e6; padding: 10px 12px; border-radius: 0 10px 10px 0; margin: 10px 0; break-inside: avoid; }}
.gut {{ border-left: 4px solid {GUT}; background: #eef8ee; padding: 10px 12px; border-radius: 0 10px 10px 0; margin: 10px 0; break-inside: avoid; }}
table.dsgvo {{ width:100%; border-collapse: collapse; font-size: 9.4pt; }}
table.dsgvo td {{ padding: 6px 7px; border-bottom: 1px solid var(--linie); vertical-align: top; }}
table.dsgvo td:first-child {{ white-space: nowrap; color: var(--wein); font-weight:700; width: 52px; }}
table.dsgvo td:nth-child(2) {{ font-weight:600; width: 150px; }}
.schritt {{ display:grid; grid-template-columns: 34px 1fr; gap: 8px; margin: 8px 0; break-inside: avoid; }}
.schritt .nr {{ width: 30px; height: 30px; border-radius: 50%; background: var(--wein); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; }}
"""


def kreislauf():
    """Pruef-Kreislauf: Pruefen -> Finden -> Beheben -> Testen -> Einspielen"""
    schritte = [("1 · Prüfen", "KI liest das ganze Programm"), ("2 · Finden", "Lücken, Logikfehler,", ), ("3 · Beheben", "Fehler an der Quelle"), ("4 · Testen", "automatische Tests"), ("5 · Einspielen", "nur mit Freigabe")]
    zweite = ["", "umständliche Bedienung", "", "rot = kein Update", "als neue Version"]
    cx, cy, r = 320, 200, 140
    out = [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{BEIGE2}" stroke-width="10"/>']
    for i, (t, u) in enumerate(schritte):
        w = -math.pi / 2 + 2 * math.pi * i / 5
        x, y = cx + r * math.cos(w), cy + r * math.sin(w)
        w2 = w + 2 * math.pi / 10
        ax, ay = cx + r * math.cos(w2), cy + r * math.sin(w2)
        out.append(f'<polygon points="-7,-6 7,0 -7,6" fill="{WEIN}" transform="translate({ax:.1f},{ay:.1f}) rotate({math.degrees(w2) + 90:.1f})"/>')
        out.append(f'<rect x="{x - 78:.1f}" y="{y - 26:.1f}" width="156" height="52" rx="12" fill="#fff" stroke="{WEIN}" stroke-width="2"/>')
        out.append(f'<text x="{x:.1f}" y="{y - 8:.1f}" text-anchor="middle" class="lab" fill="{WEIN}">{esc(t)}</text>')
        out.append(f'<text x="{x:.1f}" y="{y + 7:.1f}" text-anchor="middle" class="lab2">{esc(u)}</text>')
        if zweite[i]:
            out.append(f'<text x="{x:.1f}" y="{y + 19:.1f}" text-anchor="middle" class="lab2">{esc(zweite[i])}</text>')
    out.append(f'<text x="{cx}" y="{cy - 4}" text-anchor="middle" class="d-gross">immer</text>')
    out.append(f'<text x="{cx}" y="{cy + 18}" text-anchor="middle" class="d-klein">wieder von vorn</text>')
    return '<svg viewBox="100 28 440 320" width="100%" role="img" aria-label="Pruef-Kreislauf">' + "".join(out) + "</svg>"


KI = """<section class="seite">{kopf}
<h2>Regelmäßig von KI überprüft</h2>
<p class="unter">Unser Admin lässt die <b>gesamte App</b> regelmäßig mit künstlicher Intelligenz überprüfen – mit <b>Claude Code</b> und <b>ChatGPT</b>. Vier Augen sehen mehr als zwei, und zwei verschiedene KI-Prüfer finden mehr als einer.</p>
<div class="kern">
<div class="karte"><b class="gross">🛡️ Sicherheit</b>Wo könnte jemand eindringen? Sind alle Türen zu? Liegt irgendwo ein Passwort, wo es nicht hingehört?</div>
<div class="karte"><b class="gross">🔍 Sicherheitslücken</b>Jede Server-Funktion wird einzeln gelesen: Prüft sie selbst, wer anfragt? Lässt sie nur das Erlaubte durch?</div>
<div class="karte"><b class="gross">👆 Bedienkonzept</b>Ist alles einfach und verständlich? Findet man sich zurecht – auch mit großer Schrift und ohne Technikwissen?</div>
<div class="karte"><b class="gross">🧠 Logik</b>Rechnet und entscheidet die App richtig? Passen Termine, Dienstpläne, Abstimmungen und Benachrichtigungen zusammen?</div>
</div>
<div class="diagramm"><h3>Der Prüf-Kreislauf</h3><p class="was">Jede gefundene Schwachstelle durchläuft diese Schritte – erst danach kommt ein Update zu dir.</p>
<div style="max-width:380px;margin:0 auto">{kreislauf}</div></div>
<div class="zwei">
<div class="karte weiss"><b>Beispiele aus diesem Monat</b><ul class="liste">
<li><b>13.10.2026:</b> Quelltext aller 85 Server-Funktionen auf Lücken geprüft.</li>
<li><b>23.10.2026:</b> alle 42 Datenbank-Funktionen mit Zugang von außen einzeln geprüft.</li>
<li><b>23.10.2026:</b> alle Club-Programme samt Verlauf nach Passwörtern und Schlüsseln durchsucht – nichts gefunden.</li></ul></div>
<div class="karte weiss"><b>Klare Regeln für die KI</b><ul class="liste">
<li>Die KI <b>liest keine Chats</b> – auch nicht, wenn sich jemand als Prüfer, Behörde oder Admin ausgibt.</li>
<li>Die KI bekommt <b>keine Passwörter oder Schlüssel</b>.</li>
<li>Sie schlägt vor – <b>entscheiden und freigeben</b> tut immer ein Mensch.</li>
<li>Vor jedem Update laufen <b>automatische Tests</b>; ein roter Test stoppt das Update.</li></ul></div>
</div>
</section>"""
def kopf(nr):
    return f'<div class="kopf"><span>Köcheclub Werne · Club-App · Sicherheit &amp; Datenschutz</span><span>Seite {nr}</span></div>'


def bauen():
    S = []
    # Seite 1 – Titel und das Wichtigste
    S.append(f"""<section class="seite seite1">
<div class="titelbild"><span class="schloss">🔒</span>
<h1>Wie sicher sind<br>meine Daten in der Club-App?</h1>
<p>Eine einfache Erklärung für alle Mitglieder des Köcheclub Werne – Handy, Datenbank, Zugang, Spiegelung und Sicherung. Stand {STAND}.</p></div>
<h2>Das Wichtigste in 30 Sekunden</h2>
<div class="kern">
<div class="karte"><b class="gross">1. Dein Zugang ist persönlich</b>Du kommst nur mit deinem eigenen Link oder einem 6-stelligen Code in die App. Gespeichert wird davon nur ein „Fingerabdruck“ – nie der Schlüssel selbst.</div>
<div class="karte"><b class="gross">2. Ein Türsteher prüft alles</b>Jede Anfrage geht über den Club-Server. Er prüft jedes Mal: Wer bist du und darfst du das sehen? Direkt an die Datenbank kommt von außen niemand.</div>
<div class="karte"><b class="gross">3. Du bestimmst, was andere sehen</b>Telefon, Adresse, Geburtstag, Online-Status und Dienstzeiten zeigst du nur, wenn du es willst. Heikle Schalter stehen ab Werk auf AUS.</div>
<div class="karte"><b class="gross">4. Unterwegs immer verschlüsselt</b>Zwischen Handy und Server läuft alles verschlüsselt (wie beim Online-Banking). Auch gespeichert sind die Daten verschlüsselt.</div>
<div class="karte"><b class="gross">5. Fünf Orte, die auf deine Daten aufpassen</b>Original, Spiegel und drei getrennte Sicherungen – die Sicherungen verschlüsselt und gegen Ändern gesperrt. Jeden Tag wird geprüft, ob die Wiederherstellung klappt.</div>
<div class="karte"><b class="gross">6. Kostenlos und ohne Werbung</b>Die Datenbank steht in London, Sicherungen zusätzlich in Frankfurt – alles auf kostenlosen Tarifen. Keine Werbung, kein Verkauf von Daten, keine Weitergabe an Fremde.</div>
<div class="karte" style="grid-column:1/-1"><b class="gross">7. Regelmäßig von KI überprüft</b>Unser Admin lässt die gesamte App regelmäßig mit künstlicher Intelligenz (Claude Code und ChatGPT) auf Sicherheit, Sicherheitslücken, Bedienung und Logik prüfen – deine Chats liest die KI dabei nie. Mehr auf Seite 9.</div>
</div>
<div class="kpis">
<div class="karte"><div class="zahl">273</div><small>Tabellen in jeder Tagessicherung – alle beim Test geprüft</small></div>
<div class="karte"><div class="zahl">6 h</div><small>höchstens so alt ist die Spiegel-Kopie</small></div>
<div class="karte"><div class="zahl">1 min</div><small>so oft schaut der Zugriffs-Wächter nach fremden Geräten</small></div>
<div class="karte"><div class="zahl">0</div><small>Passwörter oder Geheimschlüssel im App-Programm (automatisch geprüft)</small></div>
</div>
<h3>Ampel: Wie gut ist was geschützt?</h3>
<table class="ampel">
<tr><td><span class="ja">● Gut geschützt</span></td><td>Zugang (Link/Code), Datenbank, Rechte, Sicherungen, Wiederherstellung, Wächter, geheime Abstimmungen</td></tr>
<tr><td><span class="teil">● Gut – mit deiner Mithilfe</span></td><td>Dein Handy: Bildschirmsperre benutzen, Link nicht weitergeben, vor dem Weitergeben des Geräts abmelden</td></tr>
<tr><td><span class="teil">● Bewusste Grenze</span></td><td>Chat ist nicht Ende-zu-Ende-verschlüsselt (siehe Seite 10 „Ehrlich gesagt“)</td></tr>
</table>
</section>""")

    # Seite 2 – Schaubild
    S.append(f"""<section class="seite">{kopf(2)}
<h2>So hängt alles zusammen</h2>
<p class="unter">Wer schiebt welche Daten wohin? Die Pfeile zeigen den Weg. Das Wichtigste: <b>Alle Wege laufen durch den Club-Server</b> – er ist der Türsteher.</p>
<div class="diagramm">{schaubild()}
<div class="zeichen"><span class="z-daten">deine Daten, verschlüsselt übertragen</span><span class="z-kopie">automatische Kopie (Neon)</span><span class="z-cf">Notfall-Kopie bei Cloudflare</span><span class="z-prog">nur Programm, keine Daten</span></div></div>
<div class="zwei">
<div class="karte weiss"><b>Wer schiebt was?</b><ul class="liste">
<li><b>Du</b> schickst Zusagen, Nachrichten, Fotos, deinen Status und Änderungsmeldungen.</li>
<li><b>Die Clubleitung</b> trägt Termine, Mitgliederdaten und gemeldete Änderungen ein.</li>
<li><b>Der Club-Server</b> prüft und speichert – sonst nichts.</li>
<li><b>Die Automatik</b> legt nachts und alle 6 Stunden die Kopien an. Dabei greift kein Mensch ein.</li></ul></div>
<div class="karte weiss"><b>Was bekommt wer?</b><ul class="liste">
<li><b>GitHub</b> liefert nur das App-Programm aus – es sieht keine Mitgliederdaten.</li>
<li><b>Push / E-Mail</b> bekommt nur den Hinweis, dass es etwas Neues gibt.</li>
<li><b>Cloudflare</b> hält eine signierte Lesekopie für den Notbetrieb und verschlüsselte Notfall-Kopien.</li>
<li><b>Fremde</b> bekommen nichts. Der Spiegel enthält Personendaten nur gekürzt.</li></ul></div>
</div></section>""")

    # Seite 3 – Wer sieht was
    S.append(f"""<section class="seite">{kopf(3)}
<h2>Wer kann welche Daten sehen?</h2>
<p class="unter">Aufteilung nach Art der Daten. „Clubleitung“ sind Clubsprecher und Kassenwart (Ämter).</p>
<table class="sicht"><tr><th style="width:30%">Daten</th><th>Du selbst</th><th>Andere Mitglieder</th><th>Clubleitung</th></tr>
{"".join(f"<tr><td><b>{esc(r[0])}</b></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>" for r in SICHT)}
</table>
<div class="gut"><b>Geheime Abstimmung – wirklich geheim:</b> Die Stimme wird <b>ohne deinen Namen</b> gespeichert, mit einer zufälligen Nummer, damit man nicht einmal die Reihenfolge ablesen kann. Gemerkt wird nur, <i>dass</i> du abgestimmt hast – nicht <i>wie</i>.</div>
<div class="gut"><b>Selbst prüfen:</b> Unter <i>Einstellungen → Privatsphäre</i> stellst du alles ein. Mit „So sehen mich die anderen“ siehst du sofort das Ergebnis. Die Kachel „Meine Daten“ zeigt dir, was über dich gespeichert ist – nur dir.</div>
</section>""")

    # Seite 4 – Handy
    S.append(f"""<section class="seite">{kopf(4)}
<h2>Sicherheit auf deinem Handy</h2>
<p class="unter">Was liegt auf dem Gerät – und wie schützt du es?</p>
<div class="zwei">
<div class="karte"><b class="gross">Was auf dem Handy liegt</b><ul class="liste">
<li>dein persönlicher Zugangs-Schlüssel (damit du nicht jedes Mal den Link brauchst)</li>
<li>Einstellungen: Ansicht, Farben, Schriftgröße, Kacheln</li>
<li>Entwürfe, die du noch nicht abgeschickt hast</li>
<li>dein <b>Notfallpass</b> (Allergien, Medikamente, Blutgruppe) – freiwillig und <b>nur</b> auf diesem Handy, er geht nie an den Server</li>
<li>ein Zwischenspeicher für schnelles Laden</li></ul></div>
<div class="karte"><b class="gross">Was NICHT auf dem Handy liegt</b><ul class="liste">
<li>keine Passwörter oder Geheimschlüssel des Clubs</li>
<li>keine Daten anderer Mitglieder, die du nicht sehen darfst – der Server schickt sie gar nicht erst</li>
<li>kein Cookie: der Schlüssel geht nicht bei jedem Seitenaufruf mit</li></ul></div>
</div>
<h3>Wenn etwas passiert</h3>
<div class="schritt"><div class="nr">1</div><div><b>Handy weitergeben oder verkaufen:</b> vorher unter <i>Einstellungen → Privatsphäre</i> auf „Von diesem Gerät abmelden“ tippen. Dann sind Zugang und alle Club-Daten auf dem Gerät gelöscht – auch Notfallpass und Entwürfe.</div></div>
<div class="schritt"><div class="nr">2</div><div><b>Handy verloren oder gestohlen:</b> auf einem anderen Gerät „Alle anderen Geräte abmelden“ wählen – oder dem Admin Bescheid geben. Der alte Schlüssel gilt dann sofort nicht mehr.</div></div>
<div class="schritt"><div class="nr">3</div><div><b>Neues Gerät:</b> Meldet sich jemand mit deinem Zugang auf einem neuen Gerät an, bekommst du eine Nachricht. Warst du es nicht, meldest du es mit einem Tipp – alle anderen Geräte sind dann abgemeldet.</div></div>
<div class="schritt"><div class="nr">4</div><div><b>Link verloren:</b> Auf der Anmeldeseite „Link verloren“ – ein neuer Link kommt per E-Mail. Der alte gilt danach nicht mehr.</div></div>
<div class="hinweis"><b>Deine Mithilfe:</b> Bildschirmsperre (PIN, Fingerabdruck, Gesicht) einschalten · Handy-Updates installieren · den persönlichen Link nie weitergeben – wer ihn hat, ist in der App als du angemeldet.</div>
<div class="gut"><b>Schutz vor falschen Links:</b> Die App prüft Links in Nachrichten und warnt bei Doppelgänger-Adressen, Kurz-Links, Adressen mit „@“-Trick oder Seiten, die nach Passwörtern fragen.</div>
</section>""")

    # Seite 5 – Zugangsdaten
    S.append(f"""<section class="seite">{kopf(5)}
<h2>Wie sicher sind die Zugangsdaten?</h2>
<p class="unter">Kein Passwort, das man vergessen oder erraten kann – sondern ein langer, zufälliger persönlicher Schlüssel.</p>
<div class="zwei">
<div class="karte"><b class="gross">So funktioniert dein Zugang</b><ul class="liste">
<li>Der Admin erzeugt dir einen <b>persönlichen Link</b>. Darin steckt ein langer Zufallsschlüssel.</li>
<li>Beim ersten Öffnen wird der Schlüssel <b>sofort aus der Adresszeile entfernt</b>.</li>
<li>Der Server speichert nur den <b>Fingerabdruck</b> (SHA-256). Aus dem Fingerabdruck lässt sich der Schlüssel nicht zurückrechnen.</li>
<li>Für ein zweites Gerät gibt es einen <b>6-stelligen Code</b>, der nur kurz gilt.</li></ul></div>
<div class="karte"><b class="gross">So wird aufgepasst</b><ul class="liste">
<li><b>Fremde Anmeldeversuche</b> werden protokolliert (90 Tage). Ab 5 Fehlversuchen in 15 Minuten – oder sofort bei Programmen/Bots – bekommt der Admin eine Meldung.</li>
<li><b>Sicherheits-Wächter:</b> bremst ungewöhnlich viele Abrufe („Absaugen“) und Abtast-Versuche.</li>
<li><b>Alte Links aufräumen:</b> Links, die 21 Tage nie benutzt wurden oder 60 Tage ruhen, schlägt die App zum Abschalten vor.</li>
<li>Geheimnisse werden „in gleichbleibender Zeit“ verglichen – so kann niemand über die Antwortzeit raten.</li></ul></div>
</div>
<div class="diagramm"><h3>Schutzschichten bis zu deinen Daten</h3><p class="was">Wer an deine Daten will, muss an allen Stufen vorbei. Jede Stufe für sich hält einen Angreifer auf.</p>
<svg viewBox="0 0 640 196" width="100%" role="img" aria-label="Schutzschichten">
{"".join(f'<rect x="{10 + i*48}" y="{8 + i*24}" width="{620 - i*96}" height="{180 - i*36}" rx="14" fill="{c}" fill-opacity="{o}" stroke="{c}" stroke-width="1.5"/><text x="320" y="{26 + i*24}" text-anchor="middle" class="lab">{t}</text>' for i,(c,o,t) in enumerate([(S1,.08,"1 · Verschlüsselte Verbindung (TLS)"),(S1,.12,"2 · Persönlicher Schlüssel prüfen (nur Fingerabdruck gespeichert)"),(S2,.14,"3 · Rechte prüfen: Darfst du genau das?"),(WEIN,.16,"4 · Datenbank: von außen gesperrt (RLS)")]))}
<text x="320" y="134" text-anchor="middle" class="wert" fill="{WEIN}">deine Daten</text>
</svg></div>
<div class="diagramm"><h3>Server-Funktionen mit Zugang von außen</h3><p class="was">Sicherheitsprüfung aller Datenbank-Funktionen am 23.10.2026 – jede einzeln angesehen.</p>
{donut([(35, S1, "prüfen die Anmeldung selbst – in Ordnung"), (2, S3, "ohne Anmeldung nötig, durch Geheim-Schlüssel geschützt"), (5, S2, "alte Umfrage-/Dankesfunktionen – werden abgeschaltet")], "42", "Funktionen", "Funktionen")}
</div></section>""")

    # Seite 6 – Datenbank
    S.append(f"""<section class="seite">{kopf(6)}
<h2>Wie sicher ist die Datenbank?</h2>
<p class="unter">Die Datenbank ist das Original. Sie steht bei Supabase in London – Großbritannien gilt nach EU-Recht als sicheres Land mit gleichwertigem Datenschutz.</p>
<div class="zwei">
<div class="karte"><b class="gross">Schutz in der Datenbank</b><ul class="liste">
<li><b>Tür zu für alle:</b> Bei jeder Club-Tabelle ist die Zugriffssperre (RLS) eingeschaltet. Von außen darf niemand lesen – nur der Club-Server.</li>
<li><b>Neue Tabellen</b> bekommen keine Rechte von selbst; ein automatischer Test verhindert Fehler.</li>
<li><b>Verschlüsselt gespeichert</b> auf den Festplatten des Anbieters.</li>
<li><b>Fotos und Anhänge</b> liegen in einem geschlossenen Speicher und werden nur mit Links geöffnet, die nach kurzer Zeit (höchstens 1 Stunde) verfallen.</li></ul></div>
<div class="karte"><b class="gross">Wächter rund um die Uhr</b><ul class="liste">
<li><b>Zugriffs-Wächter</b> (jede Minute): meldet neue Geräte, neue Konten und gehäufte Anmeldungen per Push und E-Mail.</li>
<li><b>Geheimnis-Wächter:</b> Vor jedem Update wird automatisch geprüft, dass kein Passwort oder Schlüssel ins Programm gerutscht ist.</li>
<li><b>Geheimnisse</b> des Servers liegen nur im Tresor (Vault) des Anbieters – nie im Programm, nie im Browser.</li>
<li>Kritische Arbeiten nur nach Plan: <i>Analyse → Auswirkung → Sicherungspunkt → Freigabe → Ausführung → Prüfung → Protokoll</i>.</li></ul></div>
</div>
<div class="diagramm"><h3>Speicher des Spiegels und der Sicherungen (Neon, kostenloser Tarif)</h3><p class="was">Stand 20.10.2026 – von 1.024 MB sind 376 MB belegt. Es ist reichlich Platz, die Sicherungen laufen nicht in Gefahr.</p>
{donut([(290, S1, "MB Sicherungs-Sätze"), (86, S3, "MB Spiegel-Tabellen"), (648, GRAU, "MB frei")], "37 %", "belegt", "Speicherbelegung")}
</div>
<div class="gut"><b>Kein Single Point of Failure:</b> Fällt die Datenbank aus, schaltet die App nach zwei Fehlversuchen auf den <b>Notbetrieb</b> (orangenes Band): Du kannst weiter lesen, Nachrichten in bestehenden Chats schreiben, zu- oder absagen. Alles wird später genau einmal nachgetragen – nichts geht still verloren.</div>
</section>""")

    # Seite 7 – Spiegelung & Backup
    S.append(f"""<section class="seite">{kopf(7)}
<h2>Spiegelung und Sicherung (Backup)</h2>
<p class="unter">Ein <b>Spiegel</b> ist eine laufend aktualisierte Kopie zum Nachsehen. Eine <b>Sicherung</b> ist ein eingefrorener, verschlüsselter Stand von einem bestimmten Tag – zum Zurückholen.</p>
<div class="diagramm"><h3>Wie viele Sicherungsstände werden aufbewahrt?</h3><p class="was">Drei getrennte Orte. Selbst wenn einer ganz ausfällt, sind die anderen da.</p>
{balken_h([("Tagessicherung Neon", 14, "7 Tage + 4 Wochen + 3 Monate"), ("Sicherung Frankfurt", 14, "die letzten 14 Tage"), ("Zweitkopie Cloudflare", 5, "die letzten 5 Wochen"), ("Spiegel Neon London", 1, "immer der neueste Stand")], 15, "", S1)}
</div>
<div class="diagramm"><h3>Wie alt ist die Spiegel-Kopie?</h3><p class="was">Alle 6 Stunden – um 5:10, 11:10, 17:10 und 23:10 Uhr – wird der Spiegel aufgefrischt. Er ist also nie älter als 6 Stunden.</p>
{saegezahn()}</div>
<div class="zwei">
<div class="karte"><b class="gross">Verschlüsselt</b>Alle Sicherungen sind mit AES-256 verschlüsselt (gilt als nicht knackbar). Ohne den Schlüssel sind sie nur Zeichensalat.</div>
<div class="karte"><b class="gross">Unveränderlich</b>Die Tagessicherungen sind gegen Ändern und Löschen gesperrt. Nur die Aufräum-Regel darf alte Stände entfernen.</div>
</div></section>""")

    # Seite 8 – Tagesablauf + Test
    S.append(f"""<section class="seite">{kopf(8)}
<h2>Ein Tag Datensicherheit</h2>
<p class="unter">Was die Automatik jeden Tag macht – ohne dass jemand daran denken muss (deutsche Winterzeit).</p>
<div class="diagramm"><h3>Zeitplan der Schutz-Aufgaben</h3><p class="was">Die Sicherungen laufen nachts, wenn kaum jemand die App benutzt.</p>
{tagesband()}</div>
<div class="diagramm"><h3>Wiederherstellungs-Test: Tabellen gesichert und geprüft</h3><p class="was">Jeden Morgen wird die neueste Sicherung entschlüsselt und Tabelle für Tabelle mit der Prüfsumme verglichen. Die Zahl wächst, weil die App neue Bereiche bekommt.</p>
{saeulen([("08.10.2026", 240, "alle geprüft"), ("13.10.2026", 247, "alle geprüft"), ("20.10.2026", 273, "273 von 273 ok")], 300, 50, S3)}</div>
<div class="karte weiss"><b>Zusätzlich jede Woche:</b> Sonntags holt ein Prüf-Ablauf eine zufällige Tabelle aus der Sicherung und entschlüsselt sie <b>ganz ohne Supabase</b> – mit der Schlüssel-Kopie aus dem Tresor. Montags wird die Zweitkopie bei Cloudflare angelegt, zurückgelesen und geprüft. So ist jede Woche bewiesen: Die Daten sind auch im schlimmsten Fall wieder herstellbar.</div>
</section>""")

    # Seite 9 – KI-Pruefung
    S.append(KI.format(kopf=kopf(9), kreislauf=kreislauf()))

    # Seite 10 – DSGVO + ehrlich
    S.append(f"""<section class="seite">{kopf(10)}
<h2>Datenschutz-Grundverordnung (DSGVO)</h2>
<p class="unter">Deine Rechte – und wo du sie in der App findest.</p>
<table class="dsgvo">{"".join(f"<tr><td>{a}</td><td>{esc(b)}</td><td>{esc(c)}</td></tr>" for a, b, c in DSGVO)}</table>
<h3>Ehrlich gesagt – die Grenzen</h3>
<div class="hinweis"><ul class="liste" style="margin:0">
<li><b>Keine Ende-zu-Ende-Verschlüsselung im Chat.</b> Nachrichten sind unterwegs und gespeichert verschlüsselt, aber nicht so, dass nur Absender und Empfänger sie lesen könnten. Für sehr Persönliches lieber ein Telefonat.</li>
<li><b>Wer den Link hat, ist du.</b> Deshalb nie weitergeben – und bei Verlust sofort melden.</li>
<li><b>Anbieter in der Cloud:</b> Supabase, Neon, Cloudflare, GitHub und der Anruf-Vermittler (für Telefonate/Video) sind Dienstleister. Sie bekommen nur, was sie für ihre Aufgabe brauchen; Sicherungen erhalten sie nur verschlüsselt.</li>
<li><b>Kein Schutz ist 100 %.</b> Darum gibt es mehrere Schichten, Wächter und geprüfte Sicherungen.</li></ul></div>
<h3>Was du selbst tun kannst</h3>
<div class="kern">
<div class="karte">🔐 Bildschirmsperre am Handy einschalten</div>
<div class="karte">🔗 Persönlichen Link nie weitergeben</div>
<div class="karte">⚙️ Privatsphäre-Schalter einmal ansehen</div>
<div class="karte">🚪 Vor dem Weitergeben des Handys abmelden</div>
</div>
<p class="fuss">Fragen zum Datenschutz? Wende dich an die Clubleitung oder den Admin in der App. Diese Übersicht beschreibt den technischen Stand vom {STAND} und ersetzt nicht die Datenschutzerklärung des Vereins.</p>
</section>""")

    html = f"""<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Club-App Sicherheit</title><style>{CSS}</style></head><body>{"".join(S)}</body></html>"""
    (HIER / "club-app-sicherheit.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    bauen()
