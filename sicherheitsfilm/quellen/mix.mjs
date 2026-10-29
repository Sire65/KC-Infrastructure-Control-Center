// Ton: Sprecher-Sätze nach plan.json einsetzen, Lautheit -16 LUFS → Endfassung mit bild.mp4
import fs from "fs"; import { execFileSync } from "child_process";
const { dauer, plan } = JSON.parse(fs.readFileSync("plan.json", "utf8"));
const ein = plan.flatMap((s) => ["-i", `vo/${s.id}.wav`]);
const f = plan.map((s, i) => `[${i}:a]aresample=44100,pan=stereo|c0=c0|c1=c0,adelay=${Math.round(s.sprache * 1000)}|${Math.round(s.sprache * 1000)}[v${i}]`).join(";");
const filter = `${f};${plan.map((_, i) => `[v${i}]`).join("")}amix=inputs=${plan.length}:normalize=0,highpass=f=80,equalizer=f=3000:t=q:w=1:g=2,apad=whole_dur=${dauer},atrim=0:${dauer},loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.3,afade=t=out:st=${(dauer - 1.2).toFixed(2)}:d=1.2[out]`;
execFileSync("ffmpeg", ["-y", "-v", "error", ...ein, "-filter_complex", filter, "-map", "[out]", "-ar", "44100", "-c:a", "pcm_s16le", "mix.wav"], { stdio: "inherit" });
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", "bild.mp4", "-i", "mix.wav", "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", "Sicherheit-und-Datenschutz.mp4"], { stdio: "inherit" });
console.log("fertig: Sicherheit-und-Datenschutz.mp4");
