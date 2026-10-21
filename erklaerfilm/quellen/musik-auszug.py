# Übernimmt Twinkeys „Küchen-Disco“ aus der Club-App nach musik.js (kein Abtippen – gleiche Musik wie auf der Bühne)
import os
CLUB = os.environ.get("CLUB", "/home/user/sire65/kc-clubapp")
src = open(f"{CLUB}/app.js", encoding="utf8").read().split("\n")
def zeile(start): return next(l for l in src if l.startswith(start))
def funk(start):
    i = next(k for k, l in enumerate(src) if l.startswith(start)); j = i
    while not src[j].startswith("}"): j += 1
    return "\n".join(src[i:j + 1])
teile = [zeile("const BWM_AKKORDE"), zeile("const BWM_BASS"), zeile("const BWM_HOOK"), zeile("const bwHz"),
         funk("function bwTon("), funk("function bwRauschen("), funk("function bwRiser("), funk("function bwMusikSchritt(")]
alt = open("musik.js", encoding="utf8").read()
kopf = alt[:alt.index("const BWM_AKKORDE")]; fuss = alt[alt.index("\nasync function render("):]
open("musik.js", "w", encoding="utf8").write(kopf + "\n".join(teile) + fuss)
