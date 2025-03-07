#!/usr/bin/env python3

import os
import sys
import json
import yaml
import platform
import subprocess
import shutil
from pathlib import Path
import streamlit as st

# Try to import hardware detection libraries
# These are optional and the installer will work without them
HW_DETECTION_AVAILABLE = False
GPU_DETECTION_AVAILABLE = False

try:
    import psutil
    import cpuinfo
    HW_DETECTION_AVAILABLE = True
except ImportError:
    pass

try:
    import GPUtil
    GPU_DETECTION_AVAILABLE = True
except ImportError:
    pass

# Check if we're on ARM architecture
IS_ARM = platform.machine() in ["aarch64", "armv7l", "arm64"]

# Set up paths
SCRIPT_DIR = Path(__file__).parent.absolute()
REPO_ROOT = SCRIPT_DIR.parent
CONFIG_DIR = REPO_ROOT / "cfg"
CONFIG_FILE = CONFIG_DIR / "config.ini"
ENV_FILE = REPO_ROOT / ".env"

# Define container options
CONTAINER_ENGINES = ["auto", "docker", "podman"]
PLATFORM_TYPES = ["auto", "dgx_digit", "jetson_orin", "jetson_agx", "apple_silicon", "nvidia", "amd", "x86", "arm"]
GPU_VENDORS = ["auto", "nvidia", "amd", "apple", "cpu"]
POWER_MODES = ["balanced", "performance", "efficiency"]

# Define AI services
AI_SERVICES = {
    "LLM Services": {
        "ollama": {
            "name": "Ollama",
            "description": "Run large language models locally",
            "default": True,
            "container": "fusionloom-ollama",
            "port": 11434
        },
        "sillytavern": {
            "name": "SillyTavern",
            "description": "Advanced chat UI for LLMs",
            "default": False,
            "container": "fusionloom-sillytavern",
            "port": 8000
        }
    },
    "Image Generation": {
        "stable_diffusion": {
            "name": "Stable Diffusion (A1111)",
            "description": "Text-to-image generation with AUTOMATIC1111 WebUI",
            "default": False,
            "container": "fusionloom-a1111",
            "port": 7860
        },
        "comfyui": {
            "name": "ComfyUI",
            "description": "Node-based UI for Stable Diffusion",
            "default": False,
            "container": "fusionloom-comfyui",
            "port": 8188
        }
    },
    "Speech Services": {
        "tts": {
            "name": "Text-to-Speech",
            "description": "Convert text to speech",
            "default": False,
            "container": "fusionloom-tts",
            "port": 5500
        },
        "stt": {
            "name": "Speech-to-Text",
            "description": "Convert speech to text",
            "default": False,
            "container": "fusionloom-stt",
            "port": 5501
        }
    }
}

# Hardware detection functions
def detect_platform():
    """Detect the hardware platform"""
    system = platform.system()
    machine = platform.machine()
    
    # Check for NVIDIA DGX/Digit
    if os.path.exists("/etc/dgx-release") or (os.path.exists("/proc/cpuinfo") and "NVIDIA DGX" in open("/proc/cpuinfo").read()):
        return "dgx_digit"
    
    # Check for NVIDIA Jetson
    if os.path.exists("/etc/nv_tegra_release"):
        # Differentiate between Orin and AGX
        if os.path.exists("/proc/device-tree/model"):
            try:
                with open("/proc/device-tree/model", "r") as f:
                    model = f.read()
                    if "ORIN" in model:
                        return "jetson_orin"
                    else:
                        return "jetson_agx"
            except:
                pass
        return "jetson_agx"  # Default to AGX if can't determine
    
    # Check for Apple Silicon
    if system == "Darwin" and machine == "arm64":
        return "apple_silicon"
    
    # Check for NVIDIA GPU
    if GPU_DETECTION_AVAILABLE and not IS_ARM:
        try:
            nvidia_gpus = GPUtil.getGPUs()
            if nvidia_gpus:
                return "nvidia"
        except:
            pass
    
    # Check for AMD GPU
    if system == "Linux":
        try:
            if os.path.exists("/opt/rocm") or subprocess.run(["rocminfo"], capture_output=True, text=True, check=False).returncode == 0:
                return "amd"
        except:
            pass
    
    # Check for ARM CPU
    if machine in ["aarch64", "armv7l", "arm64"]:
        return "arm"
    
    # Default to x86
    return "x86"

