# FusionLoom Graphical Installer

This directory contains a graphical installer for FusionLoom, which helps you configure and install FusionLoom with optimized settings for your hardware.

## Features

- **Hardware Detection**: Automatically detects your hardware platform, GPU, and container engine
- **Customizable Configuration**: Configure FusionLoom to match your hardware and preferences
- **Service Selection**: Choose which AI services to install and use
- **Visual Feedback**: See installation progress and status
- **Cross-Platform**: Works on Linux, macOS, and Windows

## Requirements

- Python 3.7 or higher
- pip (Python package manager)
- Docker or Podman (container engine)

## Running the Installer

### On Linux or macOS

1. Open a terminal
2. Navigate to the FusionLoom directory
3. Run the installer script:

```bash
cd installer
./run_installer.sh
```

### On Windows

1. Open Command Prompt or PowerShell
2. Navigate to the FusionLoom directory
3. Run the installer batch file:

```cmd
cd installer
run_installer.bat
```

## Installer Workflow

The installer guides you through the following steps:

1. **Hardware Configuration**:
   - Select your hardware platform (or use auto-detection)
   - Configure GPU settings
   - Set performance options

2. **Container Settings**:
   - Choose container engine (Docker or Podman)
   - Configure auto-start options
   - Set UI preferences

3. **AI Services**:
   - Select which AI services to install
   - LLM services (Ollama, etc.)
   - Image generation services (Stable Diffusion, etc.)
   - Speech services (TTS, STT)

4. **Installation**:
   - Review configuration summary
   - Install selected components
   - Get next steps for using FusionLoom

## Configuration Files

The installer creates the following configuration files:

- `cfg/config.ini`: Main configuration file for FusionLoom
- `.env`: Environment variables for container deployment
- `installer/settings.json`: Saved installer settings

## Troubleshooting

If you encounter issues with the installer:

1. **Python Environment Issues**:
   - Make sure Python 3.7+ is installed and in your PATH
   - Try creating a virtual environment manually:
     ```bash
     python -m venv venv
     source venv/bin/activate  # On Linux/macOS
     venv\Scripts\activate.bat  # On Windows
     pip install -r requirements.txt
     ```

2. **Container Engine Issues**:
   - Ensure Docker or Podman is installed and running
   - Check that your user has permissions to use the container engine

3. **Hardware Detection Issues**:
   - If auto-detection fails, manually select your hardware platform
   - Ensure you have the necessary drivers installed for your GPU

4. **Port Conflicts**:
   - If port 8501 is already in use, modify the port in the run script
   - If container ports conflict, modify them in the installer UI

## Manual Installation

If the graphical installer doesn't work for your system, you can still install FusionLoom manually:

1. Copy the appropriate compose files for your hardware
2. Create a `.env` file with your configuration
3. Run `./launch.sh` to start FusionLoom

## Uninstalling

To uninstall FusionLoom:

1. Stop all containers with `./stop.sh`
2. Remove the data directory to delete all container data
3. Remove the FusionLoom directory

## Contributing

If you encounter issues or have suggestions for improving the installer, please open an issue or pull request on the FusionLoom repository.
