@echo off
setlocal
set "TASK=KC Local Agent"
set "HERE=%~dp0"
set "PY=%LocalAppData%\Programs\Python\Python313\python.exe"
if not exist "%PY%" set "PY=python"
schtasks /Create /F /SC ONLOGON /RL LIMITED /TN "%TASK%" /TR "\"%PY%\" \"%HERE%kc_local_agent.py\"" >nul 2>&1
if errorlevel 1 (
  echo KC Local Agent Autostart konnte nicht eingerichtet werden.
  echo Bitte diese Datei einmal mit normalen Benutzerrechten erneut starten.
  pause
  exit /b 1
)
echo KC Local Agent startet kuenftig automatisch bei der Windows-Anmeldung.
schtasks /Run /TN "%TASK%" >nul 2>&1
timeout /t 2 >nul
start "" "http://127.0.0.1:8765/health"
echo Healthcheck wurde geoeffnet.
pause