def detect_gpu_vendor():
    """Detect the GPU vendor"""
    system = platform.system()
    
    # Check for Apple Silicon
    if system == "Darwin" and platform.machine() == "arm64":
        return "apple"
    
    # Check for NVIDIA GPU
    if GPU_DETECTION_AVAILABLE and not IS_ARM:
        try:
            nvidia_gpus = GPUtil.getGPUs()
            if nvidia_gpus:
                return "nvidia"
        except:
            pass
    
    # Check for AMD GPU
    if system == "Linux":
        try:
            if os.path.exists("/opt/rocm") or subprocess.run(["rocminfo"], capture_output=True, text=True, check=False).returncode == 0:
                return "amd"
        except:
            pass
    
    # Default to CPU
    return "cpu"

def detect_container_engine():
    """Detect the container engine"""
    # Check for Podman
    try:
        podman_version = subprocess.run(["podman", "--version"], capture_output=True, text=True, check=False)
        if podman_version.returncode == 0:
            return "podman"
    except:
        pass
    
    # Check for Docker
    try:
        docker_version = subprocess.run(["docker", "--version"], capture_output=True, text=True, check=False)
        if docker_version.returncode == 0:
            return "docker"
    except:
        pass
    
    # Default to auto
    return "auto"

def get_system_memory():
    """Get the system memory in GB"""
    if HW_DETECTION_AVAILABLE:
        try:
            mem = psutil.virtual_memory()
            return round(mem.total / (1024**3))
        except:
            pass
    
    # Default to 8GB
    return 8

def get_cpu_info():
    """Get CPU information"""
    if HW_DETECTION_AVAILABLE:
        try:
            info = cpuinfo.get_cpu_info()
            return {
                "brand": info.get("brand_raw", "Unknown CPU"),
                "cores": info.get("count", 4),
                "arch": info.get("arch", platform.machine())
            }
        except:
            pass
    
    # Default CPU info
    return {
        "brand": "Unknown CPU",
        "cores": 4,
        "arch": platform.machine()
    }

# Configuration functions
def create_config(settings):
    """Create the configuration file"""
    # Create config directory if it doesn't exist
    os.makedirs(CONFIG_DIR, exist_ok=True)
    
    # Create config.ini
    with open(CONFIG_FILE, "w") as f:
        f.write("[General]\n")
        f.write(f"theme = {settings['theme']}\n")
        f.write(f"save_sessions = {str(settings['save_sessions']).lower()}\n")
        f.write("\n")
        
        f.write("[Endpoints]\n")
        for service_type, services in AI_SERVICES.items():
            for service_id, service in services.items():
                if settings['services'].get(service_id, False):
                    f.write(f"{service_id}_api = http://localhost:{service['port']}\n")
        f.write("\n")
        
        f.write("[Containers]\n")
        f.write(f"auto_start = {str(settings['auto_start']).lower()}\n")
        f.write(f"container_engine = {settings['container_engine']}\n")
        f.write("\n")
        
        f.write("[Hardware]\n")
        f.write(f"gpu_vendor = {settings['gpu_vendor']}\n")
        f.write(f"gpu_memory_limit = {settings['gpu_memory']}G\n")
        f.write(f"acceleration = {str(settings['acceleration']).lower()}\n")
        f.write(f"platform = {settings['platform']}\n")
        f.write(f"power_mode = {settings['power_mode']}\n")
    
    # Create .env file
    with open(ENV_FILE, "w") as f:
        f.write(f"FUSION_LOOM_VERSION=0.1\n")
        f.write(f"CONTAINER_ENGINE={settings['container_engine']}\n")
        f.write(f"DATA_DIR={REPO_ROOT}/data\n")
        
        # Add service-specific environment variables
        for service_type, services in AI_SERVICES.items():
            for service_id, service in services.items():
                if settings['services'].get(service_id, False):
                    volume_name = service_id.upper()
                    f.write(f"{volume_name}_VOLUME={REPO_ROOT}/data/{service_id}\n")
    
    # Create JSON settings file for the installer
    installer_settings = settings.copy()
    installer_settings['version'] = "0.1"
    
    with open(REPO_ROOT / "installer" / "settings.json", "w") as f:
        json.dump(installer_settings, f, indent=2)
    
    return True

