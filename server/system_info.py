#!/usr/bin/env python3
import os
import sys
import json
import platform
import subprocess
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/system-info')
def get_system_info():
    """Get system information and return as JSON"""
    system_info = {
        'architecture': get_architecture(),
        'cpu': get_cpu_info(),
        'gpu': get_gpu_info(),
        'ram': get_ram_info(),
        'os': get_os_info()
    }
    return jsonify(system_info)

def get_architecture():
    """Get system architecture"""
    arch = platform.machine()
    if arch == 'x86_64' or arch == 'AMD64':
        return 'x86_64'
    elif arch == 'arm64' or arch == 'aarch64':
        return 'ARM'
    else:
        return arch

def get_cpu_info():
    """Get CPU information"""
    try:
        if platform.system() == 'Linux':
            # Try to get CPU info from lscpu
            cpu_info = subprocess.check_output("lscpu | grep 'Model name'", shell=True).decode().strip()
            cpu_model = cpu_info.split(':')[1].strip()
            
            # Get CPU core count
            core_count = os.cpu_count()
            
            if "AMD Ryzen" in cpu_model:
                return f"{cpu_model} ({core_count} Threads)"
            else:
                return f"{cpu_model} ({core_count} cores)"
        elif platform.system() == 'Darwin':  # macOS
            # For Apple Silicon
            if platform.machine() == 'arm64':
                cmd = "sysctl -n machdep.cpu.brand_string"
                cpu_model = subprocess.check_output(cmd, shell=True).decode().strip()
                if "Apple" not in cpu_model:
                    # This is likely Apple Silicon, but not reported correctly
                    model = subprocess.check_output("system_profiler SPHardwareDataType | grep 'Chip'", shell=True).decode().strip()
                    if "Apple M" in model:
                        cpu_model = model.split(":")[1].strip()
                
                core_count = os.cpu_count()
                return f"{cpu_model} ({core_count} cores)"
            else:
                # For Intel Macs
                cmd = "sysctl -n machdep.cpu.brand_string"
                cpu_model = subprocess.check_output(cmd, shell=True).decode().strip()
                core_count = os.cpu_count()
                return f"{cpu_model} ({core_count} cores)"
        elif platform.system() == 'Windows':
            # For Windows
            import ctypes
            class SYSTEM_INFO(ctypes.Structure):
                _fields_ = [
                    ("wProcessorArchitecture", ctypes.c_ushort),
                    ("wReserved", ctypes.c_ushort),
                    ("dwPageSize", ctypes.c_ulong),
                    ("lpMinimumApplicationAddress", ctypes.c_void_p),
                    ("lpMaximumApplicationAddress", ctypes.c_void_p),
                    ("dwActiveProcessorMask", ctypes.c_ulong),
                    ("dwNumberOfProcessors", ctypes.c_ulong),
                    ("dwProcessorType", ctypes.c_ulong),
                    ("dwAllocationGranularity", ctypes.c_ulong),
                    ("wProcessorLevel", ctypes.c_ushort),
                    ("wProcessorRevision", ctypes.c_ushort)
                ]
            
            si = SYSTEM_INFO()
            ctypes.windll.kernel32.GetSystemInfo(ctypes.byref(si))
            
            # Get CPU model from registry
            import winreg
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\CentralProcessor\0")
            cpu_model = winreg.QueryValueEx(key, "ProcessorNameString")[0]
            winreg.CloseKey(key)
            
            return f"{cpu_model} ({si.dwNumberOfProcessors} cores)"
    except Exception as e:
        print(f"Error getting CPU info: {e}")
    
    # Fallback to platform.processor()
    return platform.processor()

