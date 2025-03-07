#!/bin/bash

# FusionLoom Arch Linux Setup Script
# This script provides a workaround for Arch Linux systems where podman-py is not compatible

# Capture the current working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if we're on Arch Linux
if [ ! -f /etc/arch-release ]; then
    echo "This script is specifically for Arch Linux systems."
    echo "For other systems, please use the standard setup.sh script."
    exit 1
fi

echo "Setting up FusionLoom for Arch Linux..."

# Check for Podman
if command -v podman &> /dev/null; then
    CONTAINER_ENGINE="podman"
    echo "Podman detected, will use Podman for containers"
elif command -v docker &> /dev/null; then
    CONTAINER_ENGINE="docker"
    echo "Docker detected, will use Docker for containers"
else
    echo "Neither Docker nor Podman found. Please install one of them first."
    exit 1
fi

# Create necessary directories
mkdir -p "${SCRIPT_DIR}/data"
mkdir -p "${SCRIPT_DIR}/logs"
mkdir -p "${SCRIPT_DIR}/cfg"

# Ensure UI directory structure exists
if [ ! -d "${SCRIPT_DIR}/ui" ]; then
    echo "UI directory not found. Creating UI directory structure..."
    mkdir -p "${SCRIPT_DIR}/ui/static/css"
    mkdir -p "${SCRIPT_DIR}/ui/static/js"
    mkdir -p "${SCRIPT_DIR}/ui/static/img"
fi

# Create a minimal environment file
ENV_FILE="${SCRIPT_DIR}/.env"
echo "Creating environment file..."
cat > "$ENV_FILE" << EOL
# FusionLoom Environment Configuration
FUSION_LOOM_VERSION=0.1
CONTAINER_ENGINE=${CONTAINER_ENGINE}

# Data directories
DATA_DIR=${SCRIPT_DIR}/data
LOGS_DIR=${SCRIPT_DIR}/logs
UI_DIR=${SCRIPT_DIR}/ui
EOL

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

# Create basic configuration
CONFIG_DIR="${SCRIPT_DIR}/cfg"
CONFIG_FILE="${CONFIG_DIR}/config.ini"

echo "Creating basic configuration..."
mkdir -p "${CONFIG_DIR}"
cat > "${CONFIG_FILE}" << EOL
[General]
theme = dark
save_sessions = true

[Endpoints]
ollama_api = http://localhost:11434

[Containers]
auto_start = true
container_engine = ${CONTAINER_ENGINE}

[Hardware]
gpu_vendor = auto
gpu_memory_limit = 8G
acceleration = true
platform = auto
power_mode = balanced
EOL

# Set up Ollama
echo "Setting up Ollama..."
mkdir -p "${SCRIPT_DIR}/data/ollama"

# Copy the appropriate compose file based on architecture
ARCH=$(uname -m)
if [ "${ARCH}" = "x86_64" ]; then
    PLATFORM_DIR="amd"
elif [ "${ARCH}" = "aarch64" ]; then
    PLATFORM_DIR="arm"
else
    PLATFORM_DIR="x86"
fi

# Copy the compose file
if [ -f "${SCRIPT_DIR}/compose/platforms/${PLATFORM_DIR}/ollama-compose.yaml" ]; then
    cp "${SCRIPT_DIR}/compose/platforms/${PLATFORM_DIR}/ollama-compose.yaml" "${SCRIPT_DIR}/data/ollama/docker-compose.yaml"
    echo "Copied ${PLATFORM_DIR} compose file for Ollama"
else
    echo "Warning: Could not find compose file for platform ${PLATFORM_DIR}"
    echo "Using default x86 compose file"
    cp "${SCRIPT_DIR}/compose/platforms/x86/ollama-compose.yaml" "${SCRIPT_DIR}/data/ollama/docker-compose.yaml"
fi

echo "FusionLoom setup for Arch Linux completed successfully!"
echo "Run ./launch.sh to start the application."

# Make the launch and stop scripts executable
chmod +x "${SCRIPT_DIR}/launch.sh"
chmod +x "${SCRIPT_DIR}/stop.sh"
chmod +x "${SCRIPT_DIR}/launch-ollama.sh"
chmod +x "${SCRIPT_DIR}/stop-ollama.sh"