def install_containers(settings, progress_bar):
    """Install the selected containers"""
    # Create data directories
    os.makedirs(REPO_ROOT / "data", exist_ok=True)
    
    # Get the container engine
    container_engine = settings['container_engine']
    if container_engine == "auto":
        container_engine = detect_container_engine()
    
    # Get the platform
    platform_type = settings['platform']
    if platform_type == "auto":
        platform_type = detect_platform()
    
    # Create the network
    progress_bar.progress(0.1, text="Creating network...")
    try:
        if container_engine == "docker":
            subprocess.run(["docker", "network", "create", "fusionloom_net"], check=False)
        elif container_engine == "podman":
            subprocess.run(["podman", "network", "create", "fusionloom_net"], check=False)
    except:
        pass
    
    # Install the web UI container
    progress_bar.progress(0.2, text="Installing web UI container...")
    try:
        if container_engine == "docker":
            subprocess.run(["docker", "pull", "ghcr.io/open-webui/open-webui:main"], check=False)
        elif container_engine == "podman":
            subprocess.run(["podman", "pull", "ghcr.io/open-webui/open-webui:main"], check=False)
    except:
        pass
    
    # Install selected service containers
    progress_value = 0.3
    progress_step = 0.7 / sum(1 for s in settings['services'].values() if s)
    
    for service_type, services in AI_SERVICES.items():
        for service_id, service in services.items():
            if settings['services'].get(service_id, False):
                progress_bar.progress(progress_value, text=f"Installing {service['name']}...")
                
                # Create data directory for the service
                os.makedirs(REPO_ROOT / "data" / service_id, exist_ok=True)
                
                # Copy the appropriate compose file
                if service_id == "ollama":
                    platform_dir = platform_type
                    if platform_type in ["jetson_orin", "jetson_agx"]:
                        platform_dir = platform_type.replace("_", "/")
                    
                    src_file = REPO_ROOT / "compose" / "platforms" / platform_dir / "ollama-compose.yaml"
                    dst_dir = REPO_ROOT / "data" / service_id
                    
                    if src_file.exists():
                        shutil.copy(src_file, dst_dir / "docker-compose.yaml")
                
                progress_value += progress_step
    
    progress_bar.progress(1.0, text="Installation complete!")
    return True

