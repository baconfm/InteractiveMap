@echo off
setlocal
cd /d "%~dp0"

echo Starting the Days Gone map at http://localhost:8000/readonly/
start "" "http://localhost:8000/readonly/"

where py >nul 2>nul
if %errorlevel% equ 0 (
  py -m http.server 8000
) else (
  where python >nul 2>nul
  if %errorlevel% equ 0 (
    python -m http.server 8000
  ) else (
    echo.
    echo Python is required to run this local map server.
    echo Install Python from https://www.python.org/downloads/ and run this file again.
    pause
  )
)
