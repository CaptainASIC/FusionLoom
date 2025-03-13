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

# Start the system information API server
echo "Starting system information API server..."
cd "${SCRIPT_DIR}/server"
# Check if Python and Flask are installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 to use the system information API."
else
    # Install Flask and flask-cors if not already installed
    python3 -m pip install flask flask-cors &> /dev/null
    # Start the API server in the background
    nohup python3 system_info.py --serve 5050 > "${SCRIPT_DIR}/logs/system_api.log" 2>&1 &
    echo "System information API started at http://localhost:5050/api/system-info"
    
    # Start the settings API server
    echo "Starting settings API server..."
    nohup python3 settings_api.py 5052 > "${SCRIPT_DIR}/logs/settings_api.log" 2>&1 &
    echo "Settings API started at http://localhost:5052/api/settings"
fi
cd "${SCRIPT_DIR}"

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

# Start the web UI container
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

# Start the selected services with platform detection
if [ -f "${SCRIPT_DIR}/cfg/config.ini" ]; then
    # Check if Ollama is enabled
    if grep -q "ollama_enabled = true" "${SCRIPT_DIR}/cfg/config.ini"; then
        echo "Starting Ollama container with platform-specific optimizations..."
        "${SCRIPT_DIR}/launch-ollama.sh"
        echo "Ollama API available at: http://localhost:11434"
    fi

    # Check if SillyTavern is enabled
    if grep -q "sillytavern_enabled = true" "${SCRIPT_DIR}/cfg/config.ini"; then
        echo "Starting SillyTavern container with platform-specific optimizations..."
        # Determine platform directory
        PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/x86"  # Default to x86
        
        # Check for platform type in config.ini
        PLATFORM_TYPE=$(grep "platform = " "${SCRIPT_DIR}/cfg/config.ini" | cut -d "=" -f2 | tr -d ' ')
        
        # Handle Jetson platforms
        if [[ "${PLATFORM_TYPE}" == "jetson_orin_nano_4gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/orin_nano_4gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_orin_nano_8gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/orin_nano_8gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_orin_nx_8gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/orin_nx_8gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_orin_nx_16gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/orin_nx_16gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_agx_32gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/agx_32gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_agx_64gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/agx_64gb"
        # Handle other platforms
        elif [ "${GPU_VENDOR}" = "nvidia" ]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/nvidia"
        elif [ "${GPU_VENDOR}" = "amd" ]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/amd"
        elif [ "${GPU_VENDOR}" = "apple" ]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/apple"
        fi

        # Launch SillyTavern
        cd "${PLATFORM_DIR}"
        if [ "${CONTAINER_ENGINE}" = "docker" ]; then
            docker-compose -f sillytavern-compose.yaml up -d
        elif [ "${CONTAINER_ENGINE}" = "podman" ]; then
            podman-compose -f sillytavern-compose.yaml up -d
        fi
        echo "SillyTavern available at: http://localhost:8000"
    fi

    # Check if TavernAI is enabled
    if grep -q "tavernai_enabled = true" "${SCRIPT_DIR}/cfg/config.ini"; then
        echo "Starting TavernAI container with platform-specific optimizations..."
        # Determine platform directory
        PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/x86"  # Default to x86
        
        # Check for platform type in config.ini
        PLATFORM_TYPE=$(grep "platform = " "${SCRIPT_DIR}/cfg/config.ini" | cut -d "=" -f2 | tr -d ' ')
        
        # Handle Jetson platforms
        if [[ "${PLATFORM_TYPE}" == "jetson_orin_nano_4gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/orin_nano_4gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_orin_nano_8gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/orin_nano_8gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_orin_nx_8gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/orin_nx_8gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_orin_nx_16gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/orin_nx_16gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_agx_32gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/agx_32gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_agx_64gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/agx_64gb"
        # Handle other platforms
        elif [ "${GPU_VENDOR}" = "nvidia" ]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/nvidia"
        elif [ "${GPU_VENDOR}" = "amd" ]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/amd"
        elif [ "${GPU_VENDOR}" = "apple" ]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/apple"
        fi

        # Launch TavernAI
        cd "${PLATFORM_DIR}"
        if [ "${CONTAINER_ENGINE}" = "docker" ]; then
            docker-compose -f tavernai-compose.yaml up -d
        elif [ "${CONTAINER_ENGINE}" = "podman" ]; then
            podman-compose -f tavernai-compose.yaml up -d
        fi
        echo "TavernAI available at: http://localhost:8001"
    fi

    # Check if Oobabooga is enabled
    if grep -q "oobabooga_enabled = true" "${SCRIPT_DIR}/cfg/config.ini"; then
        echo "Starting Oobabooga container with platform-specific optimizations..."
        # Determine platform directory
        PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/x86"  # Default to x86
        
        # Check for platform type in config.ini
        PLATFORM_TYPE=$(grep "platform = " "${SCRIPT_DIR}/cfg/config.ini" | cut -d "=" -f2 | tr -d ' ')
        
        # Handle Jetson platforms
        if [[ "${PLATFORM_TYPE}" == "jetson_orin_nano_4gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/orin_nano_4gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_orin_nano_8gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/orin_nano_8gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_orin_nx_8gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/orin_nx_8gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_orin_nx_16gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/orin_nx_16gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_agx_32gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/agx_32gb"
        elif [[ "${PLATFORM_TYPE}" == "jetson_agx_64gb" ]]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/jetson/agx_64gb"
        # Handle other platforms
        elif [ "${GPU_VENDOR}" = "nvidia" ]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/nvidia"
        elif [ "${GPU_VENDOR}" = "amd" ]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/amd"
        elif [ "${GPU_VENDOR}" = "apple" ]; then
            PLATFORM_DIR="${SCRIPT_DIR}/compose/platforms/apple"
        fi

        # Launch Oobabooga
        cd "${PLATFORM_DIR}"
        if [ "${CONTAINER_ENGINE}" = "docker" ]; then
            docker-compose -f oobabooga-compose.yaml up -d
        elif [ "${CONTAINER_ENGINE}" = "podman" ]; then
            podman-compose -f oobabooga-compose.yaml up -d
        fi
        echo "Oobabooga available at: http://localhost:7860"
        echo "Oobabooga API available at: http://localhost:5000"
    fi
fi

echo "FusionLoom v${FUSION_LOOM_VERSION} started successfully!"
echo "Access the web interface at: http://localhost:8080"
echo "System info API available at: http://localhost:5050/api/system-info"
