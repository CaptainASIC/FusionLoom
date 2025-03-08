#!/bin/bash

# FusionLoom macOS Setup Script
# This script provides a setup for macOS systems

# Capture the current working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if we're on macOS
if [ "$(uname)" != "Darwin" ]; then
    echo "This script is specifically for macOS systems."
    echo "For other systems, please use the standard setup.sh script."
    exit 1
fi

echo "Setting up FusionLoom for macOS..."

# Set up colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect if Docker or Podman is installed
if command -v docker &> /dev/null; then
    CONTAINER_ENGINE="docker"
    echo -e "${GREEN}Docker detected, will use Docker for containers${NC}"
elif command -v podman &> /dev/null; then
    CONTAINER_ENGINE="podman"
    echo -e "${GREEN}Podman detected, will use Podman for containers${NC}"
else
    echo -e "${YELLOW}No container engine detected. Installing Podman...${NC}"
    if command -v brew &> /dev/null; then
        brew install podman
        CONTAINER_ENGINE="podman"
        echo -e "${GREEN}Podman installed successfully${NC}"
    else
        echo -e "${YELLOW}Homebrew not found. Installing Homebrew...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        brew install podman
        CONTAINER_ENGINE="podman"
        echo -e "${GREEN}Podman installed successfully${NC}"
    fi
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

# Create initial environment file
ENV_FILE="${SCRIPT_DIR}/.env"
echo -e "${BLUE}Creating initial environment file...${NC}"
cat > "$ENV_FILE" << EOL
# FusionLoom Environment Configuration
FUSION_LOOM_VERSION=0.2
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
gpu_vendor = apple
gpu_memory_limit = 8G
acceleration = true
platform = apple_silicon
power_mode = balanced
EOL

# Set up Ollama
echo "Setting up Ollama..."
mkdir -p "${SCRIPT_DIR}/data/ollama"

# Detect platform
PLATFORM="unknown"
if [[ $(uname -m) == "arm64" ]]; then
    PLATFORM="apple_silicon"
    echo -e "${GREEN}Detected Apple Silicon (ARM64)${NC}"
elif [[ $(uname -m) == "x86_64" ]]; then
    PLATFORM="intel_mac"
    echo -e "${GREEN}Detected Intel Mac (x86_64)${NC}"
else
    echo -e "${YELLOW}Unknown macOS platform: $(uname -m), defaulting to Intel Mac${NC}"
    PLATFORM="intel_mac"
fi

# Add platform to environment file
echo "PLATFORM=${PLATFORM}" >> "$ENV_FILE"

# Copy the appropriate compose file
if [ "${PLATFORM}" = "apple_silicon" ]; then
    PLATFORM_DIR="apple"
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

# Check if Python is installed
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${YELLOW}Python not found. Installing Python...${NC}"
    brew install python
    PYTHON_CMD="python3"
    echo -e "${GREEN}Python installed successfully${NC}"
fi

# Install required Python packages
echo -e "${BLUE}Installing requirements...${NC}"
$PYTHON_CMD -m pip install streamlit>=1.28.0 pyyaml>=6.0 psutil>=5.9.0 py-cpuinfo>=9.0.0 gputil>=1.4.0 docker>=6.0.0

# Make scripts executable
chmod +x "${SCRIPT_DIR}/launch.sh"
chmod +x "${SCRIPT_DIR}/stop.sh"
chmod +x "${SCRIPT_DIR}/launch-ollama.sh"
chmod +x "${SCRIPT_DIR}/stop-ollama.sh"

echo -e "${GREEN}FusionLoom setup for macOS completed successfully!${NC}"

# Ask if the user wants to launch the application
echo "Would you like to launch FusionLoom now?"
read -p "Launch now? (y/n): " LAUNCH_NOW

if [ "$LAUNCH_NOW" = "y" ] || [ "$LAUNCH_NOW" = "Y" ]; then
    echo "Launching FusionLoom..."
    "${SCRIPT_DIR}/launch.sh"
else
    echo "You can start FusionLoom by running: ./launch.sh"
fi
