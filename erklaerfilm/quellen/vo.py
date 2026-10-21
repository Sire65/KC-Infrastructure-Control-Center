# Sprecher je Szene → vo/<kapitel>/<szene>.wav und dauer.json
# Thorsten (CC0, wie Werbefilm und Erklär-Videos der App) erklärt, Kerstin (CC0) spricht die Merksätze.
import json, re, sys, wave, os
from piper import PiperVoice, SynthesisConfig
CLUB = os.environ.get("CLUB", "/home/user/sire65/kc-clubapp")
KERSTIN = os.environ.get("KERSTIN", "stimmen/de_DE-kerstin-low.onnx")
STIMMEN = {
  "thorsten": (PiperVoice.load(f"{CLUB}/stimmen/de_DE-thorsten-medium.onnx"), SynthesisConfig(length_scale=1.02)),
  "kerstin": (PiperVoice.load(KERSTIN), SynthesisConfig(length_scale=1.06)),
}
# Englische Wörter englisch sprechen (wie werbefilm/quellen/vo.py) – nur für die Stimme, Untertitel bleiben unverändert
AUSSPRACHE = [(r"\bApp\b", "Äpp"), (r"\bE-Mail\b", "iiemejl"), (r"\bTwinkey\b", "Twinki")]
def aussprache(t):
    for a, b in AUSSPRACHE: t = re.sub(a, b, t)
    return t
k = json.load(open(sys.argv[1], encoding="utf8"))
os.makedirs(f"vo/{k['id']}", exist_ok=True)
dauer = {}
for s in k["szenen"]:
    v, cfg = STIMMEN[s["stimme"]]
    pfad = f"vo/{k['id']}/{s['id']}.wav"
    with wave.open(pfad, "wb") as w: v.synthesize_wav(aussprache(s["text"]), w, syn_config=cfg)
    with wave.open(pfad) as w: dauer[s["id"]] = round(w.getnframes() / w.getframerate(), 3)
json.dump(dauer, open(f"vo/{k['id']}/dauer.json", "w"), indent=1)
print(dauer, "gesamt", round(sum(dauer.values()), 1))
