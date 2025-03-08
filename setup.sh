#!/bin/bash

# FusionLoom Setup Script
# This script sets up the FusionLoom environment and launches the graphical installer

# Capture the current working directory
WORKING_DIR=$(pwd)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set version
FUSION_LOOM_VERSION="0.1"
echo "Setting up FusionLoom v${FUSION_LOOM_VERSION}..."

# Check OS type
OS_TYPE=$(uname -s)
if [ "$OS_TYPE" = "Linux" ]; then
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
        OS_FAMILY="unknown"
    fi
elif [ "$OS_TYPE" = "Darwin" ]; then
    OS_FAMILY="macos"
else
    echo "Unsupported operating system: $OS_TYPE"
    OS_FAMILY="unknown"
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

# Check for Python
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "Python not found. Installing Python..."
    
    # Install Python based on OS
    if [ "$OS_FAMILY" = "debian" ]; then
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip python3-venv
    elif [ "$OS_FAMILY" = "rhel" ] || [ "$OS_FAMILY" = "fedora" ]; then
        sudo dnf install -y python3 python3-pip python3-virtualenv
    elif [ "$OS_FAMILY" = "arch" ]; then
        sudo pacman -Sy --needed python python-pip
    elif [ "$OS_FAMILY" = "macos" ]; then
        echo "Please install Python from https://www.python.org/downloads/macos/"
        echo "After installing Python, run this script again."
        exit 1
    else
        echo "Unable to install Python automatically on this OS."
        echo "Please install Python 3.7 or higher manually, then run this script again."
        exit 1
    fi
    
    PYTHON_CMD="python3"
    echo "Python installed successfully"
fi

# Check for container engine (Docker or Podman)
CONTAINER_ENGINE=""
if command -v docker &> /dev/null; then
    CONTAINER_ENGINE="docker"
    echo "Docker detected, will use Docker for containers"
elif command -v podman &> /dev/null; then
    CONTAINER_ENGINE="podman"
    echo "Podman detected, will use Podman for containers"
else
    echo "Neither Docker nor Podman found."
    echo "The installer will guide you through installing a container engine."
fi

# Create a minimal environment file (will be updated by the installer)
ENV_FILE="${SCRIPT_DIR}/.env"
echo "Creating initial environment file..."
cat > "$ENV_FILE" << EOL
# FusionLoom Environment Configuration
FUSION_LOOM_VERSION=${FUSION_LOOM_VERSION}
CONTAINER_ENGINE=${CONTAINER_ENGINE}

# Data directories
DATA_DIR=${SCRIPT_DIR}/data
LOGS_DIR=${SCRIPT_DIR}/logs
UI_DIR=${SCRIPT_DIR}/ui
EOL

# Create the stop script if it doesn't exist
STOP_SCRIPT="${SCRIPT_DIR}/stop.sh"
if [ ! -f "$STOP_SCRIPT" ]; then
    echo "Creating stop script..."
    cat > "$STOP_SCRIPT" << EOL
#!/bin/bash

# FusionLoom Stop Script
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"

# Check if .env file exists
if [ ! -f "\${SCRIPT_DIR}/.env" ]; then
    echo "Environment file not found. Please run setup.sh first."
    exit 1
fi

# Source the environment file
source "\${SCRIPT_DIR}/.env"

echo "Stopping FusionLoom v\${FUSION_LOOM_VERSION}..."

# Stop the Ollama container
echo "Stopping Ollama container..."
"\${SCRIPT_DIR}/stop-ollama.sh"

# Stop the web UI container
if [ "\${CONTAINER_ENGINE}" = "docker" ]; then
    cd "\${SCRIPT_DIR}/compose/docker"
    docker-compose down
elif [ "\${CONTAINER_ENGINE}" = "podman" ]; then
    cd "\${SCRIPT_DIR}/compose/podman"
    podman-compose down
else
    echo "Error: No container engine configured. Please run setup.sh first."
    exit 1
fi

echo "FusionLoom v\${FUSION_LOOM_VERSION} stopped successfully!"
EOL

    # Make the stop script executable
    chmod +x "$STOP_SCRIPT"
fi

# Launch the graphical installer
echo "Launching FusionLoom Graphical Installer..."

