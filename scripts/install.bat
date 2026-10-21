@echo off
REM ==============================================================================
REM Ocean Literacy Desktop Application - Windows Setup & Installation Script
REM ==============================================================================

echo ==========================================================
echo       OCEAN LITERACY DESKTOP - WINDOWS SETUP SCRIPT
echo ==========================================================

REM 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Error: Node.js is not found. Please install Node.js from https://nodejs.org
  pause
  exit /b 1
)
echo [OK] Node.js is installed.

REM 2. Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo Error: npm is not found.
  pause
  exit /b 1
)
echo [OK] npm is installed.

REM 3. Generate Icons & Assets
echo Generating desktop application assets...
node scripts\generate-icons.js

REM 4. Run Tests
echo Running system sanity checks...
node test\app.test.js

echo.
echo ==========================================================
echo Setup ready! To launch the desktop application, run:
echo    npm install
echo    npm start
echo.
echo To package Windows installer (.exe):
echo    npm run dist:win
echo ==========================================================
pause
