#!/usr/bin/env bash
# Ton (Sprecher) aufbereiten und mit dem Bild zusammenfügen → ../Clubsitzung-Anleitung-Klaus.mp4
set -e
ffmpeg -y -v error -i ton.wav -af "highpass=f=80,equalizer=f=3000:t=q:w=1:g=2,loudnorm=I=-16:TP=-1.5:LRA=11" -ar 44100 -ac 2 mix.wav
ffmpeg -y -v error -i bild.mp4 -i mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart -shortest ../Clubsitzung-Anleitung-Klaus.mp4
