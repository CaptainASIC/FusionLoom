#!/usr/bin/env python3
import os
import sys
import json
import configparser
import requests

# Set up paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
CONFIG_FILE = os.path.join(REPO_ROOT, "cfg", "config.ini")

def test_settings_api():
    """Test the settings API"""
    print("Testing settings API...")
    
    # Check if config.ini exists
    if not os.path.exists(CONFIG_FILE):
        print(f"Error: Config file not found at {CONFIG_FILE}")
        return False
    
    # Read config.ini
    config = configparser.ConfigParser()
    config.read(CONFIG_FILE)
    
    # Check if API_Keys section exists
    if 'API_Keys' not in config:
        print("Error: API_Keys section not found in config.ini")
        return False
    
    # Check if API keys are set
    print("\nAPI Keys in config.ini:")
    for key, value in config['API_Keys'].items():
        print(f"  {key}: {'*' * len(value) if value else 'Not set'}")
    
    # Test settings API
    try:
        response = requests.get('http://localhost:5052/api/settings')
        if response.status_code != 200:
            print(f"Error: Failed to get settings from API: {response.status_code}")
            return False
        
        settings = response.json()
        
        print("\nAPI Keys from settings API:")
        for key in ['anthropic_key', 'openai_key', 'gemini_key']:
            if key in settings:
                print(f"  {key}: {'*' * len(settings[key]) if settings[key] else 'Not set'}")
            else:
                print(f"  {key}: Not found in API response")
        
        return True
    except Exception as e:
        print(f"Error: Failed to connect to settings API: {e}")
        return False

if __name__ == '__main__':
    # Check if settings API is running
    try:
        requests.get('http://localhost:5052/api/settings')
    except:
        print("Error: Settings API is not running. Please start it with:")
        print("  cd FusionLoom/server && python3 settings_api.py 5052")
        sys.exit(1)
    
    # Test settings API
    success = test_settings_api()
    
    if success:
        print("\nSettings API test completed successfully!")
    else:
        print("\nSettings API test failed!")
