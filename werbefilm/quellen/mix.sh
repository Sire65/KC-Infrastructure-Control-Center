#!/usr/bin/env bash
# Sprecher über die Musik legen (Musik wird beim Sprechen automatisch leiser), Lautheit für Social Media (-14 LUFS)
set -e
D=(0.6 4.2 8.25 13.0 19.6 26.0 32.6 125.03 73.91 105.60 108.50 39.0 46.1 120.23 78.61 82.61 84.71 94.2 95.9 112.6); IN=""; F=""
for i in 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19; do IN="$IN -i vo/$(printf %02d $((i+1))).wav"; ms=$(python3 -c "print(int(${D[$i]}*1000))"); F="$F[$((i+1)):a]aresample=44100,pan=stereo|c0=c0|c1=c0,adelay=${ms}|${ms}[v$i];"; done
ffmpeg -y -v error -i musik.wav $IN -filter_complex "${F}[v0][v1][v2][v3][v4][v5][v6][v7][v8][v9][v10][v11][v12][v13][v14][v15][v16][v17][v18][v19]amix=inputs=20:normalize=0,highpass=f=80,equalizer=f=3000:t=q:w=1:g=3,volume=1.8,apad=whole_dur=130.9,asplit=2[vo][sc];[0:a]volume=0.8[m];[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=450[md];[md][vo]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:130.9,afade=t=out:st=129.7:d=1.2[out]" -map "[out]" -ar 44100 -c:a pcm_s16le mix.wav
ffmpeg -y -v error -i bild.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest Koecheclub-Werbefilm.mp4
# Handy-/Messenger-taugliche Größe (< 30 MB): Bild etwas stärker komprimieren
ffmpeg -y -v error -i Koecheclub-Werbefilm.mp4 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -c:a copy -movflags +faststart klein.mp4 && mv klein.mp4 Koecheclub-Werbefilm.mp4
