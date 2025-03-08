#!/bin/bash

# Make sure the script is executable
chmod +x system_info.py

# Install required dependencies if not already installed
pip install flask flask-cors

# Run the system info API server
python3 system_info.py --serve 5050
