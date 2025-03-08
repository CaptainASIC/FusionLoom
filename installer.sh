#!/bin/bash

# FusionLoom Installer Script
# This script installs FusionLoom to standard system locations:
# - /opt/FusionLoom for Linux
# - /Applications/FusionLoom for macOS

# Set up colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to run a command with sudo if needed
run_with_sudo() {
    if [ "$(id -u)" -eq 0 ]; then
        # Already running as root
        "$@"
    else
        # Not running as root, use sudo
        sudo "$@"
    fi
}

# Detect OS
OS_TYPE=$(uname -s)
if [ "$OS_TYPE" = "Linux" ]; then
    INSTALL_DIR="/opt/FusionLoom"
    if [ -f /etc/debian_version ]; then
        OS_FAMILY="debian"
    elif [ -f /etc/redhat-release ]; then
        OS_FAMILY="rhel"
    elif [ -f /etc/arch-release ]; then
        OS_FAMILY="arch"
    elif [ -f /etc/os-release ] && grep -q "ID=fedora" /etc/os-release; then
        OS_FAMILY="fedora"
    else
        echo -e "${YELLOW}Unsupported Linux distribution. Proceeding with generic Linux setup.${NC}"
        OS_FAMILY="linux"
    fi
elif [ "$OS_TYPE" = "Darwin" ]; then
    INSTALL_DIR="/Applications/FusionLoom"
    OS_FAMILY="macos"
else
    echo -e "${RED}Unsupported operating system: $OS_TYPE${NC}"
    exit 1
fi

# Set version
FUSION_LOOM_VERSION="0.2"
echo -e "${BLUE}FusionLoom v${FUSION_LOOM_VERSION} Installer${NC}"
echo -e "${BLUE}This script will install FusionLoom to ${INSTALL_DIR}${NC}"

# Get the source directory (where this script is located)
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if the installation directory already exists
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Installation directory ${INSTALL_DIR} already exists.${NC}"
    read -p "Do you want to overwrite the existing installation? (y/n): " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo -e "${BLUE}Installation cancelled.${NC}"
        exit 0
    fi
fi