def get_gpu_info():
    """Get GPU information"""
    try:
        if platform.system() == 'Linux':
            # Try NVIDIA first
            try:
                nvidia_smi = subprocess.check_output('nvidia-smi -L', shell=True).decode().strip()
                if nvidia_smi:
                    # Extract the GPU model from the first line
                    first_line = nvidia_smi.split('\n')[0]
                    gpu_model = first_line.split(':')[1].split('(')[0].strip()
                    return f"NVIDIA {gpu_model}"
            except:
                pass
            
            # Try AMD
            try:
                output = subprocess.check_output(['lspci', '-v'], text=True)
                vga_devices = [line for line in output.split('\n') if 'VGA compatible controller' in line or 'Display controller' in line]
                for device in vga_devices:
                    if 'AMD' in device or 'ATI' in device:
                        # Extract model name
                        model = device.split(':')[2].strip()
                        return f"AMD {model}"
            except:
                pass
            
            # Try Intel
            try:
                output = subprocess.check_output(['lspci', '-v'], text=True)
                vga_devices = [line for line in output.split('\n') if 'VGA compatible controller' in line]
                for device in vga_devices:
                    if 'Intel' in device:
                        # Extract model name
                        model = device.split(':')[2].strip()
                        return f"Intel {model}"
            except:
                pass
        
        elif platform.system() == 'Darwin':  # macOS
            try:
                # For Apple Silicon, the GPU is integrated
                if platform.machine() == 'arm64':
                    model = subprocess.check_output("system_profiler SPHardwareDataType | grep 'Chip'", shell=True).decode().strip()
                    if "Apple M" in model:
                        return model.split(":")[1].strip() + " GPU"
                
                # For Intel Macs with discrete GPUs
                output = subprocess.check_output("system_profiler SPDisplaysDataType", shell=True).decode()
                if "Chipset Model" in output:
                    for line in output.split('\n'):
                        if "Chipset Model" in line:
                            gpu_model = line.split(':')[1].strip()
                            return gpu_model
            except:
                pass
        
        elif platform.system() == 'Windows':
            try:
                # Use Windows Management Instrumentation (WMI)
                import wmi
                computer = wmi.WMI()
                gpu_info = computer.Win32_VideoController()[0]
                return gpu_info.Name
            except:
                pass
    except Exception as e:
        print(f"Error getting GPU info: {e}")
    
    return "Unknown GPU"

def get_ram_info():
    """Get RAM information"""
    try:
        if platform.system() == 'Linux':
            # Get total memory from /proc/meminfo
            with open('/proc/meminfo', 'r') as f:
                for line in f:
                    if 'MemTotal' in line:
                        # Convert from KB to GB
                        total_mem = int(line.split()[1]) / (1024 * 1024)
                        return f"{total_mem:.1f} GB"
        
        elif platform.system() == 'Darwin':  # macOS
            # Use sysctl to get physical memory
            mem_bytes = subprocess.check_output("sysctl -n hw.memsize", shell=True)
            mem_gb = int(mem_bytes) / (1024 ** 3)
            return f"{mem_gb:.1f} GB"
        
        elif platform.system() == 'Windows':
            # Use Windows Management Instrumentation (WMI)
            import wmi
            computer = wmi.WMI()
            system_info = computer.Win32_ComputerSystem()[0]
            mem_gb = float(system_info.TotalPhysicalMemory) / (1024 ** 3)
            return f"{mem_gb:.1f} GB"
    except Exception as e:
        print(f"Error getting RAM info: {e}")
    
    # Fallback to psutil if available
    try:
        import psutil
        mem_gb = psutil.virtual_memory().total / (1024 ** 3)
        return f"{mem_gb:.1f} GB"
    except:
        pass
    
    return "Unknown"

def get_os_info():
    """Get OS information"""
    try:
        system = platform.system()
        if system == 'Linux':
            # Try to get distribution info
            try:
                with open('/etc/os-release', 'r') as f:
                    os_release = f.read()
                pretty_name = None
                for line in os_release.split('\n'):
                    if line.startswith('PRETTY_NAME='):
                        pretty_name = line.split('=')[1].strip('"')
                        break
                if pretty_name:
                    return pretty_name
            except:
                pass
        
        # Fallback to platform.platform()
        return platform.platform()
    except Exception as e:
        print(f"Error getting OS info: {e}")
    
    return platform.system()

if __name__ == '__main__':
    # If run directly, print system info to stdout
    system_info = {
        'architecture': get_architecture(),
        'cpu': get_cpu_info(),
        'gpu': get_gpu_info(),
        'ram': get_ram_info(),
        'os': get_os_info()
    }
    print(json.dumps(system_info, indent=2))
    
    # If --serve flag is provided, start the API server
    if len(sys.argv) > 1 and sys.argv[1] == '--serve':
        port = int(sys.argv[2]) if len(sys.argv) > 2 else 5000
        print(f"Starting system info API server on port {port}...")
        print(f"API will be available at http://localhost:{port}/api/system-info")
        app.run(host='0.0.0.0', port=port, debug=False)
