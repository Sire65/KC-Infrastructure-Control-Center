import wave, sys
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
}
cfg = SynthesisConfig(length_scale=0.92)
for k, t in L.items():
    with wave.open(f"vo/{k}.wav", "wb") as w:
        v.synthesize_wav(t, w, syn_config=cfg)
