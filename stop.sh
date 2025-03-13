#!/bin/bash

# FusionLoom Stop Script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if .env file exists
if [ ! -f "${SCRIPT_DIR}/.env" ]; then
    echo "Environment file not found. Please run setup.sh first."
    exit 1
fi

# Source the environment file
source "${SCRIPT_DIR}/.env"

echo "Stopping FusionLoom v${FUSION_LOOM_VERSION}..."

# Stop the system information API server
echo "Stopping system information API server..."
pkill -f "python3 system_info.py --serve 5050" || echo "System information API server was not running."

# Stop the settings API server
echo "Stopping settings API server..."
pkill -f "python3 settings_api.py 5052" || echo "Settings API server was not running."

# Stop the Ollama container if it's enabled
if [ -f "${SCRIPT_DIR}/cfg/config.ini" ] && grep -q "ollama_enabled = true" "${SCRIPT_DIR}/cfg/config.ini"; then
    echo "Stopping Ollama container..."
    "${SCRIPT_DIR}/stop-ollama.sh"
fi

# Function to stop a container
stop_container() {
    local container_name=$1
    local service_name=$2
    
    echo "Stopping ${service_name} container..."
    if [ "${CONTAINER_ENGINE}" = "docker" ]; then
        docker stop ${container_name} >/dev/null 2>&1 || echo "${service_name} container was not running."
    elif [ "${CONTAINER_ENGINE}" = "podman" ]; then
        podman stop ${container_name} >/dev/null 2>&1 || echo "${service_name} container was not running."
    fi
}

# Stop SillyTavern container if it's enabled
if [ -f "${SCRIPT_DIR}/cfg/config.ini" ] && grep -q "sillytavern_enabled = true" "${SCRIPT_DIR}/cfg/config.ini"; then
    stop_container "fusionloom-sillytavern" "SillyTavern"
fi

# Stop TavernAI container if it's enabled
if [ -f "${SCRIPT_DIR}/cfg/config.ini" ] && grep -q "tavernai_enabled = true" "${SCRIPT_DIR}/cfg/config.ini"; then
    stop_container "fusionloom-tavernai" "TavernAI"
fi

# Stop Oobabooga container if it's enabled
if [ -f "${SCRIPT_DIR}/cfg/config.ini" ] && grep -q "oobabooga_enabled = true" "${SCRIPT_DIR}/cfg/config.ini"; then
    stop_container "fusionloom-oobabooga" "Oobabooga"
fi

# Stop the web UI container
if [ "${CONTAINER_ENGINE}" = "docker" ]; then
    cd "${SCRIPT_DIR}/compose/docker"
    docker-compose down
elif [ "${CONTAINER_ENGINE}" = "podman" ]; then
    cd "${SCRIPT_DIR}/compose/podman"
    podman-compose down
else
    echo "Error: No container engine configured. Please run setup.sh first."
    exit 1
fi

echo "FusionLoom v${FUSION_LOOM_VERSION} stopped successfully!"
echo "All services have been stopped."
