"""Feste Inhalte 2028 (Hefte 13–24) in teile/magazin.js: Termine, Tipps, Witz, Küchenlatein, Schlagzeilen, Rätsel; Kräuter und „Schon gewusst?“ für das zweite Jahr."""
import json, re, os, sys
D = os.path.dirname(os.path.abspath(__file__)) + "/"
H = "/home/user/KC-Infrastructure-Control-Center/docs/club-magazin-raetselecke/hefte/"
Q = "/home/user/kc-clubapp/teile/magazin.js"
J = lambda x: json.dumps(x, ensure_ascii=False, separators=(",", ":"))
d = json.load(open(D + "inhalte.json", encoding="utf-8"))
s = open(Q, encoding="utf-8").read()
fehlt = []
for n in range(13, 25):
    h = d["hefte"][str(n)]
    a = s.index("\n  %d: {\n" % n); e = s.index("\n  },\n", a); blk = s[a:e]
    assert "tipp:" not in blk and "latein:" not in blk, "schon eingebaut: %d" % n
    m = re.search(r"\n    schlagzeilen: (\[.*\]),\n", blk); sz = json.loads(m[1])
    sz = sz + [z for z in h["schlagzeilen_zusatz"] if z not in sz]
    blk = blk.replace(m[0], "\n    schlagzeilen: " + J(sz) + ",\n", 1)
    r = {}
    fb = H + "nr%02d-fehlerbild.json" % n
    if os.path.exists(fb):
        f = json.load(open(fb, encoding="utf-8")); import glob
        sv = glob.glob("/home/user/kc-clubapp/magazin/raetsel/nr%02d-*-a.svg" % n); assert len(sv) == 1, sv
        stamm = "magazin/raetsel/" + os.path.basename(sv[0])[:-6]
        r["fehlerbild"] = {"titel": f["titel"], "a": stamm + "-a.svg", "b": stamm + "-b.svg", "loesung": stamm + "-loesung.svg", "fehler": f["fehler"]}
    else: fehlt.append("fehlerbild %d" % n)
    r["kreuzwort"] = json.load(open(H + "nr%02d-kreuzwort.json" % n, encoding="utf-8"))
    r["aufloesung"] = n - 1
    neu = ("    raetsel: " + J(r) + ", // KC-CLUB-MAGAZIN-HEFTE-2028: Fehlerbild + Kreuzworträtsel, Auflösung aus Nr. %d\n" % (n - 1)
           + "    // KC-CLUB-MAGAZIN-HEFTE-2028 (Wunsch Hansi 13.11.2026 „Baue schon mal in alle Hefte die weiteren feststehenden Sachen ein“): feste Inhalte vorab\n"
           + "    termine_fest: " + J(h["termine_fest"]) + ",\n    tipp: " + J(h["tipp"]) + ",\n    witz: " + J(h["witz"]) + ",\n    latein: " + J(h["latein"]) + ",\n")
    if "\n    raetsel: " in blk:
        blk = re.sub(r"\n    raetsel: \{ aufloesung: \d+ \},[^\n]*\n", "\n" + neu, blk, count=1)
        assert "KC-CLUB-MAGAZIN-HEFTE-2028" in blk, n
    else:
        i = blk.index("\n", blk.index("\n    schlagzeilen: ") + 1)
        blk = blk[:i + 1] + neu + blk[i + 1:]
    s = s[:a] + blk + s[e:]
# Kräuter und „Schon gewusst?“ – zweites Jahr
k0 = s.index("const MAG_KRAEUTER = ["); k1 = s.index("\n];\n", k0)
s = s[:k1] + "\n  // KC-CLUB-MAGAZIN-HEFTE-2028: zweites Jahr (Hefte 13–24)\n" + "".join("  " + J(k) + ",\n" for k in d["kraeuter_2028"]).rstrip("\n") + s[k1:]
g0 = s.index("const MAG_SCHON_GEWUSST = ["); g1 = s.index("\n];\n", g0)
s = s[:g1] + "\n  // KC-CLUB-MAGAZIN-HEFTE-2028: zweites Jahr (Hefte 13–24)\n" + "".join("  " + J(l) + ",\n" for l in d["schon_gewusst_2028"]).rstrip("\n") + s[g1:]
alt1 = "const magKraut = (monat) => { const k = MAG_KRAEUTER[(monat - 1) % 12];"
alt2 = "const magSchonGewusst = (nr) => { const l = MAG_SCHON_GEWUSST[(nr - 1) % 12];"
assert alt1 in s and alt2 in s
s = s.replace(alt1, "const magKraut = (nr) => { const k = MAG_KRAEUTER[(nr - 1) % MAG_KRAEUTER.length];")  # Heft-Nr.: 2027 = Monat, ab 2028 neue Kräuter
s = s.replace(alt2, "const magSchonGewusst = (nr) => { const l = MAG_SCHON_GEWUSST[(nr - 1) % MAG_SCHON_GEWUSST.length];")
assert 'if (r.id === "saison") inhalt += magKraut(MAG.monat);' in s
s = s.replace('if (r.id === "saison") inhalt += magKraut(MAG.monat);', 'if (r.id === "saison") inhalt += magKraut(nr);')
open(Q, "w", encoding="utf-8").write(s)
print("eingebaut; fehlt:", fehlt)
