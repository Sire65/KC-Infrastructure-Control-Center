import re, wave, sys
from piper import PiperVoice, SynthesisConfig
v = PiperVoice.load("/home/user/sire65/kc-clubapp/stimmen/de_DE-thorsten-medium.onnx")
L = {
 "01": "Du bist Mitglied im Köcheclub Werne? Sehr gut!",
 "02": "Und weißt du schon? Den Köcheclub gibt es jetzt für die Hosentasche!",
 "03": "Immer aktuell. Immer dabei. In deinem Handy.",
 "04": "Neuigkeiten aus dem Club – bevor das Nudelwasser kocht.",
 "05": "Chatte mit deinen Freunden. Und alles bleibt unter uns.",
 "06": "Alle Clubtermine im Blick – und auf Wunsch erinnert dich die App.",
 "07": "Und die schönsten Momente? Im Fotoalbum, immer wieder.",
 "08": "Köcheclub Werne. Jetzt in der Club-App. Gemeinsam kochen, gemeinsam helfen.",
 "09": "Und das ist noch lange nicht alles: Viele weitere Funktionen findest du in der App.",
 "10": "Installier die App – und probier alles aus!",
 "11": "Und wenn du Ideen hast: immer her damit! Die App wird ständig weiterentwickelt.",
 "12": "In der App gibst du ganz einfach deinen Wunschdienstplan für den Weihnachtsmarkt ein – wenn du magst, mit unserem Assistenten Twinkey.",
 "13": "Also: keine Zettelwirtschaft mehr!",
 "14": "Und wenn du die App schon installiert hast: umso besser! Dann bist du immer up to date.",
}
# Englische Wörter englisch sprechen (wie BW_AUSSPRACHE in der Club-App): Schreibweise nur für die Stimme, Bildtext bleibt
AUSSPRACHE = [(r"\bApp\b", "Äpp"), (r"\bChatte\b", "Tschätte"), (r"\bchatten\b", "tschätten"), (r"\bChat\b", "Tschätt"), (r"\bTwinkey\b", "Twinki"), (r"\bup to date\b", "App tu dejt")]
def aussprache(t):
    for re_, neu in AUSSPRACHE: t = re.sub(re_, neu, t)
    return t
cfg = SynthesisConfig(length_scale=0.92)
for k, t in L.items():
    with wave.open(f"vo/{k}.wav", "wb") as w:
        v.synthesize_wav(aussprache(t), w, syn_config=cfg)
