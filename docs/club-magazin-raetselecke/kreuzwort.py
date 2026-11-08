"""Kreuzworträtsel „Küche & Backstube“ für die Rätsel-Ecke.

Legt die Begriffe automatisch zu einem gültigen Gitter (jede waagerechte und
senkrechte Buchstabenfolge ist ein gewolltes Wort), wählt Felder für das
Lösungswort und schreibt kreuzwort.json neben dieses Skript.
Umlaute als AE/OE/UE, wie im deutschen Kreuzworträtsel üblich.

Aufruf:  python3 kreuzwort.py
"""
import json
import random
from pathlib import Path

HIER = Path(__file__).resolve().parent
LOESUNGSWORT = "KOECHECLUB"

WORDS = [
    ("BLANCHIEREN", "Gemüse kurz in sprudelndes Wasser geben und sofort abschrecken"),
    ("POCHIEREN", "Knapp unter dem Siedepunkt sanft garen (z. B. Eier)"),
    ("FLAMBIEREN", "Mit Alkohol übergießen und anzünden"),
    ("TRANCHIEREN", "Braten fachgerecht in Scheiben schneiden"),
    ("LEGIEREN", "Suppe oder Soße mit Eigelb und Sahne binden"),
    ("PASSIEREN", "Durch ein feines Sieb streichen"),
    ("MARINIEREN", "In Würzflüssigkeit einlegen"),
    ("GRATINIEREN", "Unter starker Oberhitze goldbraun überbacken"),
    ("JULIENNE", "Gemüse in feinste Streifen geschnitten"),
    ("BRUNOISE", "Gemüse in winzige Würfel geschnitten"),
    ("FOND", "Kräftige Grundbrühe aus Knochen und Gemüse"),
    ("MEHLSCHWITZE", "In Butter angeschwitztes Mehl zum Binden"),
    ("SCHNEEBESEN", "Küchengerät zum Aufschlagen von Sahne und Eiweiß"),
    ("NUDELHOLZ", "Damit wird Teig ausgerollt"),
    ("SPRITZBEUTEL", "Für Tupfen aus Sahne oder Teig"),
    ("MOERSER", "Schale mit Stößel für Gewürze"),
    ("KELLE", "Großer Schöpflöffel"),
    ("SIEB", "Trennt Nudeln vom Kochwasser"),
    ("REIBE", "Für Käse, Möhren und Muskat"),
    ("MUERBETEIG", "Teig aus Mehl, Butter, Zucker – Boden für Obstkuchen"),
    ("HEFETEIG", "Muss vor dem Backen gehen"),
    ("BISKUIT", "Luftiger Teig ohne Fett für Tortenböden"),
    ("BAISER", "Gebäck aus steif geschlagenem Eiweiß und Zucker"),
    ("GANACHE", "Creme aus Schokolade und heißer Sahne"),
    ("KUVERTUERE", "Schokolade mit hohem Kakaobutteranteil zum Überziehen"),
    ("STREUSEL", "Krümelige Kuchenauflage"),
    ("ZESTE", "Feiner Streifen Zitrusschale"),
    ("WOK", "Asiatische Pfanne mit gewölbtem Boden"),
    ("SCHMOREN", "Erst anbraten, dann in wenig Flüssigkeit garen"),
    ("ABLOESCHEN", "Angebratenes mit Flüssigkeit aufgießen"),
    ("DAMPFGAREN", "Garen über heißem Wasserdampf"),
    ("TEIGSCHABER", "Gummispatel, der die Schüssel sauber macht"),
]

