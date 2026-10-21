# Kontaktbogen: Bilder der Aufnahme zu bestimmten Sekunden nebeneinander (zum Prüfen)
import json, sys, subprocess
d = sys.argv[1]; ts = [float(x) for x in sys.argv[3:]]
b = json.load(open(f"{d}/zeiten.json"))["bilder"]
fs = [min(b, key=lambda x: abs(x["t"] - t))["name"] for t in ts]
inp = sum([["-i", f"{d}/{f}"] for f in fs], [])
flt = "".join(f"[{i}]scale=300:-1,drawtext=text='{t}s':x=8:y=8:fontsize=28:fontcolor=yellow:box=1:boxcolor=black[v{i}];" for i, t in enumerate(ts)) + "".join(f"[v{i}]" for i in range(len(ts))) + f"hstack={len(ts)}"
subprocess.run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", flt, sys.argv[2]], check=True)
