"""Kreuzworträtsel für die Club-Küche, Hefte 2–12 (2027). Nutzt Gitterbau und Prüfung aus kreuzwort.py (Heft 1).
Aufruf: python3 kreuzwort_hefte.py  → schreibt nrNN-kreuzwort.json (Format wie MAG_AUSGABEN[n].raetsel.kreuzwort)."""
import json, random, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import kreuzwort as K
HIER = Path(__file__).resolve().parent
from hefte_woerter import HEFTE

def bauen(nr, titel, loesung, anzeige, woerter, ziel=20, groesse=17):
    for w, f in woerter:
        assert w.isalpha() and w.isupper() and w == w.replace("ß", ""), w
        assert w not in f.upper().replace("Ä", "AE").replace("Ö", "OE").replace("Ü", "UE"), f"{nr}: Frage verrät {w}"
        assert len(w) >= 3 and len(f) > 5, w
    assert len({w for w, _ in woerter}) == len(woerter), f"{nr}: doppelt"
    assert loesung not in {w for w, _ in woerter}, f"{nr}: Lösungswort ist auch Begriff"
    best = None
    for seed in range(3000):
        rnd = random.Random(seed * 31 + nr)
        order = woerter[:]; rnd.shuffle(order); order.sort(key=lambda w: -len(w[0]) + rnd.random() * 6)
        g, placed = K.try_build(order, size=groesse)
        rs = [k[0] for k in g]; cs = [k[1] for k in g]
        h, w = max(rs) - min(rs) + 1, max(cs) - min(cs) + 1
        if len(placed) < ziel or max(h, w) > groesse: continue
        score = len(placed) * 100 - h * w
        if best is None or score > best[0]: best = (score, g, placed)
    assert best, f"{nr}: kein Gitter"
    _, g, placed = best
    r0 = min(k[0] for k in g); c0 = min(k[1] for k in g)
    H = max(k[0] for k in g) - r0 + 1; W = max(k[1] for k in g) - c0 + 1
    starts = sorted({(r - r0, c - c0) for (_, r, c, _) in placed}); num = {p: i + 1 for i, p in enumerate(starts)}
    grid = [["" for _ in range(W)] for _ in range(H)]
    for (r, c), ch in g.items(): grid[r - r0][c - c0] = ch
    entries = [{"n": num[(r - r0, c - c0)], "dir": d, "row": r - r0, "col": c - c0, "answer": w[0], "clue": w[1]} for (w, r, c, d) in placed]
    K.pruefe(grid, entries)
    felder = None
    for s in range(200):
        try: felder = K.loesungsfelder(grid, loesung, seed=s); break
        except (IndexError, ValueError): pass
    assert felder, f"{nr}: Lösungswort {loesung} passt nicht"
    fr = sorted([[e["n"], e["dir"], e["row"], e["col"], e["answer"], e["clue"]] for e in entries], key=lambda f: (f[1], f[0]))
    out = {"titel": titel, "zeilen": ["".join(ch or "." for ch in z) for z in grid], "fragen": fr,
           "loesung": {"wort": loesung, "anzeige": anzeige, "felder": [list(p) for p in felder]}}
    assert "".join(out["zeilen"][r][c] for r, c in felder) == loesung
    (HIER / f"nr{nr:02d}-kreuzwort.json").write_text(json.dumps(out, ensure_ascii=False) + "\n", encoding="utf-8")
    return f"Nr. {nr}: {len(fr)} Begriffe, {H}×{W}, Lösung {anzeige}"

if __name__ == "__main__":
    for nr, (titel, loesung, anzeige, woerter) in HEFTE.items():
        print(bauen(nr, titel, loesung, anzeige, woerter))