# For Linux, we need sudo to create the installation directory and copy files
if [ "$OS_TYPE" = "Linux" ]; then
    echo -e "${BLUE}Creating installation directory (requires sudo)...${NC}"
    run_with_sudo mkdir -p "$INSTALL_DIR"
    
    echo -e "${BLUE}Copying files to ${INSTALL_DIR} (requires sudo)...${NC}"
    run_with_sudo cp -r "$SOURCE_DIR"/* "$INSTALL_DIR"
    
    # Create data and log directories
    run_with_sudo mkdir -p "$INSTALL_DIR/data/ollama"
    run_with_sudo mkdir -p "$INSTALL_DIR/logs"
    
    # Create platform-specific directories
    echo -e "${BLUE}Creating platform-specific directories (requires sudo)...${NC}"
    run_with_sudo mkdir -p "$INSTALL_DIR/compose/platforms/apple/data/ollama"
    run_with_sudo mkdir -p "$INSTALL_DIR/compose/platforms/amd/data/ollama"
    run_with_sudo mkdir -p "$INSTALL_DIR/compose/platforms/arm/data/ollama"
    run_with_sudo mkdir -p "$INSTALL_DIR/compose/platforms/dgx_digit/data/ollama"
    run_with_sudo mkdir -p "$INSTALL_DIR/compose/platforms/jetson/orin/data/ollama"
    run_with_sudo mkdir -p "$INSTALL_DIR/compose/platforms/jetson/agx/data/ollama"
    run_with_sudo mkdir -p "$INSTALL_DIR/compose/platforms/nvidia/data/ollama"
    run_with_sudo mkdir -p "$INSTALL_DIR/compose/platforms/x86/data/ollama"
    
    # Set permissions so the user can access the installation
    run_with_sudo chown -R $(id -u):$(id -g) "$INSTALL_DIR"
else
    # For macOS, we don't need sudo for /Applications
    echo -e "${BLUE}Creating installation directory...${NC}"
    mkdir -p "$INSTALL_DIR"
    
    echo -e "${BLUE}Copying files to ${INSTALL_DIR}...${NC}"
    cp -r "$SOURCE_DIR"/* "$INSTALL_DIR"
    
    # Create data and log directories
    mkdir -p "$INSTALL_DIR/data/ollama"
    mkdir -p "$INSTALL_DIR/logs"
    
    # Create platform-specific directories
    echo -e "${BLUE}Creating platform-specific directories...${NC}"
    mkdir -p "$INSTALL_DIR/compose/platforms/apple/data/ollama"
    mkdir -p "$INSTALL_DIR/compose/platforms/amd/data/ollama"
    mkdir -p "$INSTALL_DIR/compose/platforms/arm/data/ollama"
    mkdir -p "$INSTALL_DIR/compose/platforms/dgx_digit/data/ollama"
    mkdir -p "$INSTALL_DIR/compose/platforms/jetson/orin/data/ollama"
    mkdir -p "$INSTALL_DIR/compose/platforms/jetson/agx/data/ollama"
    mkdir -p "$INSTALL_DIR/compose/platforms/nvidia/data/ollama"
    mkdir -p "$INSTALL_DIR/compose/platforms/x86/data/ollama"
fi

# Check for container engine (Docker or Podman)
CONTAINER_ENGINE=""
DOCKER_AVAILABLE=false
PODMAN_AVAILABLE=false

if command -v docker &> /dev/null; then
    DOCKER_AVAILABLE=true
    echo -e "${GREEN}Docker detected${NC}"
fi

if command -v podman &> /dev/null; then
    PODMAN_AVAILABLE=true
    echo -e "${GREEN}Podman detected${NC}"
fi

# If both are available, prefer Podman but ask the user
if [ "$DOCKER_AVAILABLE" = true ] && [ "$PODMAN_AVAILABLE" = true ]; then
    echo -e "${BLUE}Both Docker and Podman are available.${NC}"
    echo -e "${BLUE}Podman is recommended for better integration with FusionLoom.${NC}"
    read -p "Use Podman? (Y/n): " USE_PODMAN
    
    if [ "$USE_PODMAN" = "n" ] || [ "$USE_PODMAN" = "N" ]; then
        CONTAINER_ENGINE="docker"
        echo -e "${GREEN}Using Docker for containers${NC}"
    else
        CONTAINER_ENGINE="podman"
        echo -e "${GREEN}Using Podman for containers${NC}"
    fi
# If only Docker is available
elif [ "$DOCKER_AVAILABLE" = true ]; then
    CONTAINER_ENGINE="docker"
    echo -e "${GREEN}Using Docker for containers${NC}"
# If only Podman is available
elif [ "$PODMAN_AVAILABLE" = true ]; then
    CONTAINER_ENGINE="podman"
    echo -e "${GREEN}Using Podman for containers${NC}"
# If neither is available, install Podman
else
    echo -e "${YELLOW}Neither Docker nor Podman found. Installing Podman...${NC}"
    
    # Install Podman based on OS
    if [ "$OS_FAMILY" = "debian" ]; then
        echo -e "${BLUE}Installing Podman (requires sudo)...${NC}"
        run_with_sudo apt-get update
        run_with_sudo apt-get install -y podman
    elif [ "$OS_FAMILY" = "rhel" ] || [ "$OS_FAMILY" = "fedora" ]; then
        echo -e "${BLUE}Installing Podman (requires sudo)...${NC}"
        run_with_sudo dnf install -y podman
    elif [ "$OS_FAMILY" = "arch" ]; then
        echo -e "${BLUE}Installing Podman (requires sudo)...${NC}"
        run_with_sudo pacman -Sy --needed podman
    elif [ "$OS_FAMILY" = "macos" ]; then
        if command -v brew &> /dev/null; then
            brew install podman
        else
            echo -e "${YELLOW}Homebrew not found. Installing Homebrew...${NC}"
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            brew install podman
        fi
    else
        echo -e "${RED}Unable to install Podman automatically on this OS.${NC}"
        echo -e "${YELLOW}Please install Docker or Podman manually, then run this script again.${NC}"
        exit 1
    fi
    
    CONTAINER_ENGINE="podman"
    echo -e "${GREEN}Podman installed successfully${NC}"
fi

# Create environment file
echo -e "${BLUE}Creating environment file...${NC}"
cat > "$INSTALL_DIR/.env" << EOL
# FusionLoom Environment Configuration
FUSION_LOOM_VERSION=${FUSION_LOOM_VERSION}
CONTAINER_ENGINE=${CONTAINER_ENGINE}
INSTALL_DIR=${INSTALL_DIR}

# Data directories
DATA_DIR=${INSTALL_DIR}/data
LOGS_DIR=${INSTALL_DIR}/logs
UI_DIR=${INSTALL_DIR}/ui
EOL

# Create Docker compose file with absolute paths
echo -e "${BLUE}Creating Docker compose file...${NC}"
mkdir -p "$INSTALL_DIR/compose/docker"
cat > "$INSTALL_DIR/compose/docker/docker-compose.yaml" << EOL
version: "3"

services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: fusionloom-webui
    volumes:
      - ${INSTALL_DIR}/data:/app/backend/data
      - ${INSTALL_DIR}/ui:/app/build
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - "8080:8080"
    environment:
      - WEBUI_VERSION=${FUSION_LOOM_VERSION}
      - WEBUI_APP_NAME=FusionLoom
      - OLLAMA_BASE_URL=http://fusionloom-ollama:11434
      - CONTAINER_ENGINE=docker
      - CONTAINER_NETWORK=fusionloom_net
    restart: unless-stopped
    labels:
      - "io.containers.autoupdate=image"
    networks:
      - fusionloom_net

networks:
  fusionloom_net:
    external: true
EOL

# Create Podman compose file with absolute paths
echo -e "${BLUE}Creating Podman compose file...${NC}"
mkdir -p "$INSTALL_DIR/compose/podman"
cat > "$INSTALL_DIR/compose/podman/podman-compose.yaml" << EOL
version: "3"

services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: fusionloom-webui
    volumes:
      - ${INSTALL_DIR}/data:/app/backend/data
      - ${INSTALL_DIR}/ui:/app/build
    ports:
      - "8080:8080"
    environment:
      - WEBUI_VERSION=${FUSION_LOOM_VERSION}
      - WEBUI_APP_NAME=FusionLoom
      - OLLAMA_BASE_URL=http://fusionloom-ollama:11434
      - CONTAINER_ENGINE=podman
      - CONTAINER_NETWORK=fusionloom_net
    restart: unless-stopped
    labels:
      - "io.containers.autoupdate=image"
    networks:
      - fusionloom_net

networks:
  fusionloom_net:
    external: true
EOL

# Update launch script
echo -e "${BLUE}Updating launch script...${NC}"
cat > "$INSTALL_DIR/launch.sh" << EOL
#!/bin/bash

# FusionLoom Launch Script
INSTALL_DIR="${INSTALL_DIR}"

# Check if .env file exists
if [ ! -f "\${INSTALL_DIR}/.env" ]; then
    echo "Environment file not found. Please run the installer again."
    exit 1
fi

# Source the environment file
source "\${INSTALL_DIR}/.env"

# Ensure data directories exist
mkdir -p "\${INSTALL_DIR}/data"
mkdir -p "\${INSTALL_DIR}/logs"

echo "Starting FusionLoom v\${FUSION_LOOM_VERSION}..."
echo "The web UI will be available at http://localhost:8080 once startup is complete."

# Create the fusionloom_net network if it doesn't exist
if [ "\${CONTAINER_ENGINE}" = "docker" ]; then
    if ! docker network ls | grep -q "fusionloom_net"; then
        echo "Creating fusionloom_net network..."
        docker network create fusionloom_net
    else
        echo "Network fusionloom_net already exists, skipping creation."
    fi
elif [ "\${CONTAINER_ENGINE}" = "podman" ]; then
    if ! podman network ls | grep -q "fusionloom_net"; then
        echo "Creating fusionloom_net network..."
        podman network create fusionloom_net
    else
        echo "Network fusionloom_net already exists, skipping creation."
    fi
fi

# Stop any existing containers to avoid conflicts
if [ "\${CONTAINER_ENGINE}" = "docker" ]; then
    docker stop fusionloom-webui 2>/dev/null || true
    docker rm fusionloom-webui 2>/dev/null || true
elif [ "\${CONTAINER_ENGINE}" = "podman" ]; then
    podman stop fusionloom-webui 2>/dev/null || true
    podman rm fusionloom-webui 2>/dev/null || true
fi

# Start the web UI container
if [ "\${CONTAINER_ENGINE}" = "docker" ]; then
    # Use absolute path to compose file instead of changing directory
    docker-compose -f "\${INSTALL_DIR}/compose/docker/docker-compose.yaml" up -d
elif [ "\${CONTAINER_ENGINE}" = "podman" ]; then
    # Use absolute path to compose file instead of changing directory
    podman-compose -f "\${INSTALL_DIR}/compose/podman/podman-compose.yaml" up -d
else
    echo "Error: No container engine configured. Please run the installer again."
    exit 1
fi

# Start the Ollama container
echo "Starting Ollama container with platform-specific optimizations..."
"\${INSTALL_DIR}/launch-ollama.sh"

echo "FusionLoom v\${FUSION_LOOM_VERSION} started successfully!"
echo "Access the web interface at: http://localhost:8080"
echo "Ollama API available at: http://localhost:11434"
EOL

# Update stop script
echo -e "${BLUE}Updating stop script...${NC}"
cat > "$INSTALL_DIR/stop.sh" << EOL
#!/bin/bash

# FusionLoom Stop Script
INSTALL_DIR="${INSTALL_DIR}"

# Check if .env file exists
if [ ! -f "\${INSTALL_DIR}/.env" ]; then
    echo "Environment file not found. Please run the installer again."
    exit 1
fi

# Source the environment file
source "\${INSTALL_DIR}/.env"

echo "Stopping FusionLoom v\${FUSION_LOOM_VERSION}..."

# Stop the Ollama container
echo "Stopping Ollama container..."
"\${INSTALL_DIR}/stop-ollama.sh"

# Stop the web UI container
if [ "\${CONTAINER_ENGINE}" = "docker" ]; then
    cd "\${INSTALL_DIR}/compose/docker"
    docker-compose down
elif [ "\${CONTAINER_ENGINE}" = "podman" ]; then
    cd "\${INSTALL_DIR}/compose/podman"
    podman-compose down
else
    echo "Error: No container engine configured. Please run the installer again."
    exit 1
fi

echo "FusionLoom v\${FUSION_LOOM_VERSION} stopped successfully!"
EOL

# Update launch-ollama.sh script to use absolute paths
echo -e "${BLUE}Updating Ollama launch script...${NC}"
cat > "$INSTALL_DIR/launch-ollama.sh" << EOL
#!/bin/bash

# FusionLoom Ollama Container Launcher
# This script detects the hardware platform and launches the appropriate Ollama container

# Set the base directory
INSTALL_DIR="${INSTALL_DIR}"
PLATFORMS_DIR="\${INSTALL_DIR}/compose/platforms"
CONTAINER_NAME="fusionloom-ollama"

# Source the environment file
source "\${INSTALL_DIR}/.env"

# Function to detect container engine
detect_container_engine() {
    echo "\${CONTAINER_ENGINE}"
}

# Function to create network if it doesn't exist
create_network_if_needed() {
    local engine=\$1
    local network_exists=false
    
    if [ "\$engine" = "podman" ]; then
        if podman network ls | grep -q "fusionloom_net"; then
            network_exists=true
        fi
    elif [ "\$engine" = "docker" ]; then
        if docker network ls | grep -q "fusionloom_net"; then
            network_exists=true
        fi
    fi
    
    if [ "\$network_exists" = false ]; then
        echo "Creating fusionloom_net network..."
        if [ "\$engine" = "podman" ]; then
            podman network create fusionloom_net
        elif [ "\$engine" = "docker" ]; then
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
ENGINE=\$(detect_container_engine)
if [ "\$ENGINE" = "none" ]; then
    echo "Error: No container engine found. Please install Docker or Podman."
    exit 1
fi
echo "Using container engine: \$ENGINE"

# Create network if needed
create_network_if_needed "\$ENGINE"

# Detect platform
PLATFORM=\$(detect_platform)
echo "Detected platform: \$PLATFORM"

# For backward compatibility, map apple_silicon to apple
if [ "\$PLATFORM" = "apple_silicon" ]; then
    PLATFORM_DIR="apple"
else
    PLATFORM_DIR="\$PLATFORM"
fi

# Check if the platform directory exists
if [ ! -d "\$PLATFORMS_DIR/\$PLATFORM_DIR" ]; then
    echo "Error: Platform directory not found: \$PLATFORMS_DIR/\$PLATFORM_DIR"
    echo "Falling back to x86 platform."
    PLATFORM_DIR="x86"
fi

# Ensure all required directories exist
mkdir -p "\${INSTALL_DIR}/data/ollama"
mkdir -p "\${INSTALL_DIR}/logs"
mkdir -p "\$PLATFORMS_DIR/\$PLATFORM_DIR/data/ollama"

# Check if the container is already running
CONTAINER_RUNNING=false
if [ "\$ENGINE" = "podman" ]; then
    if podman ps | grep -q "\$CONTAINER_NAME"; then
        CONTAINER_RUNNING=true
    fi
elif [ "\$ENGINE" = "docker" ]; then
    if docker ps | grep -q "\$CONTAINER_NAME"; then
        CONTAINER_RUNNING=true
    fi
fi

if [ "\$CONTAINER_RUNNING" = true ]; then
    echo "Container \$CONTAINER_NAME is already running."
    exit 0
fi

# Launch the container
echo "Launching Ollama container for platform: \$PLATFORM_DIR"

# Use absolute path to compose file instead of changing directory
if [ "\$ENGINE" = "podman" ]; then
    podman-compose -f "\$PLATFORMS_DIR/\$PLATFORM_DIR/ollama-compose.yaml" up -d
elif [ "\$ENGINE" = "docker" ]; then
    docker-compose -f "\$PLATFORMS_DIR/\$PLATFORM_DIR/ollama-compose.yaml" up -d
fi

# Check if the container started successfully
if [ \$? -eq 0 ]; then
    echo "Ollama container started successfully."
    echo "API available at: http://localhost:11434"
else
    echo "Error: Failed to start Ollama container."
    exit 1
fi
EOL

# Update stop-ollama.sh script
echo -e "${BLUE}Updating Ollama stop script...${NC}"
cat > "$INSTALL_DIR/stop-ollama.sh" << EOL
#!/bin/bash

# FusionLoom Ollama Container Stopper

# Set the base directory
INSTALL_DIR="${INSTALL_DIR}"
CONTAINER_NAME="fusionloom-ollama"

# Source the environment file
source "\${INSTALL_DIR}/.env"

# Function to detect container engine
detect_container_engine() {
    echo "\${CONTAINER_ENGINE}"
}

# Main execution
echo "FusionLoom Ollama Container Stopper"
echo "-----------------------------------"

# Detect container engine
ENGINE=\$(detect_container_engine)
if [ "\$ENGINE" = "none" ]; then
    echo "Error: No container engine found. Please install Docker or Podman."
    exit 1
fi
echo "Using container engine: \$ENGINE"

# Check if the container is running
CONTAINER_RUNNING=false
if [ "\$ENGINE" = "podman" ]; then
    if podman ps | grep -q "\$CONTAINER_NAME"; then
        CONTAINER_RUNNING=true
    fi
elif [ "\$ENGINE" = "docker" ]; then
    if docker ps | grep -q "\$CONTAINER_NAME"; then
        CONTAINER_RUNNING=true
    fi
fi

if [ "\$CONTAINER_RUNNING" = false ]; then
    echo "Container \$CONTAINER_NAME is not running."
    exit 0
fi

# Stop the container
echo "Stopping Ollama container..."
if [ "\$ENGINE" = "podman" ]; then
    podman stop "\$CONTAINER_NAME"
elif [ "\$ENGINE" = "docker" ]; then
    docker stop "\$CONTAINER_NAME"
fi

# Check if the container stopped successfully
if [ \$? -eq 0 ]; then
    echo "Ollama container stopped successfully."
else
    echo "Error: Failed to stop Ollama container."
    exit 1
fi
EOL

# Make scripts executable
echo -e "${BLUE}Making scripts executable...${NC}"
chmod +x "$INSTALL_DIR/launch.sh"
chmod +x "$INSTALL_DIR/stop.sh"
chmod +x "$INSTALL_DIR/launch-ollama.sh"
chmod +x "$INSTALL_DIR/stop-ollama.sh"
chmod +x "$INSTALL_DIR/installer.sh"

# Create symlinks in /usr/local/bin for Linux
if [ "$OS_TYPE" = "Linux" ]; then
    echo -e "${BLUE}Creating symlinks in /usr/local/bin (requires sudo)...${NC}"
    run_with_sudo ln -sf "$INSTALL_DIR/launch.sh" /usr/local/bin/fusionloom-start
    run_with_sudo ln -sf "$INSTALL_DIR/stop.sh" /usr/local/bin/fusionloom-stop
    echo -e "${GREEN}Created symlinks: fusionloom-start and fusionloom-stop${NC}"
fi

# Create application launcher for Linux desktop environments
if [ "$OS_TYPE" = "Linux" ]; then
    echo -e "${BLUE}Creating desktop launcher (requires sudo)...${NC}"
    # Create the desktop file in a temporary location
    TEMP_DESKTOP_FILE="/tmp/fusionloom.desktop"
    cat > "$TEMP_DESKTOP_FILE" << EOL
[Desktop Entry]
Name=FusionLoom
Comment=AI Model Management Platform
Exec=${INSTALL_DIR}/launch.sh
Icon=${INSTALL_DIR}/ui/static/img/logo.png
Terminal=true
Type=Application
Categories=Development;
EOL
    # Move it to the system location with sudo
    run_with_sudo mv "$TEMP_DESKTOP_FILE" /usr/share/applications/fusionloom.desktop
    echo -e "${GREEN}Created desktop launcher: /usr/share/applications/fusionloom.desktop${NC}"
fi

# Create macOS application launcher
if [ "$OS_TYPE" = "Darwin" ]; then
    echo -e "${BLUE}Creating macOS application launcher...${NC}"
    mkdir -p "$INSTALL_DIR/FusionLoom.app/Contents/MacOS"
    cat > "$INSTALL_DIR/FusionLoom.app/Contents/MacOS/FusionLoom" << EOL
#!/bin/bash
open -a Terminal.app "${INSTALL_DIR}/launch.sh"
EOL
    chmod +x "$INSTALL_DIR/FusionLoom.app/Contents/MacOS/FusionLoom"
    
    mkdir -p "$INSTALL_DIR/FusionLoom.app/Contents/Resources"
    # Copy logo if it exists
    if [ -f "$INSTALL_DIR/ui/static/img/logo.png" ]; then
        cp "$INSTALL_DIR/ui/static/img/logo.png" "$INSTALL_DIR/FusionLoom.app/Contents/Resources/logo.png"
    fi
    
    cat > "$INSTALL_DIR/FusionLoom.app/Contents/Info.plist" << EOL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>FusionLoom</string>
    <key>CFBundleIconFile</key>
    <string>logo.png</string>
    <key>CFBundleIdentifier</key>
    <string>com.fusionloom.app</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>FusionLoom</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${FUSION_LOOM_VERSION}</string>
    <key>CFBundleVersion</key>
    <string>${FUSION_LOOM_VERSION}</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2025 FusionLoom. All rights reserved.</string>
</dict>
</plist>
EOL
    echo -e "${GREEN}Created macOS application launcher: ${INSTALL_DIR}/FusionLoom.app${NC}"
fi

echo -e "${GREEN}FusionLoom v${FUSION_LOOM_VERSION} has been installed to ${INSTALL_DIR}${NC}"

# Run the graphical installer
echo -e "${BLUE}Running graphical configuration utility...${NC}"
if [ -f "${INSTALL_DIR}/installer/run_installer.sh" ]; then
    "${INSTALL_DIR}/installer/run_installer.sh"
    echo -e "${GREEN}Configuration completed.${NC}"
else
    echo -e "${YELLOW}Graphical installer not found. Running platform-specific setup instead...${NC}"
    
    # Fall back to platform-specific setup scripts
    if [ "$OS_TYPE" = "Linux" ]; then
        if [ "$OS_FAMILY" = "arch" ]; then
            "${INSTALL_DIR}/arch-setup.sh"
        else
            "${INSTALL_DIR}/setup.sh"
        fi
    elif [ "$OS_TYPE" = "Darwin" ]; then
        "${INSTALL_DIR}/macos-setup.sh"
    fi
    
    echo -e "${GREEN}Installation and configuration completed.${NC}"
fi

# Ask if the user wants to launch FusionLoom
echo -e "${BLUE}Would you like to launch FusionLoom now?${NC}"
read -p "Launch now? (y/n): " LAUNCH_NOW

if [ "$LAUNCH_NOW" = "y" ] || [ "$LAUNCH_NOW" = "Y" ]; then
    echo -e "${BLUE}Launching FusionLoom...${NC}"
    "${INSTALL_DIR}/launch.sh"
else
    echo -e "${BLUE}You can start FusionLoom by running:${NC}"
    if [ "$OS_TYPE" = "Linux" ]; then
        echo -e "  1. ${INSTALL_DIR}/launch.sh"
        echo -e "  2. fusionloom-start (from any terminal)"
        echo -e "  3. From your application menu"
    elif [ "$OS_TYPE" = "Darwin" ]; then
        echo -e "  1. ${INSTALL_DIR}/launch.sh"
        echo -e "  2. Open FusionLoom.app in Applications"
    fi
    echo -e "${BLUE}The web interface will be available at http://localhost:8080 once started.${NC}"
fi
