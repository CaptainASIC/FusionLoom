#!/bin/bash

# Make sure the script is executable
chmod +x settings_api.py

# Install required dependencies if not already installed
pip install flask flask-cors requests

# Run the settings API server
python3 settings_api.py 5052
