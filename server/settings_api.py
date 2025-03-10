#!/usr/bin/env python3
import os
import sys
import json
import configparser
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set up paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
CONFIG_DIR = os.path.join(REPO_ROOT, "cfg")
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.ini")
MODELS_FILE = os.path.join(CONFIG_DIR, "models.json")

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get settings from config.ini"""
    if not os.path.exists(CONFIG_FILE):
        return jsonify({"error": "Config file not found"}), 404
    
    config = configparser.ConfigParser()
    config.read(CONFIG_FILE)
    
    settings = {}
    
    # General settings
    if 'General' in config:
        settings['theme'] = config['General'].get('theme', 'dark')
        settings['save_sessions'] = config['General'].getboolean('save_sessions', True)
    
    # Endpoints
    if 'Endpoints' in config:
        for key, value in config['Endpoints'].items():
            settings[key] = value
    
    # Containers
    if 'Containers' in config:
        settings['auto_start'] = config['Containers'].getboolean('auto_start', True)
        settings['container_engine'] = config['Containers'].get('container_engine', 'podman')
    
    # Hardware
    if 'Hardware' in config:
        settings['gpu_vendor'] = config['Hardware'].get('gpu_vendor', 'auto')
        settings['gpu_memory'] = config['Hardware'].get('gpu_memory_limit', '8G').replace('G', '')
        settings['acceleration'] = config['Hardware'].getboolean('acceleration', True)
        settings['platform'] = config['Hardware'].get('platform', 'auto')
        settings['power_mode'] = config['Hardware'].get('power_mode', 'balanced')
    
    # LLM API keys
    if 'API_Keys' in config:
        for key, value in config['API_Keys'].items():
            settings[key] = value
    
    return jsonify(settings)

@app.route('/api/settings', methods=['POST'])
def update_settings():
    """Update settings in config.ini"""
    if not os.path.exists(CONFIG_FILE):
        # Create config directory if it doesn't exist
        os.makedirs(CONFIG_DIR, exist_ok=True)
        
        # Create empty config file
        with open(CONFIG_FILE, 'w') as f:
            f.write('')
    
    # Load existing config
    config = configparser.ConfigParser()
    config.read(CONFIG_FILE)
    
    # Ensure sections exist
    if 'General' not in config:
        config['General'] = {}
    if 'Endpoints' not in config:
        config['Endpoints'] = {}
    if 'Containers' not in config:
        config['Containers'] = {}
    if 'Hardware' not in config:
        config['Hardware'] = {}
    if 'API_Keys' not in config:
        config['API_Keys'] = {}
    
    # Get settings from request
    settings = request.json
    
    # Update General settings
    if 'theme' in settings:
        config['General']['theme'] = settings['theme']
    if 'save_sessions' in settings:
        config['General']['save_sessions'] = str(settings['save_sessions']).lower()
    
    # Update Endpoints
    for key in settings:
        if key.endswith('_api'):
            config['Endpoints'][key] = settings[key]
    
    # Update Containers
    if 'auto_start' in settings:
        config['Containers']['auto_start'] = str(settings['auto_start']).lower()
    if 'container_engine' in settings:
        config['Containers']['container_engine'] = settings['container_engine']
    
    # Update Hardware
    if 'gpu_vendor' in settings:
        config['Hardware']['gpu_vendor'] = settings['gpu_vendor']
    if 'gpu_memory' in settings:
        config['Hardware']['gpu_memory_limit'] = f"{settings['gpu_memory']}G"
    if 'acceleration' in settings:
        config['Hardware']['acceleration'] = str(settings['acceleration']).lower()
    if 'platform' in settings:
        config['Hardware']['platform'] = settings['platform']
    if 'power_mode' in settings:
        config['Hardware']['power_mode'] = settings['power_mode']
    
    # Update API Keys
    if 'anthropic_key' in settings:
        config['API_Keys']['anthropic_key'] = settings['anthropic_key']
    if 'openai_key' in settings:
        config['API_Keys']['openai_key'] = settings['openai_key']
    if 'gemini_key' in settings:
        config['API_Keys']['gemini_key'] = settings['gemini_key']
    
    # Write config to file
    with open(CONFIG_FILE, 'w') as f:
        config.write(f)
    
    return jsonify({"status": "success"})

@app.route('/api/proxy/claude/models', methods=['GET'])
def proxy_claude_models():
    """Proxy for Claude models API"""
    # Get API key from config
    config = configparser.ConfigParser()
    config.read(CONFIG_FILE)
    
    if 'API_Keys' not in config or 'anthropic_key' not in config['API_Keys']:
        return jsonify({"error": "Claude API key not found in config"}), 401
    
    api_key = config['API_Keys']['anthropic_key']
    
    # Forward request to Claude API
    try:
        response = requests.get(
            'https://api.anthropic.com/v1/models',
            headers={
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01'
            }
        )
        
        return Response(
            response.content,
            status=response.status_code,
            content_type=response.headers.get('Content-Type', 'application/json')
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/proxy/claude/messages', methods=['POST'])
def proxy_claude_messages():
    """Proxy for Claude messages API"""
    # Get API key from config
    config = configparser.ConfigParser()
    config.read(CONFIG_FILE)
    
    if 'API_Keys' not in config or 'anthropic_key' not in config['API_Keys']:
        return jsonify({"error": "Claude API key not found in config"}), 401
    
    api_key = config['API_Keys']['anthropic_key']
    
    # Forward request to Claude API
    try:
        # Get request data
        data = request.json
        
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            json=data,
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01'
            }
        )
        
        return Response(
            response.content,
            status=response.status_code,
            content_type=response.headers.get('Content-Type', 'application/json')
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/proxy/openai/<path:endpoint>', methods=['GET', 'POST'])
def proxy_openai(endpoint):
    """Proxy for OpenAI API"""
    # Get API key from config
    config = configparser.ConfigParser()
    config.read(CONFIG_FILE)
    
    if 'API_Keys' not in config or 'openai_key' not in config['API_Keys']:
        return jsonify({"error": "OpenAI API key not found in config"}), 401
    
    api_key = config['API_Keys']['openai_key']
    
    # Forward request to OpenAI API
    try:
        url = f'https://api.openai.com/v1/{endpoint}'
        
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        if request.method == 'GET':
            response = requests.get(url, headers=headers)
        else:  # POST
            data = request.json
            response = requests.post(url, json=data, headers=headers)
        
        return Response(
            response.content,
            status=response.status_code,
            content_type=response.headers.get('Content-Type', 'application/json')
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/proxy/gemini/<path:endpoint>', methods=['GET', 'POST'])
def proxy_gemini(endpoint):
    """Proxy for Google Gemini API"""
    # Get API key from config
    config = configparser.ConfigParser()
    config.read(CONFIG_FILE)
    
    if 'API_Keys' not in config or 'gemini_key' not in config['API_Keys']:
        return jsonify({"error": "Gemini API key not found in config"}), 401
    
    api_key = config['API_Keys']['gemini_key']
    
    # Forward request to Gemini API
    try:
        url = f'https://generativelanguage.googleapis.com/v1/{endpoint}'
        
        # Add API key as query parameter
        if '?' in url:
            url += f'&key={api_key}'
        else:
            url += f'?key={api_key}'
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        if request.method == 'GET':
            response = requests.get(url, headers=headers)
        else:  # POST
            data = request.json
            response = requests.post(url, json=data, headers=headers)
        
        return Response(
            response.content,
            status=response.status_code,
            content_type=response.headers.get('Content-Type', 'application/json')
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    """Get LLM models from models.json"""
    if not os.path.exists(MODELS_FILE):
        # If models file doesn't exist, create it with default models
        default_models = {
            "claude": [
                "claude-3-7-sonnet",
                "claude-3-5-sonnet-20241022",
                "claude-3-5-haiku",
                "claude-3-5-sonnet-20240620",
                "claude-3-haiku",
                "claude-3-opus"
            ],
            "openai": [
                "gpt-4o-2024-05-13",
                "gpt-4-turbo-2024-04-09",
                "gpt-4-vision-preview",
                "gpt-4-1106-preview",
                "gpt-3.5-turbo-0125"
            ],
            "gemini": [
                "gemini-1.5-pro-latest",
                "gemini-1.5-flash-latest",
                "gemini-1.5-pro-001",
                "gemini-1.5-flash-001",
                "gemini-1.0-pro-latest",
                "gemini-1.0-pro-vision-latest"
            ]
        }
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(MODELS_FILE), exist_ok=True)
        
        # Write default models to file
        with open(MODELS_FILE, 'w') as f:
            json.dump(default_models, f, indent=2)
        
        return jsonify(default_models)
    
    try:
        # Read models from file
        with open(MODELS_FILE, 'r') as f:
            models = json.load(f)
        
        return jsonify(models)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/models/<provider>', methods=['GET'])
def get_provider_models(provider):
    """Get models for a specific LLM provider"""
    if not os.path.exists(MODELS_FILE):
        return jsonify({"error": "Models file not found"}), 404
    
    try:
        # Read models from file
        with open(MODELS_FILE, 'r') as f:
            models = json.load(f)
        
        if provider not in models:
            return jsonify({"error": f"Provider '{provider}' not found"}), 404
        
        return jsonify(models[provider])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/models', methods=['POST'])
def update_models():
    """Update LLM models in models.json"""
    if not os.path.exists(MODELS_FILE):
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(MODELS_FILE), exist_ok=True)
        
        # Create empty models file
        with open(MODELS_FILE, 'w') as f:
            json.dump({}, f)
    
    try:
        # Get models from request
        models = request.json
        
        # Write models to file
        with open(MODELS_FILE, 'w') as f:
            json.dump(models, f, indent=2)
        
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # If run directly, start the API server
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5051
    print(f"Starting settings API server on port {port}...")
    print(f"API will be available at http://localhost:{port}/api/settings")
    app.run(host='0.0.0.0', port=port, debug=False)
