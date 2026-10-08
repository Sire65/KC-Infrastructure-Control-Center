@echo off
rem KICC-F-098: KC Local Agent per Doppelklick aktualisieren.
rem Laedt die aktuelle kc_local_agent.py aus dem KICC-Repository (main), prueft sie,
rem sichert die alte Datei und startet den Agenten neu. Bei Fehlern bleibt alles wie es war.
setlocal
cd /d "%~dp0"
set "URL=https://raw.githubusercontent.com/Sire65/KC-Infrastructure-Control-Center/main/agent/kc_local_agent.py"
set "PY=%LocalAppData%\Programs\Python\Python313\python.exe"
if not exist "%PY%" set "PY=python"

echo Lade aktuellen KC Local Agent ...
powershell -NoProfile -Command "Invoke-WebRequest -UseBasicParsing -Uri '%URL%' -OutFile 'kc_local_agent.new.py'"
if errorlevel 1 goto fail
"%PY%" -m py_compile kc_local_agent.new.py
if errorlevel 1 goto fail
findstr /c:"ALLOWED_ORIGINS" kc_local_agent.new.py >nul
if errorlevel 1 goto fail

if exist kc_local_agent.py copy /y kc_local_agent.py kc_local_agent.backup.py >nul
move /y kc_local_agent.new.py kc_local_agent.py >nul

echo Starte KC Local Agent neu ...
schtasks /End /TN "KC Local Agent" >nul 2>&1
timeout /t 2 >nul
schtasks /Run /TN "KC Local Agent" >nul 2>&1
if errorlevel 1 start "" "%PY%" kc_local_agent.py
timeout /t 3 >nul
start "" "http://127.0.0.1:8765/health"
echo.
echo Fertig. Im Browserfenster muss "version": "0.4.1" oder neuer stehen.
echo Die vorige Version liegt als kc_local_agent.backup.py daneben.
pause
exit /b 0

:fail
echo.
echo Aktualisierung fehlgeschlagen. Der bisherige Agent bleibt unveraendert in Betrieb.
if exist kc_local_agent.new.py del kc_local_agent.new.py
pause
exit /b 1