# Streamlit UI
def main():
    st.set_page_config(
        page_title="FusionLoom Installer",
        page_icon="🧠",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Custom CSS
    st.markdown("""
    <style>
    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
    }
    .stButton button {
        width: 100%;
    }
    .stProgress .st-bo {
        background-color: #3498db;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Title
    st.title("🧠 FusionLoom Installer")
    st.markdown("Configure and install FusionLoom with optimized settings for your hardware.")
    
    # Initialize session state
    if 'page' not in st.session_state:
        st.session_state.page = 0
    
    if 'settings' not in st.session_state:
        # Detect hardware
        platform_type = "auto"
        gpu_vendor = "auto"
        container_engine = "auto"
        
        if HW_DETECTION_AVAILABLE:
            platform_type = detect_platform()
            gpu_vendor = detect_gpu_vendor()
            container_engine = detect_container_engine()
        
        # Initialize settings
        st.session_state.settings = {
            "platform": platform_type,
            "gpu_vendor": gpu_vendor,
            "gpu_memory": "8",
            "acceleration": True,
            "power_mode": "balanced",
            "container_engine": container_engine,
            "auto_start": True,
            "theme": "dark",
            "save_sessions": True,
            "services": {service_id: service["default"] for service_type, services in AI_SERVICES.items() for service_id, service in services.items()}
        }
    
    # Sidebar
    with st.sidebar:
        st.image("https://raw.githubusercontent.com/CaptainASIC/FusionLoom/main/ui/static/img/fusion-logo.svg", width=100)
        st.header("FusionLoom v0.1")
        
        # Navigation
        st.subheader("Navigation")
        if st.button("1. Hardware Configuration", disabled=st.session_state.page == 0):
            st.session_state.page = 0
        
        if st.button("2. Container Settings", disabled=st.session_state.page == 1):
            st.session_state.page = 1
        
        if st.button("3. AI Services", disabled=st.session_state.page == 2):
            st.session_state.page = 2
        
        if st.button("4. Install", disabled=st.session_state.page == 3):
            st.session_state.page = 3
        
        # System information
        st.subheader("System Information")
        
        if HW_DETECTION_AVAILABLE:
            cpu_info = get_cpu_info()
            st.markdown(f"**CPU:** {cpu_info['brand']}")
            st.markdown(f"**Cores:** {cpu_info['cores']}")
            st.markdown(f"**Architecture:** {cpu_info['arch']}")
            st.markdown(f"**Memory:** {get_system_memory()} GB")
        else:
            st.markdown(f"**Architecture:** {platform.machine()}")
            st.markdown(f"**System:** {platform.system()}")
        
        if GPU_DETECTION_AVAILABLE and not IS_ARM:
            try:
                gpus = GPUtil.getGPUs()
                if gpus:
                    st.markdown(f"**GPU:** {gpus[0].name}")
                    st.markdown(f"**GPU Memory:** {gpus[0].memoryTotal} MB")
            except:
                pass
        
        st.markdown(f"**OS:** {platform.system()} {platform.release()}")
        
        # Container engines
        st.subheader("Container Engines")
        
        try:
            docker_version = subprocess.run(["docker", "--version"], capture_output=True, text=True, check=False)
            if docker_version.returncode == 0:
                st.markdown(f"✅ Docker: {docker_version.stdout.strip()}")
            else:
                st.markdown("❌ Docker: Not installed")
        except:
            st.markdown("❌ Docker: Not installed")
        
        try:
            podman_version = subprocess.run(["podman", "--version"], capture_output=True, text=True, check=False)
            if podman_version.returncode == 0:
                st.markdown(f"✅ Podman: {podman_version.stdout.strip()}")
            else:
                st.markdown("❌ Podman: Not installed")
        except:
            st.markdown("❌ Podman: Not installed")
    
    # Main content
    if st.session_state.page == 0:
        # Hardware Configuration
        st.header("Hardware Configuration")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Platform")
            platform_type = st.selectbox(
                "Select your hardware platform",
                PLATFORM_TYPES,
                index=PLATFORM_TYPES.index(st.session_state.settings["platform"]),
                help="The hardware platform you're running on. Auto will detect automatically."
            )
            
            gpu_vendor = st.selectbox(
                "GPU Vendor",
                GPU_VENDORS,
                index=GPU_VENDORS.index(st.session_state.settings["gpu_vendor"]),
                help="The GPU vendor of your system. Auto will detect automatically."
            )
            
            gpu_memory = st.text_input(
                "GPU Memory Limit (GB)",
                value=st.session_state.settings["gpu_memory"],
                help="Maximum GPU memory to use in gigabytes."
            )
        
        with col2:
            st.subheader("Performance")
            
            acceleration = st.checkbox(
                "Hardware Acceleration",
                value=st.session_state.settings["acceleration"],
                help="Enable hardware acceleration for AI models."
            )
            
            power_mode = st.selectbox(
                "Power Mode",
                POWER_MODES,
                index=POWER_MODES.index(st.session_state.settings["power_mode"]),
                help="Power mode affects performance and energy usage."
            )
        
        # Update settings
        st.session_state.settings.update({
            "platform": platform_type,
            "gpu_vendor": gpu_vendor,
            "gpu_memory": gpu_memory,
            "acceleration": acceleration,
            "power_mode": power_mode
        })
        
        # Navigation buttons
        col1, col2 = st.columns([1, 1])
        with col2:
            if st.button("Next: Container Settings →"):
                st.session_state.page = 1
                st.rerun()
    
    elif st.session_state.page == 1:
        # Container Settings
        st.header("Container Settings")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Container Engine")
            
            container_engine = st.selectbox(
                "Container Engine",
                CONTAINER_ENGINES,
                index=CONTAINER_ENGINES.index(st.session_state.settings["container_engine"]),
                help="The container engine to use. Auto will use Podman if available, otherwise Docker."
            )
            
            auto_start = st.checkbox(
                "Auto-start Containers",
                value=st.session_state.settings["auto_start"],
                help="Automatically start containers when launching FusionLoom."
            )
        
        with col2:
            st.subheader("UI Settings")
            
            theme = st.selectbox(
                "Theme",
                ["dark", "light", "red", "blue", "green", "purple", "system"],
                index=["dark", "light", "red", "blue", "green", "purple", "system"].index(st.session_state.settings["theme"]),
                help="The UI theme to use."
            )
            
            save_sessions = st.checkbox(
                "Save Sessions",
                value=st.session_state.settings["save_sessions"],
                help="Save and restore sessions across application restarts."
            )
        
        # Update settings
        st.session_state.settings.update({
            "container_engine": container_engine,
            "auto_start": auto_start,
            "theme": theme,
            "save_sessions": save_sessions
        })
        
        # Navigation buttons
        col1, col2, col3 = st.columns([1, 1, 1])
        with col1:
            if st.button("← Back: Hardware Configuration"):
                st.session_state.page = 0
                st.rerun()
        with col3:
            if st.button("Next: AI Services →"):
                st.session_state.page = 2
                st.rerun()
    
    elif st.session_state.page == 2:
        # AI Services
        st.header("AI Services")
        st.markdown("Select the AI services you want to install and use with FusionLoom.")
        
        services = st.session_state.settings["services"]
        
        for service_type, service_group in AI_SERVICES.items():
            st.subheader(service_type)
            
            cols = st.columns(len(service_group))
            
            for i, (service_id, service) in enumerate(service_group.items()):
                with cols[i]:
                    st.markdown(f"**{service['name']}**")
                    st.markdown(service['description'])
                    services[service_id] = st.checkbox(
                        f"Install {service['name']}",
                        value=services.get(service_id, service["default"]),
                        key=f"service_{service_id}"
                    )
                    st.markdown(f"Port: {service['port']}")
        
        # Update settings
        st.session_state.settings["services"] = services
        
        # Navigation buttons
        col1, col2, col3 = st.columns([1, 1, 1])
        with col1:
            if st.button("← Back: Container Settings"):
                st.session_state.page = 1
                st.rerun()
        with col3:
            if st.button("Next: Install →"):
                st.session_state.page = 3
                st.rerun()
    
    elif st.session_state.page == 3:
        # Install
        st.header("Install FusionLoom")
        
        # Show configuration summary
        st.subheader("Configuration Summary")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**Hardware Configuration**")
            st.markdown(f"Platform: {st.session_state.settings['platform']}")
            st.markdown(f"GPU Vendor: {st.session_state.settings['gpu_vendor']}")
            st.markdown(f"GPU Memory: {st.session_state.settings['gpu_memory']} GB")
            st.markdown(f"Hardware Acceleration: {'Enabled' if st.session_state.settings['acceleration'] else 'Disabled'}")
            st.markdown(f"Power Mode: {st.session_state.settings['power_mode']}")
        
        with col2:
            st.markdown("**Container Settings**")
            st.markdown(f"Container Engine: {st.session_state.settings['container_engine']}")
            st.markdown(f"Auto-start Containers: {'Yes' if st.session_state.settings['auto_start'] else 'No'}")
            st.markdown(f"Theme: {st.session_state.settings['theme']}")
            st.markdown(f"Save Sessions: {'Yes' if st.session_state.settings['save_sessions'] else 'No'}")
        
        st.markdown("**Selected Services**")
        for service_type, service_group in AI_SERVICES.items():
            services_list = [service["name"] for service_id, service in service_group.items() if st.session_state.settings["services"].get(service_id, False)]
            if services_list:
                st.markdown(f"- {service_type}: {', '.join(services_list)}")
        
        # Install button
        if st.button("Install FusionLoom", type="primary"):
            progress_bar = st.progress(0, text="Starting installation...")
            
            # Create configuration
            if create_config(st.session_state.settings):
                # Install containers
                if install_containers(st.session_state.settings, progress_bar):
                    st.success("FusionLoom has been successfully installed!")
                    st.markdown("""
                    ### Next Steps
                    
                    1. Start FusionLoom by running `./launch.sh` in the FusionLoom directory
                    2. Access the web interface at http://localhost:8080
                    3. Stop FusionLoom by running `./stop.sh` in the FusionLoom directory
                    """)
                else:
                    st.error("Failed to install containers. Please check the logs for more information.")
            else:
                st.error("Failed to create configuration. Please check the logs for more information.")
        
        # Navigation buttons
        col1, col2 = st.columns([1, 1])
        with col1:
            if st.button("← Back: AI Services"):
                st.session_state.page = 2
                st.rerun()

if __name__ == "__main__":
    main()
