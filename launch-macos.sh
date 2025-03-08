#!/bin/bash

# FusionLoom macOS Launch Script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if .env file exists, if not, run setup
if [ ! -f "${SCRIPT_DIR}/.env" ]; then
    echo "Environment file not found. Running macOS setup first..."
    "${SCRIPT_DIR}/macos-setup.sh"
    exit 0
fi

# Source the environment file
source "${SCRIPT_DIR}/.env"

# Create data directory if it doesn't exist
mkdir -p "${DATA_PATH}/ollama"

# Set version
FUSION_LOOM_VERSION="0.2"

echo "Starting FusionLoom v${FUSION_LOOM_VERSION} for macOS..."
echo "The web UI will be available at http://localhost:8080 once startup is complete."

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

# Stop any existing containers to avoid conflicts
if [ "${CONTAINER_ENGINE}" = "docker" ]; then
    docker stop fusionloom-webui 2>/dev/null || true
    docker rm fusionloom-webui 2>/dev/null || true
elif [ "${CONTAINER_ENGINE}" = "podman" ]; then
    podman stop fusionloom-webui 2>/dev/null || true
    podman rm fusionloom-webui 2>/dev/null || true
fi

# Start the web UI container
if [ "${CONTAINER_ENGINE}" = "docker" ]; then
    cd "${SCRIPT_DIR}/compose/docker"
    UI_PATH="${SCRIPT_DIR}/ui" docker-compose up -d
elif [ "${CONTAINER_ENGINE}" = "podman" ]; then
    cd "${SCRIPT_DIR}/compose/podman"
    UI_PATH="${SCRIPT_DIR}/ui" podman-compose -f podman-compose-macos.yaml up -d
else
    echo "Error: No container engine configured. Please run macos-setup.sh first."
    exit 1
fi

# Start the Ollama container with platform detection
echo "Starting Ollama container with platform-specific optimizations..."
"${SCRIPT_DIR}/launch-ollama.sh"

echo "FusionLoom v${FUSION_LOOM_VERSION} started successfully!"
echo "Access the web interface at: http://localhost:8080"
echo "Ollama API available at: http://localhost:11434"
