#!/bin/bash

# FusionLoom Installer Launcher
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 is required but not installed."
    exit 1
fi

# Check if virtual environment exists, if not create it
if [ ! -d "${SCRIPT_DIR}/venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "${SCRIPT_DIR}/venv"
fi

# Activate virtual environment
source "${SCRIPT_DIR}/venv/bin/activate"

# Install requirements
echo "Installing requirements..."
pip install -r "${SCRIPT_DIR}/requirements.txt"

# Run the installer
echo "Starting FusionLoom Installer..."
# Use the full path to streamlit in the virtual environment
"${SCRIPT_DIR}/venv/bin/streamlit" run "${SCRIPT_DIR}/fusionloom_installer.py" -- --server.headless=false --server.port=8501

# Check the exit code
INSTALLER_EXIT_CODE=$?
if [ $INSTALLER_EXIT_CODE -eq 0 ]; then
    echo "Installer completed successfully."
else
    echo "Installer exited with code: $INSTALLER_EXIT_CODE"
fi
