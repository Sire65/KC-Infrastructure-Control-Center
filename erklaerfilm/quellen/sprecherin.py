# Weibliche Stimme für die Merksätze: Chatterbox Multilingual (Resemble AI, MIT), Stimmfarbe aus einer echten Aufnahme
# einer deutschen Sprecherin (sprecherin-vorlage.wav = 2 Sätze aus dem Kerstin-Datensatz, CC0). Je Satz bis zu 5 Fassungen;
# behalten wird die, die eine Spracherkennung (faster-whisper, MIT) am genauesten versteht – so fehlt keine Silbe.
# Aufruf (im eigenen Python mit chatterbox-tts + faster-whisper): python sprecherin.py auftrag.json   [{text, aus}, …]
import json, sys, re, difflib, librosa, soundfile as sf, torch
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel
auftrag = json.load(open(sys.argv[1], encoding="utf8"))
tts = ChatterboxMultilingualTTS.from_pretrained(device="cpu"); asr = WhisperModel("small", device="cpu", compute_type="int8")
norm = lambda t: re.sub(r"[^a-zäöüß ]", "", t.lower().replace("-", " ")).split()
for a in auftrag:
    best = None
    for versuch in range(5):
        torch.manual_seed(1991 + versuch)
        wav = tts.generate(a["text"], language_id="de", audio_prompt_path="sprecherin-vorlage.wav", exaggeration=0.45, cfg_weight=0.45).squeeze(0).numpy()
        seg, _ = asr.transcribe(librosa.resample(wav, orig_sr=tts.sr, target_sr=16000), language="de", beam_size=5)
        gehoert = " ".join(s.text for s in seg)
        guete = difflib.SequenceMatcher(None, norm(a["text"]), norm(gehoert)).ratio()
        print(f"  {versuch + 1}. {guete:.2f} „{gehoert.strip()}“", flush=True)
        if not best or guete > best[0]: best = (guete, wav)
        if guete >= 0.99: break
    sf.write(a["aus"], best[1], tts.sr, subtype="PCM_16"); print("→", a["aus"], round(best[0], 2), flush=True)
