@echo off
cd /d "%~dp0"
title Mourya Dry Cleaners Local Host
echo ====================================================
echo Starting local web server for Mourya Dry Cleaners...
echo Local Address:  http://localhost:8000
echo ====================================================

start http://localhost:8000

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    node server.js
) else (
    where python >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        python -m http.server 8000
    ) else (
        echo Neither Node.js nor Python was found on your PATH.
        echo Please install Node.js (https://nodejs.org) to run this local server.
        pause
    )
)
