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

# Stop the Ollama container
echo "Stopping Ollama container..."
"${SCRIPT_DIR}/stop-ollama.sh"

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