# Check if we're in a graphical environment
if [ -n "$DISPLAY" ] || [ "$OS_FAMILY" = "macos" ]; then
    # Launch the installer
    if [ -f "${SCRIPT_DIR}/installer/run_installer.sh" ]; then
        "${SCRIPT_DIR}/installer/run_installer.sh"
    else
        echo "Installer script not found. Please check your installation."
        exit 1
    fi
else
    echo "No graphical environment detected."
    echo "Would you like to:"
    echo "1) Continue with command-line setup"
    echo "2) Exit and run the installer in a graphical environment later"
    read -p "Enter your choice (1/2): " CHOICE
    
    if [ "$CHOICE" = "1" ]; then
        echo "Continuing with command-line setup..."
        
        # Basic command-line setup
        read -p "Container engine (docker/podman) [${CONTAINER_ENGINE}]: " INPUT_CONTAINER_ENGINE
        CONTAINER_ENGINE=${INPUT_CONTAINER_ENGINE:-$CONTAINER_ENGINE}
        
        # Update the environment file
        sed -i "s/CONTAINER_ENGINE=.*/CONTAINER_ENGINE=${CONTAINER_ENGINE}/" "$ENV_FILE"
        
        # Create the launch script
        LAUNCH_SCRIPT="${SCRIPT_DIR}/launch.sh"
        echo "Creating launch script..."
        cat > "$LAUNCH_SCRIPT" << EOL
#!/bin/bash

# FusionLoom Launch Script
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"

# Check if .env file exists, if not, run setup
if [ ! -f "\${SCRIPT_DIR}/.env" ]; then
    echo "Environment file not found. Running setup first..."
    "\${SCRIPT_DIR}/setup.sh"
    exit 0
fi

# Source the environment file
source "\${SCRIPT_DIR}/.env"

# Create data directory if it doesn't exist
mkdir -p "\${DATA_DIR}"

echo "Starting FusionLoom v\${FUSION_LOOM_VERSION}..."
echo "The web UI will be available at http://localhost:8080 once startup is complete."

# Create the fusionloom_net network if it doesn't exist
if [ "\${CONTAINER_ENGINE}" = "docker" ]; then
    if ! docker network ls | grep -q "fusionloom_net"; then
        echo "Creating fusionloom_net network..."
        docker network create fusionloom_net
    fi
elif [ "\${CONTAINER_ENGINE}" = "podman" ]; then
    if ! podman network ls | grep -q "fusionloom_net"; then
        echo "Creating fusionloom_net network..."
        podman network create fusionloom_net
    fi
fi

# Start the web UI container
if [ "\${CONTAINER_ENGINE}" = "docker" ]; then
    cd "\${SCRIPT_DIR}/compose/docker"
    docker-compose up -d
elif [ "\${CONTAINER_ENGINE}" = "podman" ]; then
    cd "\${SCRIPT_DIR}/compose/podman"
    podman-compose up -d
else
    echo "Error: No container engine configured. Please run setup.sh first."
    exit 1
fi

# Start the Ollama container with platform detection
echo "Starting Ollama container with platform-specific optimizations..."
"\${SCRIPT_DIR}/launch-ollama.sh"

echo "FusionLoom v\${FUSION_LOOM_VERSION} started successfully!"
echo "Access the web interface at: http://localhost:8080"
echo "Ollama API available at: http://localhost:11434"
EOL

        # Make the launch script executable
        chmod +x "$LAUNCH_SCRIPT"
        
        echo "Setup complete for FusionLoom v${FUSION_LOOM_VERSION}"
        echo "You can now launch FusionLoom by running: ./launch.sh"
    else
        echo "Exiting setup. You can run the graphical installer later with:"
        echo "  cd ${SCRIPT_DIR}/installer"
        echo "  ./run_installer.sh"
        exit 0
    fi
fi

echo "FusionLoom v${FUSION_LOOM_VERSION} setup completed successfully!"

# Ask if the user wants to launch the application
echo "Would you like to launch FusionLoom now?"
read -p "Launch now? (y/n): " LAUNCH_NOW

if [ "$LAUNCH_NOW" = "y" ] || [ "$LAUNCH_NOW" = "Y" ]; then
    echo "Launching FusionLoom..."
    "${SCRIPT_DIR}/launch.sh"
else
    echo "You can start FusionLoom by running: ./launch.sh"
fi
