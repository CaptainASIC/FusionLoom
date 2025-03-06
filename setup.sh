#!/bin/bash

# FusionLoom Setup Script
# This script sets up the FusionLoom environment and container requirements

# Capture the current working directory
WORKING_DIR=$(pwd)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set version
FUSION_LOOM_VERSION="0.1"
echo "Setting up FusionLoom v${FUSION_LOOM_VERSION}..."

# Check OS type
if [ -f /etc/debian_version ]; then
    OS_FAMILY="debian"
elif [ -f /etc/redhat-release ]; then
    OS_FAMILY="rhel"
elif [ -f /etc/arch-release ]; then
    OS_FAMILY="arch"
elif [ -f /etc/os-release ] && grep -q "ID=fedora" /etc/os-release; then
    OS_FAMILY="fedora"
else
    echo "Unsupported Linux distribution"
    exit 1
fi

# Create necessary directories
mkdir -p "${SCRIPT_DIR}/data"
mkdir -p "${SCRIPT_DIR}/logs"

# Check for container engine (Docker or Podman)
CONTAINER_ENGINE=""
if command -v docker &> /dev/null; then
    CONTAINER_ENGINE="docker"
    COMPOSE_COMMAND="docker-compose"
    echo "Docker detected, will use Docker for containers"
elif command -v podman &> /dev/null; then
    CONTAINER_ENGINE="podman"
    COMPOSE_COMMAND="podman-compose"
    echo "Podman detected, will use Podman for containers"
else
    echo "Neither Docker nor Podman found. Installing Podman..."
    
    # Install Podman based on OS
    if [ "$OS_FAMILY" = "debian" ]; then
        sudo apt-get update
        sudo apt-get install -y podman podman-compose
    elif [ "$OS_FAMILY" = "rhel" ] || [ "$OS_FAMILY" = "fedora" ]; then
        sudo dnf install -y podman podman-compose
    elif [ "$OS_FAMILY" = "arch" ]; then
        sudo pacman -Sy --needed podman podman-compose
    fi
    
    CONTAINER_ENGINE="podman"
    COMPOSE_COMMAND="podman-compose"
    echo "Podman installed successfully"
fi

# Create environment file
ENV_FILE="${SCRIPT_DIR}/.env"
echo "Creating environment file..."
cat > "$ENV_FILE" << EOL
# FusionLoom Environment Configuration
FUSION_LOOM_VERSION=${FUSION_LOOM_VERSION}
CONTAINER_ENGINE=${CONTAINER_ENGINE}

# Data directories
DATA_DIR=${SCRIPT_DIR}/data
LOGS_DIR=${SCRIPT_DIR}/logs
EOL

# Create the launch script
LAUNCH_SCRIPT="${SCRIPT_DIR}/launch.sh"
echo "Creating launch script..."
cat > "$LAUNCH_SCRIPT" << EOL
#!/bin/bash

# FusionLoom v${FUSION_LOOM_VERSION} Launch Script
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
source "\${SCRIPT_DIR}/.env"

# Create data directory if it doesn't exist
mkdir -p "\${DATA_DIR}"

echo "Starting FusionLoom v\${FUSION_LOOM_VERSION}..."
echo "The web UI will be available at http://localhost:8080 once startup is complete."

if [ "\$CONTAINER_ENGINE" = "docker" ]; then
    cd "\${SCRIPT_DIR}/compose/docker"
    docker-compose up -d
elif [ "\$CONTAINER_ENGINE" = "podman" ]; then
    cd "\${SCRIPT_DIR}/compose/podman"
    podman-compose up -d
else
    echo "Error: No container engine configured. Please run setup.sh first."
    exit 1
fi

echo "FusionLoom v\${FUSION_LOOM_VERSION} started successfully!"
echo "Access the web interface at: http://localhost:8080"
EOL

# Make the launch script executable
chmod +x "$LAUNCH_SCRIPT"

# Set up symbolic links for the appropriate compose file
if [ "$CONTAINER_ENGINE" = "docker" ]; then
    ln -sf "${SCRIPT_DIR}/compose/docker/docker-compose.yaml" "${SCRIPT_DIR}/docker-compose.yaml"
elif [ "$CONTAINER_ENGINE" = "podman" ]; then
    ln -sf "${SCRIPT_DIR}/compose/podman/podman-compose.yaml" "${SCRIPT_DIR}/podman-compose.yaml"
fi

# Update the README to include setup instructions
echo "Setup complete for FusionLoom v${FUSION_LOOM_VERSION}"
echo "You can now launch FusionLoom by running: ./launch.sh"

# Pull the required container images
echo "Pulling required container images..."
if [ "$CONTAINER_ENGINE" = "docker" ]; then
    docker pull ghcr.io/open-webui/open-webui:main
elif [ "$CONTAINER_ENGINE" = "podman" ]; then
    podman pull ghcr.io/open-webui/open-webui:main
fi

echo "FusionLoom v${FUSION_LOOM_VERSION} setup completed successfully!"
echo "Run ./launch.sh to start the application."