def try_build(order, size=17):
    g = {}
    placed = []
    def can(word, r, c, d):
        dr, dc = (0, 1) if d == "A" else (1, 0)
        er, ec = r + dr * (len(word) - 1), c + dc * (len(word) - 1)
        if min(r, c) < 0 or er >= size or ec >= size:
            return None
        # Zellen vor/nach dem Wort leer
        if (r - dr, c - dc) in g or (er + dr, ec + dc) in g:
            return None
        cross = 0
        for i, ch in enumerate(word):
            rr, cc = r + dr * i, c + dc * i
            if (rr, cc) in g:
                if g[(rr, cc)] != ch:
                    return None
                cross += 1
            else:
                # Nachbarn quer zur Richtung muessen leer sein
                for s in (-1, 1):
                    if (rr + dc * s, cc + dr * s) in g:
                        return None
        return cross
    first = order[0]
    r0 = size // 2
    for i, ch in enumerate(first[0]):
        g[(r0, 1 + i)] = ch
    placed.append((first, r0, 1, "A"))
    for w in order[1:]:
        word = w[0]
        best = None
        for (pr, pc), ch in list(g.items()):
            for i, wc in enumerate(word):
                if wc != ch:
                    continue
                for d in ("A", "D"):
                    r, c = (pr, pc - i) if d == "A" else (pr - i, pc)
                    x = can(word, r, c, d)
                    if x:
                        score = x * 10 - abs(r - size / 2) - abs(c - size / 2)
                        if best is None or score > best[0]:
                            best = (score, r, c, d)
        if best:
            _, r, c, d = best
            dr, dc = (0, 1) if d == "A" else (1, 0)
            for i, ch in enumerate(word):
                g[(r + dr * i, c + dc * i)] = ch
            placed.append((w, r, c, d))
    return g, placed

def pruefe(grid, entries):
    """Jede Buchstabenfolge (waagerecht/senkrecht, Länge >= 2) muss ein Begriff sein."""
    H, W = len(grid), len(grid[0])
    runs = []
    for r in range(H):
        runs += "".join(grid[r][c] or " " for c in range(W)).split()
    for c in range(W):
        runs += "".join(grid[r][c] or " " for r in range(H)).split()
    runs = sorted(w for w in runs if len(w) > 1)
    assert runs == sorted(e["answer"] for e in entries), "Gitter enthält ungewollte Wörter"


def loesungsfelder(grid, wort, seed=7):
    """Verteilte Felder, deren Buchstaben das Lösungswort ergeben."""
    rnd = random.Random(seed)
    zellen = [(r, c) for r, z in enumerate(grid) for c, ch in enumerate(z) if ch]
    benutzt = []
    for ch in wort:
        opts = [p for p in zellen if grid[p[0]][p[1]] == ch and p not in benutzt
                and all(abs(p[0] - u[0]) + abs(p[1] - u[1]) > 2 for u in benutzt)]
        benutzt.append(rnd.choice(opts))
    return benutzt


def main():
    target = 20
    best = None
    for seed in range(4000):
        rnd = random.Random(seed)
        order = WORDS[:]
        rnd.shuffle(order)
        order.sort(key=lambda w: -len(w[0]) + rnd.random() * 6)
        g, placed = try_build(order)
        rs = [k[0] for k in g]; cs = [k[1] for k in g]
        h, w = max(rs) - min(rs) + 1, max(cs) - min(cs) + 1
        if len(placed) < target or max(h, w) > 17:
            continue
        score = len(placed) * 100 - h * w
        if best is None or score > best[0]:
            best = (score, g, placed, seed)
    score, g, placed, seed = best
    r0 = min(k[0] for k in g); c0 = min(k[1] for k in g)
    H = max(k[0] for k in g) - r0 + 1; W = max(k[1] for k in g) - c0 + 1
    # Nummerierung
    starts = sorted({(r - r0, c - c0) for (_, r, c, _) in placed})
    num = {p: i + 1 for i, p in enumerate(starts)}
    entries = []
    for (w, r, c, d) in placed:
        p = (r - r0, c - c0)
        entries.append({"n": num[p], "dir": d, "row": p[0], "col": p[1], "answer": w[0], "clue": w[1]})
    entries.sort(key=lambda e: (e["dir"], e["n"]))
    grid = [["" for _ in range(W)] for _ in range(H)]
    for (r, c), ch in g.items():
        grid[r - r0][c - c0] = ch
    pruefe(grid, entries)
    daten = {"rows": H, "cols": W, "grid": grid, "entries": entries, "seed": seed,
             "solution": {"word": LOESUNGSWORT, "cells": loesungsfelder(grid, LOESUNGSWORT)}}
    (HIER / "kreuzwort.json").write_text(json.dumps(daten, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Kreuzwort: {len(entries)} Begriffe, Gitter {H}x{W}, geprüft")


if __name__ == "__main__":
    main()
