# Sprecher (Piper, Stimme de_DE-thorsten-medium aus der Club-App) → vo/NN.wav, danach ton.wav + zeiten.json (Szenen-Zeitplan für film.html)
import json, re, wave, os, sys
from piper import PiperVoice, SynthesisConfig
from drehbuch import SZENEN
MODELL = os.environ.get("KC_STIMME", "/home/user/kc-clubapp/stimmen/de_DE-thorsten-medium.onnx")
v = PiperVoice.load(MODELL)
# Englische Wörter englisch sprechen (wie AUSSPRACHE im Werbefilm): nur für die Stimme, Bildtext bleibt
AUSSPRACHE = [(r"\bApp\b", "Äpp"), (r"Club-App", "Club-Äpp"), (r"\bLive\b", "Laif"), (r"Live-", "Laif-"), (r"\bPush\b", "Pusch"), (r"E-Mail", "I-Mejl"), (r"\bPDFs?\b", "Pe-De-Ef"),
  (r"Hansi", "Hanzi"), (r"\bok\b", "okay"), (r"30\. Oktober", "dreißigsten Oktober"), (r"19 Uhr", "neunzehn Uhr"), (r"12 Mitglieder", "zwölf Mitglieder"), (r"3 Mitglieder", "drei Mitglieder"), (r"27\. Oktober", "siebenundzwanzigsten Oktober")]
def aussprache(t):
    for a, b in AUSSPRACHE: t = re.sub(a, b, t)
    return t
cfg = SynthesisConfig(length_scale=1.0)  # etwas ruhiger als der Werbefilm – Anleitung zum Mitmachen
os.makedirs("vo", exist_ok=True)
RATE = 22050; PAUSE_VOR, PAUSE_NACH = 0.5, 0.9
ton = bytearray(); zeiten = []; t = 0.0
for i, (bild, kap, text) in enumerate(SZENEN):
    pfad = f"vo/{i:02d}.wav"
    with wave.open(pfad, "wb") as w: v.synthesize_wav(aussprache(text), w, syn_config=cfg)
    with wave.open(pfad) as w: RATE = w.getframerate(); pcm = w.readframes(w.getnframes())
    lang = len(pcm) / 2 / RATE
    vor = PAUSE_VOR + (0.6 if bild.startswith(("titel", "kapitel")) else 0)
    nach = PAUSE_NACH + (1.2 if bild in ("titel", "ende") or bild.startswith("kapitel") else 0)
    ton += b"\0\0" * int(vor * RATE) + pcm + b"\0\0" * int(nach * RATE)
    dauer = vor + lang + nach
    zeiten.append({"bild": bild, "kapitel": kap, "text": text, "ab": round(t, 3), "sprecher": round(t + vor, 3), "sprecherEnde": round(t + vor + lang, 3), "dauer": round(dauer, 3)})
    t += dauer
with wave.open("ton.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(bytes(ton))
json.dump(zeiten, open("zeiten.json", "w"), ensure_ascii=False, indent=1)
print(f"{len(zeiten)} Szenen, {t:.1f} s")
