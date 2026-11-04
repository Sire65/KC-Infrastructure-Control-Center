# Sprecher: Piper-Stimme de_DE-thorsten-medium (CC0) aus dem Club-App-Checkout → vo/<id>.wav + zeiten.json (Dauer je Satz)
import json, re, sys, wave
from piper import PiperVoice, SynthesisConfig
MODELL = sys.argv[1] if len(sys.argv) > 1 else "/home/user/kc-clubapp/stimmen/de_DE-thorsten-medium.onnx"
v = PiperVoice.load(MODELL)
# Englische Wörter englisch sprechen (wie AUSSPRACHE im Werbefilm); Bildtext bleibt unverändert
AUSSPRACHE = [(r"\bApp\b", "Äpp"), (r"\bClaude Code\b", "Klohd Kohd"), (r"\bChatGPT\b", "Tschätt Dschi Pi Ti"),
              (r"\bServer\b", "Sörwer"), (r"\bOnline-Banking\b", "Onlein-Bänking"), (r"\bonline\b", "onlein"),
              (r"\bUpdate\b", "Apdejt"), (r"\bAdmin\b", "Ädmin")]
def aussprache(t):
    for muster, neu in AUSSPRACHE: t = re.sub(muster, neu, t)
    return t
cfg = SynthesisConfig(length_scale=1.0)
zeiten = {}
for s in json.load(open("texte.json", encoding="utf-8")):
    with wave.open(f"vo/{s['id']}.wav", "wb") as w:
        v.synthesize_wav(aussprache(s["t"]), w, syn_config=cfg)
    with wave.open(f"vo/{s['id']}.wav") as w:
        zeiten[s["id"]] = round(w.getnframes() / w.getframerate(), 3)
json.dump(zeiten, open("zeiten.json", "w"), indent=1)
# Satzmarken: Sprechpausen in der Aufnahme messen und den Satzzeichen zuordnen → marken.json {id: [[von, bis, t0, t1], …]}
# (Zeichenbereich im Text und Sprechzeit). So treffen Bild und Ton auch über Punkt und Komma hinweg zusammen.
import array
def pausen(pfad, min_s=0.11):
    with wave.open(pfad) as w:
        rate, roh = w.getframerate(), w.readframes(w.getnframes())
    a = array.array("h", roh); fen = int(rate * 0.01); n = len(a) // fen
    rms = [(sum(x * x for x in a[i * fen:(i + 1) * fen]) / fen) ** 0.5 for i in range(n)]
    grenze = max(rms) * 0.03; lauf = []; start = None
    for i, r in enumerate(rms + [grenze * 99]):
        if r < grenze and start is None: start = i
        elif r >= grenze and start is not None:
            if (i - start) * 0.01 >= min_s: lauf.append((start * 0.01, i * 0.01))
            start = None
    return lauf, n * 0.01
marken = {}
for s in json.load(open("texte.json", encoding="utf-8")):
    t = s["t"]; teile = [m.end() for m in re.finditer(r"[.,:;!?–](?=\s)", t)]
    grenzen = [0] + teile + [len(t)]
    lauf, dauer = pausen(f"vo/{s['id']}.wav")
    innen = [p for p in lauf if p[0] > 0.05 and p[1] < dauer - 0.05]
    beginn = lauf[0][1] if lauf and lauf[0][0] <= 0.02 else 0.0
    ende = lauf[-1][0] if lauf and lauf[-1][1] >= dauer - 0.02 else dauer
    if len(innen) < len(teile): continue  # zu wenige Pausen gefunden → Film schätzt nach Textlänge
    # je Satzzeichen die Pause, die zeitlich am besten zur erwarteten Stelle passt (lange Pausen bevorzugt), der Reihe nach
    gew, ab = [], 0
    for j, c in enumerate(teile):
        soll = beginn + (ende - beginn) * c / len(t); rest = len(teile) - j - 1
        kand = innen[ab:len(innen) - rest]
        if not kand: break
        k = min(range(len(kand)), key=lambda q: abs((kand[q][0] + kand[q][1]) / 2 - soll) - 1.5 * (kand[q][1] - kand[q][0]))
        gew.append(kand[k]); ab += k + 1
    if len(gew) < len(teile): continue
    zeitgrenzen = [(beginn, None)] + [(p[1], p[0]) for p in gew] + [(None, ende)]
    marken[s["id"]] = [[grenzen[i], grenzen[i + 1], round(zeitgrenzen[i][0], 3), round(zeitgrenzen[i + 1][1], 3)] for i in range(len(grenzen) - 1)]
json.dump(marken, open("marken.json", "w"), indent=1)
print(len(marken), "von", len(zeiten), "Texten mit Satzmarken")
print(sum(zeiten.values()), "s Sprache")
