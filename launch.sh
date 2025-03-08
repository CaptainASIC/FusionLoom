#!/bin/bash

# FusionLoom Launch Script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if .env file exists, if not, run setup
if [ ! -f "${SCRIPT_DIR}/.env" ]; then
    echo "Environment file not found. Running setup first..."
    "${SCRIPT_DIR}/setup.sh"
    exit 0
fi

# Source the environment file
source "${SCRIPT_DIR}/.env"

# Create data directory if it doesn't exist
mkdir -p "${DATA_DIR}"

echo "Starting FusionLoom v${FUSION_LOOM_VERSION}..."
echo "The web UI will be available at http://localhost:8080 once startup is complete."

# Start the system information API server
echo "Starting system information API server..."
cd "${SCRIPT_DIR}/server"
# Check if Python and Flask are installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 to use the system information API."
else
    # Install Flask and flask-cors if not already installed
    python3 -m pip install flask flask-cors &> /dev/null
    # Start the API server in the background
    nohup python3 system_info.py --serve 5050 > "${SCRIPT_DIR}/logs/system_api.log" 2>&1 &
    echo "System information API started at http://localhost:5050/api/system-info"
fi
cd "${SCRIPT_DIR}"

# Create the fusionloom_net network if it doesn't exist
if [ "${CONTAINER_ENGINE}" = "docker" ]; then
    if ! docker network ls | grep -q "fusionloom_net"; then
        echo "Creating fusionloom_net network..."
        docker network create fusionloom_net
    else
        echo "Network fusionloom_net already exists, skipping creation."
    fi
elif [ "${CONTAINER_ENGINE}" = "podman" ]; then
    if ! podman network ls | grep -q "fusionloom_net"; then
        echo "Creating fusionloom_net network..."
        podman network create fusionloom_net
    else
        echo "Network fusionloom_net already exists, skipping creation."
    fi
fi

# Start the web UI container
if [ "${CONTAINER_ENGINE}" = "docker" ]; then
    cd "${SCRIPT_DIR}/compose/docker"
    docker-compose up -d
elif [ "${CONTAINER_ENGINE}" = "podman" ]; then
    cd "${SCRIPT_DIR}/compose/podman"
    podman-compose up -d
else
    echo "Error: No container engine configured. Please run setup.sh first."
    exit 1
fi

# Start the Ollama container with platform detection
echo "Starting Ollama container with platform-specific optimizations..."
"${SCRIPT_DIR}/launch-ollama.sh"

echo "FusionLoom v${FUSION_LOOM_VERSION} started successfully!"
echo "Access the web interface at: http://localhost:8080"
echo "Ollama API available at: http://localhost:11434"
echo "System info API available at: http://localhost:5050/api/system-info"
