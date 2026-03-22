@echo off
REM Setup script for local development on Windows
REM This script helps you test the app locally before deploying to GitHub Pages

echo.
echo 🎉 Personal CMS - Local Development Setup
echo ==========================================
echo.

REM Check if we're in the project directory
if not exist "index.html" (
    echo ❌ Error: index.html not found. Please run this script from the project root.
    exit /b 1
)

echo ✅ Project files detected.
echo.

REM Try Python 3
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Python 3
    echo.
    echo Server running at: http://localhost:8000
    echo.
    echo 📂 Test URLs:
    echo    Frontend:  http://localhost:8000/index.html
    echo    Admin:     http://localhost:8000/admin.html
    echo.
    echo ⚠️ For admin panel to work locally:
    echo    - You still need valid GitHub credentials
    echo    - Create Personal Access Token at: https://github.com/settings/tokens
    echo    - Use that token in the admin panel
    echo.
    echo Press Ctrl+C to stop the server...
    echo.
    
    python -m http.server 8000
    exit /b 0
)

REM Try Node.js if Python not available
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Node.js
    echo.
    echo Server running at: http://localhost:8000
    echo Press Ctrl+C to stop the server...
    echo.
    
    npx http-server
    exit /b 0
)

REM Fallback instructions
echo ❌ No development server found.
echo.
echo Please install one of the following:
echo   1. Python 3 (https://www.python.org)
echo   2. Node.js (https://nodejs.org)
echo.
echo Or start a manual server and visit:
echo   http://localhost:your-port/index.html
echo.
pause
