# Sprecher je Szene → vo/<kapitel>/<szene>.wav und dauer.json
# Thorsten (CC0, wie Werbefilm und Erklär-Videos der App) erklärt, eine Sprecherin aus Piper „mls“ (CC-BY 4.0, Multilingual LibriSpeech) spricht die Merksätze.
import json, re, sys, wave, os
from piper import PiperVoice, SynthesisConfig
CLUB = os.environ.get("CLUB", "/home/user/sire65/kc-clubapp")
MLS = os.environ.get("MLS", "stimmen/de_DE-mls-medium.onnx")
SPRECHERIN = int(os.environ.get("SPRECHERIN", "26"))  # aus 236 Stimmen per Tonhöhe, Klarheit und Rauschabstand gewählt (Hörprobe B)
STIMMEN = {
  "thorsten": (PiperVoice.load(f"{CLUB}/stimmen/de_DE-thorsten-medium.onnx"), SynthesisConfig(length_scale=1.02)),
  "sprecherin": (PiperVoice.load(MLS), SynthesisConfig(speaker_id=SPRECHERIN, length_scale=1.05)),
}
# Englische Wörter englisch sprechen (wie werbefilm/quellen/vo.py) – nur für die Stimme, Untertitel bleiben unverändert
AUSSPRACHE = [(r"\bApps?\b", "Äpp"), (r"\bE-Mails?\b", "iiemejl"), (r"\bTwinkey\b", "Twinki"), (r"\bChats?\b", "Tschätt"), (r"\bchatten\b", "tschätten"),
  (r"\bEmojis?\b", "Emodschi"), (r"\bPush\b", "Pusch"), (r"\bonline\b", "onlain"), (r"\bOnline\b", "Onlain"), (r"\boffline\b", "offlain"), (r"\bLink\b", "Link"), (r"\bSelfie\b", "Selfi")]
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
