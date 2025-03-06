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

echo "FusionLoom v${FUSION_LOOM_VERSION} started successfully!"
echo "Access the web interface at: http://localhost:8080"
