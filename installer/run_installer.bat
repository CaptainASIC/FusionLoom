@echo off
REM FusionLoom Installer Launcher for Windows

setlocal enabledelayedexpansion

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "REPO_ROOT=%SCRIPT_DIR%.."

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Python is required but not installed.
    exit /b 1
)

REM Check if pip is installed
where pip >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: pip is required but not installed.
    exit /b 1
)

REM Check if virtual environment exists, if not create it
if not exist "%SCRIPT_DIR%venv\" (
    echo Creating virtual environment...
    python -m venv "%SCRIPT_DIR%venv"
)

REM Activate virtual environment
call "%SCRIPT_DIR%venv\Scripts\activate.bat"

REM Install requirements
echo Installing requirements...
pip install -r "%SCRIPT_DIR%requirements.txt"

REM Run the installer
echo Starting FusionLoom Installer...
streamlit run "%SCRIPT_DIR%fusionloom_installer.py" -- --server.headless=false --server.port=8501

REM Deactivate virtual environment
call deactivate

echo FusionLoom Installer closed.
