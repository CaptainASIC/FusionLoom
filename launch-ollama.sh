#!/bin/bash

# FusionLoom Ollama Container Launcher
# This script detects the hardware platform and launches the appropriate Ollama container

# Set the base directory
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PLATFORMS_DIR="$BASE_DIR/compose/platforms"
CONTAINER_NAME="fusionloom-ollama"

# Function to detect container engine
detect_container_engine() {
    if command -v podman &> /dev/null; then
        echo "podman"
    elif command -v docker &> /dev/null; then
        echo "docker"
    else
        echo "none"
    fi
}

# Function to create network if it doesn't exist
create_network_if_needed() {
    local engine=$1
    local network_exists=false
    
    if [ "$engine" = "podman" ]; then
        if podman network ls | grep -q "fusionloom_net"; then
            network_exists=true
        fi
    elif [ "$engine" = "docker" ]; then
        if docker network ls | grep -q "fusionloom_net"; then
            network_exists=true
        fi
    fi
    
    if [ "$network_exists" = false ]; then
        echo "Creating fusionloom_net network..."
        if [ "$engine" = "podman" ]; then
            podman network create fusionloom_net
        elif [ "$engine" = "docker" ]; then
            docker network create fusionloom_net
        fi
    else
        echo "Network fusionloom_net already exists, skipping creation."
    fi
}

# Function to detect hardware platform
detect_platform() {
    # Check for NVIDIA DGX/Digit
    if [ -f "/etc/dgx-release" ] || grep -q "NVIDIA DGX" /proc/cpuinfo 2>/dev/null; then
        echo "dgx_digit"
        return
    fi
    
    # Check for NVIDIA Jetson
    if [ -f "/etc/nv_tegra_release" ]; then
        # Differentiate between Orin and AGX
        if grep -q "ORIN" /proc/device-tree/model 2>/dev/null; then
            echo "jetson/orin"
        else
            echo "jetson/agx"
        fi
        return
    fi
    
    # Check for Apple Silicon
    if [ "$(uname)" = "Darwin" ] && [ "$(uname -m)" = "arm64" ]; then
        echo "apple_silicon"
        return
    fi
    
    # Check for NVIDIA GPU
    if command -v nvidia-smi &> /dev/null; then
        echo "nvidia"
        return
    fi
    
    # Check for AMD GPU with ROCm
    if command -v rocminfo &> /dev/null || [ -d "/opt/rocm" ]; then
        echo "amd"
        return
    fi
    
    # Check for ARM CPU
    if [ "$(uname -m)" = "aarch64" ] || [ "$(uname -m)" = "armv7l" ]; then
        echo "arm"
        return
    fi
    
    # Default to x86
    echo "x86"
}

# Main execution
echo "FusionLoom Ollama Container Launcher"
echo "------------------------------------"

# Detect container engine
ENGINE=$(detect_container_engine)
if [ "$ENGINE" = "none" ]; then
    echo "Error: No container engine found. Please install Docker or Podman."
    exit 1
fi
echo "Using container engine: $ENGINE"

# Create network if needed
create_network_if_needed "$ENGINE"

# Detect platform
PLATFORM=$(detect_platform)
echo "Detected platform: $PLATFORM"

# For backward compatibility, map apple_silicon to apple
if [ "$PLATFORM" = "apple_silicon" ]; then
    PLATFORM_DIR="apple"
else
    PLATFORM_DIR="$PLATFORM"
fi

# Check if the platform directory exists
if [ ! -d "$PLATFORMS_DIR/$PLATFORM_DIR" ]; then
    echo "Error: Platform directory not found: $PLATFORMS_DIR/$PLATFORM_DIR"
    echo "Falling back to x86 platform."
    PLATFORM_DIR="x86"
fi

# Check if the container is already running
CONTAINER_RUNNING=false
if [ "$ENGINE" = "podman" ]; then
    if podman ps | grep -q "$CONTAINER_NAME"; then
        CONTAINER_RUNNING=true
    fi
elif [ "$ENGINE" = "docker" ]; then
    if docker ps | grep -q "$CONTAINER_NAME"; then
        CONTAINER_RUNNING=true
    fi
fi

if [ "$CONTAINER_RUNNING" = true ]; then
    echo "Container $CONTAINER_NAME is already running."
    exit 0
fi

# Create data directory if it doesn't exist
mkdir -p "$PLATFORMS_DIR/$PLATFORM_DIR/data/ollama"

# Launch the container
echo "Launching Ollama container for platform: $PLATFORM_DIR"
cd "$PLATFORMS_DIR/$PLATFORM_DIR"

if [ "$ENGINE" = "podman" ]; then
    podman-compose -f ollama-compose.yaml up -d
elif [ "$ENGINE" = "docker" ]; then
    docker-compose -f ollama-compose.yaml up -d
fi

# Check if the container started successfully
if [ $? -eq 0 ]; then
    echo "Ollama container started successfully."
    echo "API available at: http://localhost:11434"
else
    echo "Error: Failed to start Ollama container."
    exit 1
fi
