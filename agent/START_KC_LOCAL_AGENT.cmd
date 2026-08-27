@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python wurde nicht gefunden.
  echo Bitte Python 3 installieren oder spaeter eine EXE-Version des KC Local Agent verwenden.
  pause
  exit /b 1
)
echo Starte KC Local Agent...
python kc_local_agent.py
pause
