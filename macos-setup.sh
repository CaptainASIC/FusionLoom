#!/bin/bash

# FusionLoom macOS Setup Script
# This script sets up FusionLoom for macOS

# Set up colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the base directory
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}FusionLoom macOS Setup${NC}"
echo -e "${BLUE}======================${NC}"

# Check if running on macOS
if [ "$(uname)" != "Darwin" ]; then
    echo -e "${RED}This script is intended for macOS only.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${BLUE}Creating necessary directories...${NC}"
mkdir -p "$BASE_DIR/data"
mkdir -p "$BASE_DIR/logs"
mkdir -p "$BASE_DIR/compose/docker/data"
mkdir -p "$BASE_DIR/compose/podman/data"
mkdir -p "$BASE_DIR/compose/platforms/apple/data/ollama"

# Create environment file
echo -e "${BLUE}Creating environment file...${NC}"
cat > "$BASE_DIR/.env" << EOL
# FusionLoom Environment Configuration
FUSION_LOOM_VERSION=0.1
CONTAINER_ENGINE=podman
INSTALL_DIR=$BASE_DIR

# Data directories
DATA_DIR=$BASE_DIR/data
LOGS_DIR=$BASE_DIR/logs
UI_DIR=$BASE_DIR/ui
EOL

# Check for container engine
if command -v podman &> /dev/null; then
    echo -e "${GREEN}Podman detected, using Podman for containers${NC}"
    sed -i '' 's/CONTAINER_ENGINE=.*/CONTAINER_ENGINE=podman/g' "$BASE_DIR/.env"
elif command -v docker &> /dev/null; then
    echo -e "${GREEN}Docker detected, using Docker for containers${NC}"
    sed -i '' 's/CONTAINER_ENGINE=.*/CONTAINER_ENGINE=docker/g' "$BASE_DIR/.env"
else
    echo -e "${YELLOW}Neither Docker nor Podman found. Please install one of them.${NC}"
    echo -e "${YELLOW}Recommended: brew install podman${NC}"
    exit 1
fi

# Make scripts executable
echo -e "${BLUE}Making scripts executable...${NC}"
chmod +x "$BASE_DIR/launch.sh"
chmod +x "$BASE_DIR/stop.sh"
chmod +x "$BASE_DIR/launch-ollama.sh"
chmod +x "$BASE_DIR/stop-ollama.sh"

echo -e "${GREEN}FusionLoom setup completed successfully!${NC}"
echo -e "${BLUE}Run ./launch.sh to start the application.${NC}"
