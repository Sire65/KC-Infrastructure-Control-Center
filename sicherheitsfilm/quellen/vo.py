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
cfg = SynthesisConfig(length_scale=0.95)
zeiten = {}
for s in json.load(open("texte.json", encoding="utf-8")):
    with wave.open(f"vo/{s['id']}.wav", "wb") as w:
        v.synthesize_wav(aussprache(s["t"]), w, syn_config=cfg)
    with wave.open(f"vo/{s['id']}.wav") as w:
        zeiten[s["id"]] = round(w.getnframes() / w.getframerate(), 3)
json.dump(zeiten, open("zeiten.json", "w"), indent=1)
print(sum(zeiten.values()), "s Sprache")
