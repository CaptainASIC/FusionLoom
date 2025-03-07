# FusionLoom Platform-Specific Containers

This directory contains platform-specific container configurations for FusionLoom, optimized for different hardware architectures and capabilities.

## Directory Structure

```
platforms/
├── amd/                  # AMD GPU (ROCm) optimized containers
├── apple/                # Apple Silicon (M1/M2/M3/M4) optimized containers
├── arm/                  # ARM CPU-only containers
├── dgx_digit/            # NVIDIA DGX/Digit optimized containers
├── jetson/               # NVIDIA Jetson optimized containers
│   ├── agx/              # Jetson AGX Nano specific containers
│   └── orin/             # Jetson Orin Nano Super specific containers
├── nvidia/               # NVIDIA GPU (CUDA) optimized containers
└── x86/                  # x86 CPU-only containers
```

## Ollama Container Configurations

Each platform directory contains an `ollama-compose.yaml` file with optimizations specific to that hardware platform:

### NVIDIA GPU (CUDA)
- Standard NVIDIA GPU support with CUDA
- Suitable for desktop/server systems with NVIDIA GPUs
- Uses the standard Ollama image with NVIDIA GPU passthrough

### AMD GPU (ROCm)
- AMD GPU support via ROCm
- Uses the `ollama/ollama:rocm` image
- Configured for optimal performance on AMD GPUs

### Apple Silicon
- Optimized for M1/M2/M3/M4 chips
- Uses Metal for GPU acceleration
- No special device mounts needed as Metal is integrated with macOS

### NVIDIA Jetson
- **Orin**: Optimized for Jetson Orin Nano Super with resource constraints
- **AGX**: Optimized for Jetson AGX Nano with higher resource limits
- Both use Jetson-specific device mappings and memory optimizations

### NVIDIA DGX/Digit
- High-performance configuration for NVIDIA DGX/Digit hardware
- Multi-GPU support with optimized memory and thread settings
- Configured for maximum performance on high-end NVIDIA hardware

### x86 CPU-only
- Fallback for x86 systems without GPU
- CPU-optimized settings for best performance without GPU acceleration

### ARM CPU-only
- For ARM-based systems without GPU acceleration
- Conservative resource settings for ARM architecture

## Usage

To use these platform-specific containers, you can either:

1. **Manually run the appropriate compose file**:
   ```bash
   cd FusionLoom/compose/platforms/<platform>
   docker-compose -f ollama-compose.yaml up -d
   # or for podman
   podman-compose -f ollama-compose.yaml up -d
   ```

2. **Use the platform detection in the launch script**:
   The `launch.sh` script will automatically detect your hardware and use the appropriate compose file.

## Network Configuration

All containers are configured to use the `fusionloom_net` external network, which should be created before starting the containers:

```bash
docker network create fusionloom_net
# or for podman
podman network create fusionloom_net
```

## Data Persistence

All containers mount a `./data/ollama` volume to persist model data. This directory will be created in the platform-specific directory when the container is first run.

## Environment Variables

Each platform configuration includes environment variables optimized for that specific hardware. You can adjust these variables in the compose files to fine-tune performance for your specific system.

## Adding New Platforms

To add support for a new platform:

1. Create a new directory under `platforms/`
2. Copy an existing `ollama-compose.yaml` file as a starting point
3. Modify the configuration for the new platform's specific requirements
4. Update the platform detection logic in the launch script

## Troubleshooting

If you encounter issues with a specific platform configuration:

1. Check that your hardware is properly detected and supported
2. Verify that all required device mappings are available on your system
3. Adjust memory and thread settings based on your specific hardware
4. Check container logs for any error messages:
   ```bash
   docker logs fusionloom-ollama
   # or for podman
   podman logs fusionloom-ollama
