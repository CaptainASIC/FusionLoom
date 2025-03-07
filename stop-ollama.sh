#!/bin/bash

# FusionLoom Ollama Container Stopper
# This script stops the running Ollama container

# Set the container name
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

# Main execution
echo "FusionLoom Ollama Container Stopper"
echo "-----------------------------------"

# Detect container engine
ENGINE=$(detect_container_engine)
if [ "$ENGINE" = "none" ]; then
    echo "Error: No container engine found. Please install Docker or Podman."
    exit 1
fi
echo "Using container engine: $ENGINE"

# Check if the container is running
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

if [ "$CONTAINER_RUNNING" = false ]; then
    echo "Container $CONTAINER_NAME is not running."
    exit 0
fi

# Stop the container
echo "Stopping Ollama container..."
if [ "$ENGINE" = "podman" ]; then
    podman stop "$CONTAINER_NAME"
elif [ "$ENGINE" = "docker" ]; then
    docker stop "$CONTAINER_NAME"
fi

# Check if the container stopped successfully
if [ $? -eq 0 ]; then
    echo "Ollama container stopped successfully."
else
    echo "Error: Failed to stop Ollama container."
    exit 1
fi
