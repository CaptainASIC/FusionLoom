// FusionLoom Custom UI JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the UI
    initializeFusionLoom();
    
    // Load saved settings
    loadSettings();
    
    // Update performance gauges periodically
    setInterval(updatePerformanceGauges, 2000);
    
    // Update container status periodically
    setInterval(checkContainerStatus, 5000);
    
    // Update status bar indicators
    updateStatusBarIndicators();
    
    // Update system info
    updateSystemInfo();
    
    // Make logo clickable to show about modal
    const logo = document.querySelector('.fusion-logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', showAboutModal);
    }
});

function initializeFusionLoom() {
    // Initialize theme preview functionality
    initializeThemePreview();

    // Add event listeners for menu items
    const menuItems = document.querySelectorAll('.fusion-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all menu items
            menuItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked menu item
            this.classList.add('active');
            
            // Handle navigation based on data-page attribute
            const targetPage = this.getAttribute('data-page');
            navigateToPage(targetPage);
        });
    });
    
    // Add event listener for mobile menu toggle
    const menuToggle = document.querySelector('.fusion-menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.fusion-sidebar');
            sidebar.classList.toggle('open');
        });
    }
    
    // Add event listener for logo click (about modal)
    const logo = document.querySelector('.fusion-logo');
    if (logo) {
        logo.addEventListener('click', function() {
            showAboutModal();
        });
    }
    
    // Add event listener for modal close button
    const modalClose = document.querySelector('.fusion-modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            hideAboutModal();
        });
    }
    
    // Close modal when clicking outside
    const modal = document.querySelector('.fusion-modal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                hideAboutModal();
            }
        });
    }
    
    // Initialize system info
    updateSystemInfo();
}

function navigateToPage(page) {
    console.log(`Navigating to page: ${page}`);
    
    // Hide all pages
    const pages = document.querySelectorAll('.fusion-page');
    pages.forEach(p => p.style.display = 'none');
    
    // Show the selected page
    const selectedPage = document.getElementById(`page-${page}`);
    if (selectedPage) {
        selectedPage.style.display = 'block';
    }
    
    // Special handling for home page
    if (page === 'home') {
        document.querySelector('.fusion-home').style.display = 'flex';
    }
    
    // Special handling for settings page - refresh container status
    if (page === 'settings') {
        checkContainerStatus();
    }
}

// Status Bar Management
function updateStatusBarIndicators() {
    // Get status bar indicators
    const podmanStatus = document.getElementById('podman-status');
    const ollamaStatus = document.getElementById('ollama-status');
    const sdStatus = document.getElementById('sd-status');
    const ttsStatus = document.getElementById('tts-status');
    const sttStatus = document.getElementById('stt-status');
    
    // Set initial status (will be updated by checkContainerStatus)
    if (podmanStatus) podmanStatus.className = 'status-indicator disabled';
    if (ollamaStatus) ollamaStatus.className = 'status-indicator disabled';
    if (sdStatus) sdStatus.className = 'status-indicator disabled';
    if (ttsStatus) ttsStatus.className = 'status-indicator disabled';
    if (sttStatus) sttStatus.className = 'status-indicator disabled';
    
    // Add click handlers
    if (podmanStatus) {
        podmanStatus.addEventListener('click', function() {
            toggleContainerStatus(this);
        });
    }
    
    if (ollamaStatus) {
        ollamaStatus.addEventListener('click', function() {
            toggleContainerStatus(this);
        });
    }
    
    if (sdStatus) {
        sdStatus.addEventListener('click', function() {
            toggleContainerStatus(this);
        });
    }
    
    if (ttsStatus) {
        ttsStatus.addEventListener('click', function() {
            toggleContainerStatus(this);
        });
    }
    
    if (sttStatus) {
        sttStatus.addEventListener('click', function() {
            toggleContainerStatus(this);
        });
    }
    
    // Update status periodically
    setInterval(updateContainerStatusBar, 5000);
    
    // Initial update
    updateContainerStatusBar();
}

function updateContainerStatusBar() {
    // This function updates the status bar indicators
    // In a real implementation, this would make API calls to check container status
    
    // For demo purposes, we'll simulate container status
    const podmanStatus = document.getElementById('podman-status');
    const ollamaStatus = document.getElementById('ollama-status');
    const sdStatus = document.getElementById('sd-status');
    const ttsStatus = document.getElementById('tts-status');
    const sttStatus = document.getElementById('stt-status');
    
    // Simulate Podman status (always running in demo)
    if (podmanStatus) {
        podmanStatus.className = 'status-indicator online';
    }
    
    // Simulate container statuses
    if (ollamaStatus) {
        // 80% chance of being online
        ollamaStatus.className = Math.random() < 0.8 ? 
            'status-indicator online' : 'status-indicator offline';
    }
    
    if (sdStatus) {
        // 60% chance of being online
        sdStatus.className = Math.random() < 0.6 ? 
            'status-indicator online' : 'status-indicator offline';
    }
    
    if (ttsStatus) {
        // 70% chance of being online
        ttsStatus.className = Math.random() < 0.7 ? 
            'status-indicator online' : 'status-indicator offline';
    }
    
    if (sttStatus) {
        // 70% chance of being online
        sttStatus.className = Math.random() < 0.7 ? 
            'status-indicator online' : 'status-indicator offline';
    }
}

function toggleContainerStatus(indicator) {
    // Get the container name from the indicator's ID
    const containerId = indicator.id;
    const containerName = containerId.replace('-status', '');
    
    // Create a modal for container actions
    let modal = document.createElement('div');
    modal.className = 'fusion-modal';
    
    // Determine current status
    const isRunning = indicator.classList.contains('online');
    
    modal.innerHTML = `
        <div class="fusion-modal-content">
            <div class="fusion-modal-header">
                <h2 class="fusion-modal-title">Container Actions: ${containerName}</h2>
                <button class="fusion-modal-close" onclick="this.closest('.fusion-modal').remove()">&times;</button>
            </div>
            <div class="fusion-modal-body">
                <p>Current status: <strong>${isRunning ? 'Running' : 'Stopped'}</strong></p>
                <div class="fusion-button-group" style="display: flex; gap: 10px; margin-top: 15px;">
                    ${isRunning ? 
                        `<button class="fusion-button" id="stop-container-btn">Stop Container</button>
                         <button class="fusion-button" id="restart-container-btn">Restart Container</button>` : 
                        `<button class="fusion-button" id="start-container-btn">Start Container</button>`}
                    <button class="fusion-button secondary" onclick="this.closest('.fusion-modal').remove()">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Set up event listeners for the buttons
    if (isRunning) {
        const stopBtn = document.getElementById('stop-container-btn');
        const restartBtn = document.getElementById('restart-container-btn');
        
        if (stopBtn) {
            stopBtn.onclick = function() {
                // Simulate stopping the container
                indicator.className = 'status-indicator offline';
                showNotification(`Container '${containerName}' stopped`, 'info');
                modal.remove();
            };
        }
        
        if (restartBtn) {
            restartBtn.onclick = function() {
                // Simulate restarting the container
                indicator.className = 'status-indicator warning';
                setTimeout(() => {
                    indicator.className = 'status-indicator online';
                }, 2000);
                showNotification(`Container '${containerName}' restarting...`, 'info');
                modal.remove();
            };
        }
    } else {
        const startBtn = document.getElementById('start-container-btn');
        
        if (startBtn) {
            startBtn.onclick = function() {
                // Simulate starting the container
                indicator.className = 'status-indicator warning';
                setTimeout(() => {
                    indicator.className = 'status-indicator online';
                }, 2000);
                showNotification(`Container '${containerName}' starting...`, 'info');
                modal.remove();
            };
        }
    }
}

function updatePerformanceGauges() {
    // This would normally fetch real system metrics
    // For demo purposes, we'll use random values
    
    // CPU usage (random value between 10% and 80%)
    const cpuUsage = Math.floor(Math.random() * 70) + 10;
    updateGauge('cpu', cpuUsage);
    
    // Memory usage (random value between 20% and 90%)
    const memoryUsage = Math.floor(Math.random() * 70) + 20;
    updateGauge('memory', memoryUsage);
    
    // GPU usage (random value between 0% and 100%)
    const gpuUsage = Math.floor(Math.random() * 100);
    updateGauge('gpu', gpuUsage);
}

function updateGauge(id, value) {
    const gauge = document.querySelector(`#gauge-${id} .fusion-gauge-fill`);
    const valueDisplay = document.querySelector(`#gauge-${id} .fusion-gauge-value`);
    
    if (gauge && valueDisplay) {
        gauge.style.width = `${value}%`;
        valueDisplay.textContent = `${value}%`;
        
        // Update color based on value
        if (value < 50) {
            gauge.style.backgroundColor = 'var(--fusion-success)';
        } else if (value < 80) {
            gauge.style.backgroundColor = 'var(--fusion-warning)';
        } else {
            gauge.style.backgroundColor = 'var(--fusion-danger)';
        }
    }
}

function updateSystemInfo() {
    // In a real implementation, this would fetch actual system information
    // For now, we'll use placeholder data
    const systemInfo = document.querySelector('.fusion-system-info');
    
    if (systemInfo) {
        // Get browser and OS information
        const userAgent = navigator.userAgent;
        let osInfo = "Unknown OS";
        let browserInfo = "Unknown Browser";
        
        // Detect OS
        if (userAgent.indexOf("Win") !== -1) osInfo = "Windows";
        else if (userAgent.indexOf("Mac") !== -1) osInfo = "MacOS";
        else if (userAgent.indexOf("Linux") !== -1) osInfo = "Linux";
        else if (userAgent.indexOf("Android") !== -1) osInfo = "Android";
        else if (userAgent.indexOf("iOS") !== -1) osInfo = "iOS";
        
        // Detect browser
        if (userAgent.indexOf("Chrome") !== -1) browserInfo = "Chrome";
        else if (userAgent.indexOf("Firefox") !== -1) browserInfo = "Firefox";
        else if (userAgent.indexOf("Safari") !== -1) browserInfo = "Safari";
        else if (userAgent.indexOf("Edge") !== -1) browserInfo = "Edge";
        
        systemInfo.innerHTML = `
            <div>System: ${osInfo}</div>
            <div>Browser: ${browserInfo}</div>
            <div>Resolution: ${window.innerWidth}x${window.innerHeight}</div>
            <div>FusionLoom v0.1</div>
        `;
    }
}

function showAboutModal() {
    const modal = document.querySelector('.fusion-modal');
    if (modal) {
        // Ensure the modal inherits the current theme before displaying
        const currentTheme = document.documentElement.className.match(/theme-([a-z]+)/);
        if (currentTheme && currentTheme[1]) {
            console.log('Modal using theme:', currentTheme[1]);
        }
        modal.style.display = 'flex';
    }
}

function hideAboutModal() {
    const modal = document.querySelector('.fusion-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Container Status Management
function checkContainerStatus() {
    // This function checks the status of containers and updates the UI
    // In a real implementation, this would make API calls to the container engine
    
    // Define known containers and their status indicators in the footer
    const footerContainerMap = {
        'podman': document.getElementById('podman-status'),
        'ollama': document.getElementById('ollama-status'),
        'sd': document.getElementById('sd-status'),
        'tts': document.getElementById('tts-status'),
        'stt': document.getElementById('stt-status')
    };
    
    // Make API call to check container status
    fetch('/api/container-status')
        .then(response => response.json())
        .then(data => {
            // Filter containers to only show those with 'fusionloom-' in the name
            const fusionloomContainers = data.containers.filter(c => c.name.includes('fusionloom-'));
            
            // Update footer status indicators based on container status
            Object.entries(footerContainerMap).forEach(([serviceType, indicator]) => {
                if (!indicator) return; // Skip if no indicator
                
                // Look for a container with a name matching the service type
                const containerInfo = fusionloomContainers.find(c => c.name.includes(`fusionloom-${serviceType}`));
                if (containerInfo) {
                    updateContainerStatusIndicator(indicator, containerInfo.status);
                } else {
                    // Container not found, mark as offline
                    updateContainerStatusIndicator(indicator, 'not_found');
                }
            });
        })
        .catch(error => {
            console.error('Error checking container status:', error);
            
            // Fallback to simulated status for demo
            simulateContainerStatus(footerContainerMap);
        });
}

function simulateContainerStatus(containerMap) {
    // This is a fallback function that simulates container status
    // In a real implementation, this would be replaced with actual API calls
    
    // For demo purposes, we'll set some containers as running and others as stopped
    Object.entries(containerMap).forEach(([serviceType, indicator]) => {
        if (!indicator) return; // Skip if no indicator
        
        if (serviceType === 'podman') {
            // Podman is always running
            updateContainerStatusIndicator(indicator, 'running');
        } else if (serviceType === 'ollama') {
            // Ollama is running
            updateContainerStatusIndicator(indicator, 'running');
        } else if (Math.random() > 0.5) {
            // 50% chance of other services running
            updateContainerStatusIndicator(indicator, 'running');
        } else {
            // Other containers are stopped
            updateContainerStatusIndicator(indicator, 'exited');
        }
    });
}

// Function to simulate endpoint reachability
function simulateEndpointReachability(serviceEndpoints) {
    // In a real implementation, this would make actual HTTP requests to check if endpoints are reachable
    // For now, we'll simulate the reachability based on the URL
    
    Object.entries(serviceEndpoints).forEach(([serviceName, data]) => {
        const { indicator, urlInput } = data;
        const url = urlInput.value;
        
        // Check if the endpoint is reachable
        const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
        
        // Simulate reachability - local endpoints are more likely to be reachable
        let isReachable;
        if (isLocal) {
            // 80% chance of local endpoints being reachable
            isReachable = Math.random() < 0.8;
        } else {
            // 40% chance of external endpoints being reachable
            isReachable = Math.random() < 0.4;
        }
        
        // Update the status indicator based on reachability
        if (isReachable) {
            indicator.classList.remove('offline', 'testing');
            indicator.classList.add('online');
        } else {
            indicator.classList.remove('online', 'testing');
            indicator.classList.add('offline');
        }
    });
}

function updateContainerStatusIndicator(indicator, status) {
    if (!indicator) return;
    
    // Remove all status classes
    indicator.classList.remove('online', 'offline', 'disabled', 'warning');
    
    // Set appropriate class based on status
    switch (status) {
        case 'running':
            indicator.classList.add('online');
            break;
        case 'exited':
        case 'not_found':
            indicator.classList.add('offline');
            break;
        case 'restarting':
        case 'paused':
            indicator.classList.add('warning');
            break;
        default:
            indicator.classList.add('disabled');
            break;
    }
}

// Settings Management
function initializeThemePreview() {
    const themeSelect = document.getElementById('theme');
    
    // Add change event listener to theme dropdown
    if (themeSelect) {
        themeSelect.addEventListener('change', () => {
            const selectedTheme = themeSelect.value;
            applyTheme(selectedTheme);
            saveSettings();
            showNotification(`Theme changed to ${selectedTheme}`, 'success');
        });
    }
}

// This function is no longer needed since we removed the theme preview section
function updateThemePreviewActive(selectedTheme) {
    // Function kept for compatibility but no longer does anything
    return;
}

function loadSettings() {
    // Load settings from localStorage
    const settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || getDefaultSettings();
    
    // Apply settings to form elements
    Object.entries(settings).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
        }
    });
    
    // Apply theme immediately
    applyTheme(settings.theme);
    
    // Update connection status indicators
    updateConnectionStatus();
}

function getDefaultSettings() {
    return {
        theme: 'dark',
        save_sessions: true,
        gpu_vendor: 'auto',
        platform: 'auto',
        gpu_memory: '8G',
        power_mode: 'balanced',
        acceleration: true,
        container_engine: 'podman',
        auto_start: true,
        
        // LLM services
        ollama_api: 'http://localhost:11434/api',
        ollama_key: '',
        anthropic_api: 'https://api.anthropic.com/v1',
        anthropic_key: '',
        openai_api: 'https://api.openai.com/v1',
        openai_key: '',
        gemini_api: 'https://generativelanguage.googleapis.com/v1',
        gemini_key: '',
        grok_api: 'https://api.grok.x/v1',
        grok_key: '',
        default_llm: 'llama3',
        
        // Image generation services
        sd_api: 'http://localhost:7860',
        sd_key: '',
        dalle_api: 'https://api.openai.com/v1/images',
        dalle_key: '',
        midjourney_api: 'http://localhost:7861',
        midjourney_key: '',
        default_img: 'sdxl',
        
        // Speech services
        tts_api: 'http://localhost:5500/api/tts',
        tts_key: '',
        stt_api: 'http://localhost:5501/api/stt',
        stt_key: '',
        openai_audio_api: 'https://api.openai.com/v1/audio',
        openai_audio_key: '',
        default_tts: 'whisper-large',
        default_voice: 'onyx'
    };
}

function saveSettings() {
    const settings = {};
    
    // Collect all settings from form elements (both grid and table based)
    document.querySelectorAll('.fusion-setting-item select, .fusion-setting-item input, .fusion-table input, .fusion-table select').forEach(element => {
        settings[element.id] = element.type === 'checkbox' ? element.checked : element.value;
    });
    
    // Save to localStorage
    localStorage.setItem('fusionloom_settings', JSON.stringify(settings));
    
    // Apply theme immediately
    applyTheme(settings.theme);
    
    // Show success message
    showNotification('Settings saved successfully', 'success');
}

function resetSettings() {
    // Reset to default settings
    const defaultSettings = getDefaultSettings();
    
    // Apply default settings to form elements
    Object.entries(defaultSettings).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
        }
    });
    
    // Save default settings
    localStorage.setItem('fusionloom_settings', JSON.stringify(defaultSettings));
    
    // Apply theme immediately
    applyTheme(defaultSettings.theme);
    
    // Show success message
    showNotification('Settings reset to defaults', 'info');
}

function updateConnectionStatus() {
    // This function handles the initial setup of service endpoint status indicators
    // It separates the enabled/disabled state from the reachability (online/offline) state
    
    // Get all status indicators
    const statusIndicators = document.querySelectorAll('.status-indicator');
    
    // For demonstration, we'll set LLM services as disabled by default
    // Other services will be enabled but their reachability will be checked separately
    statusIndicators.forEach(indicator => {
        const row = indicator.closest('tr');
        if (!row) return;
        
        const endpointInput = row.querySelector('input.endpoint-input');
        if (!endpointInput) return;
        
        const nameInput = row.querySelector('.name-input');
        const serviceName = nameInput ? nameInput.value : '';
        
        // Check if this is an LLM service
        const isLLMService = serviceName.includes('LLM') || 
                            serviceName.includes('API') || 
                            serviceName.includes('Anthropic') || 
                            serviceName.includes('OpenAI') ||
                            serviceName.includes('Gemini') ||
                            serviceName.includes('Grok');
        
        // If it's an LLM service, keep it disabled by default
        if (isLLMService) {
            indicator.classList.remove('online', 'offline');
            indicator.classList.add('disabled');
        } else {
            // For other services, set them as enabled but check reachability
            indicator.classList.remove('disabled');
            
            // Default to offline until reachability is checked
            indicator.classList.remove('online');
            indicator.classList.add('offline');
        }
    });
    
    // Create a mapping of enabled service endpoints for reachability checking
    const enabledEndpoints = {};
    
    document.querySelectorAll('.status-indicator:not(.disabled)').forEach(indicator => {
        const row = indicator.closest('tr');
        if (!row) return;
        
        const endpointInput = row.querySelector('input.endpoint-input');
        if (!endpointInput) return;
        
        const nameInput = row.querySelector('.name-input');
        const serviceName = nameInput ? nameInput.value : '';
        
        // Store the service endpoint for reachability checking
        if (serviceName) {
            enabledEndpoints[serviceName] = {
                indicator: indicator,
                urlInput: endpointInput
            };
        }
    });
    
    // Check reachability of enabled endpoints
    simulateEndpointReachability(enabledEndpoints);
    
    // After setting service status, check container status in the footer
    checkContainerStatus();
}

function testConnections() {
    // Simulate testing connections with a loading state
    showNotification('Testing connections...', 'info');
    
    // Get all status indicators that are not disabled
    const statusIndicators = document.querySelectorAll('.status-indicator:not(.disabled)');
    
    // Set them to a "testing" state
    statusIndicators.forEach(indicator => {
        indicator.classList.remove('online', 'offline');
        indicator.classList.add('testing');
    });
    
    // Create a mapping of service endpoints for reachability checking
    const serviceEndpoints = {};
    
    statusIndicators.forEach(indicator => {
        const row = indicator.closest('tr');
        if (!row) return;
        
        const endpointInput = row.querySelector('input.endpoint-input');
        if (!endpointInput) return;
        
        const nameInput = row.querySelector('.name-input');
        const serviceName = nameInput ? nameInput.value : '';
        
        // Store the service endpoint for reachability checking
        if (serviceName) {
            serviceEndpoints[serviceName] = {
                indicator: indicator,
                urlInput: endpointInput
            };
        }
    });
    
    // Simulate a delay for testing
    setTimeout(() => {
        // Check reachability of enabled endpoints
        simulateEndpointReachability(serviceEndpoints);
        
        // Show completion notification
        showNotification('Connection test complete', 'success');
    }, 1500);
}

// Add Endpoint Modal
function showAddEndpointModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('add-endpoint-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'add-endpoint-modal';
        modal.className = 'fusion-modal';
        
        modal.innerHTML = `
            <div class="fusion-modal-content">
                <div class="fusion-modal-header">
                    <h2 class="fusion-modal-title">Add New Endpoint</h2>
                    <button class="fusion-modal-close" onclick="hideAddEndpointModal()">&times;</button>
                </div>
                <div class="fusion-modal-body">
                    <div class="fusion-setting-item">
                        <label for="endpoint-type">Endpoint Type</label>
                        <select id="endpoint-type" name="endpoint-type" onchange="updateEndpointForm()">
                            <option value="llm">LLM Service</option>
                            <option value="image">Image Generation</option>
                            <option value="speech">Speech Service</option>
                        </select>
                    </div>
                    <div class="fusion-setting-item">
                        <label for="endpoint-subtype" id="endpoint-subtype-label">LLM Type</label>
                        <select id="endpoint-subtype" name="endpoint-subtype">
                            <option value="custom">Custom LLM</option>
                            <option value="openai">OpenAI Compatible</option>
                            <option value="anthropic">Anthropic Compatible</option>
                            <option value="google">Google AI</option>
                            <option value="ollama">Ollama</option>
                        </select>
                    </div>
                    <div class="fusion-setting-item">
                        <label for="endpoint-name">Service Name</label>
                        <input type="text" id="endpoint-name" placeholder="Enter service name" value="Custom LLM">
                    </div>
                    <div class="fusion-setting-item">
                        <label for="endpoint-url">Endpoint URL</label>
                        <input type="text" id="endpoint-url" placeholder="Enter endpoint URL" value="http://localhost:8000/v1">
                    </div>
                    <div class="fusion-setting-item">
                        <label for="endpoint-key">API Key (Optional)</label>
                        <input type="password" id="endpoint-key" placeholder="Enter API key if required">
                    </div>
                </div>
                <div class="fusion-modal-footer">
                    <button class="fusion-button" onclick="addEndpoint()">Add Endpoint</button>
                    <button class="fusion-button secondary" onclick="hideAddEndpointModal()">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Initialize the form based on the default type
    updateEndpointForm();
}

function updateEndpointForm() {
    const type = document.getElementById('endpoint-type').value;
    const subtypeLabel = document.getElementById('endpoint-subtype-label');
    const subtypeSelect = document.getElementById('endpoint-subtype');
    const nameInput = document.getElementById('endpoint-name');
    
    // Clear existing options
    subtypeSelect.innerHTML = '';
    
    // Update subtype options based on type
    switch (type) {
        case 'llm':
            subtypeLabel.textContent = 'LLM Type';
            
            // Add LLM-specific options
            const llmOptions = [
                { value: 'custom', text: 'Custom LLM' },
                { value: 'openai', text: 'OpenAI Compatible' },
                { value: 'anthropic', text: 'Anthropic Compatible' },
                { value: 'google', text: 'Google AI' },
                { value: 'ollama', text: 'Ollama' }
            ];
            
            llmOptions.forEach(option => {
                const optElement = document.createElement('option');
                optElement.value = option.value;
                optElement.textContent = option.text;
                subtypeSelect.appendChild(optElement);
            });
            
            nameInput.value = 'Custom LLM';
            break;
            
        case 'image':
            subtypeLabel.textContent = 'Image Generation Type';
            
            // Add image generation options
            const imageOptions = [
                { value: 'custom', text: 'Custom Image Generator' },
                { value: 'sd', text: 'Stable Diffusion' },
                { value: 'dalle', text: 'DALL-E Compatible' },
                { value: 'midjourney', text: 'Midjourney' }
            ];
            
            imageOptions.forEach(option => {
                const optElement = document.createElement('option');
                optElement.value = option.value;
                optElement.textContent = option.text;
                subtypeSelect.appendChild(optElement);
            });
            
            nameInput.value = 'Custom Image Generator';
            break;
            
        case 'speech':
            subtypeLabel.textContent = 'Speech Service Type';
            
            // Add speech service options
            const speechOptions = [
                { value: 'custom', text: 'Custom Speech Service' },
                { value: 'tts', text: 'Text-to-Speech' },
                { value: 'stt', text: 'Speech-to-Text' },
                { value: 'openai', text: 'OpenAI Audio' }
            ];
            
            speechOptions.forEach(option => {
                const optElement = document.createElement('option');
                optElement.value = option.value;
                optElement.textContent = option.text;
                subtypeSelect.appendChild(optElement);
            });
            
            nameInput.value = 'Custom Speech Service';
            break;
    }
    
    // Add event listener to update name when subtype changes
    subtypeSelect.addEventListener('change', function() {
        const subtype = this.value;
        if (subtype === 'custom') {
            switch (type) {
                case 'llm':
                    nameInput.value = 'Custom LLM';
                    break;
                case 'image':
                    nameInput.value = 'Custom Image Generator';
                    break;
                case 'speech':
                    nameInput.value = 'Custom Speech Service';
                    break;
            }
        } else {
            // Find the selected option text
            const selectedOption = Array.from(this.options).find(opt => opt.value === subtype);
            if (selectedOption) {
                nameInput.value = selectedOption.textContent;
            }
        }
    });
}

function hideAddEndpointModal() {
    const modal = document.getElementById('add-endpoint-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function addEndpoint() {
    // Get values from the modal
    const type = document.getElementById('endpoint-type').value;
    const subtype = document.getElementById('endpoint-subtype').value;
    const name = document.getElementById('endpoint-name').value;
    const url = document.getElementById('endpoint-url').value;
    const key = document.getElementById('endpoint-key').value;
    
    // Validate inputs
    if (!name || !url) {
        showNotification('Service name and URL are required', 'error');
        return;
    }
    
    // Find the appropriate section based on type
    let sectionIcon, sectionName;
    
    switch (type) {
        case 'llm':
            sectionIcon = 'fa-robot';
            sectionName = 'LLM Services';
            break;
        case 'image':
            sectionIcon = 'fa-image';
            sectionName = 'Image Generation';
            break;
        case 'speech':
            sectionIcon = 'fa-headphones';
            sectionName = 'Speech Services';
            break;
        default:
            showNotification('Invalid endpoint type', 'error');
            return;
    }
    
    // Find the section header
    const sectionHeader = Array.from(document.querySelectorAll('.section-header')).find(
        header => header.textContent.includes(sectionName)
    );
    
    if (!sectionHeader) {
        showNotification(`Could not find ${sectionName} section`, 'error');
        return;
    }
    
    const sectionRow = sectionHeader.closest('tr');
    if (!sectionRow) {
        showNotification(`Could not find ${sectionName} section row`, 'error');
        return;
    }
    
    // Generate a unique ID for the endpoint
    const timestamp = Date.now();
    const endpointId = `${type}_${timestamp}`;
    
    // Create a new row
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" value="${name}" class="name-input" readonly></td>
        <td><input type="text" id="${endpointId}_api" value="${url}" class="endpoint-input" readonly></td>
        <td><input type="password" id="${endpointId}_key" value="${key}" placeholder="Optional" class="key-input" readonly></td>
        <td><span class="status-indicator offline" onclick="toggleEndpointStatus(this)"></span></td>
        <td class="endpoint-actions">
            <button class="endpoint-action-btn edit" title="Edit" onclick="toggleEditMode(this)">
                <i class="fas fa-edit"></i>
            </button>
            <button class="endpoint-action-btn save" title="Save" onclick="saveEndpointChanges(this)" style="display: none;">
                <i class="fas fa-save"></i>
            </button>
            <button class="endpoint-action-btn cancel" title="Cancel" onclick="cancelEndpointEdit(this)" style="display: none;">
                <i class="fas fa-times"></i>
            </button>
            <button class="endpoint-action-btn delete" title="Delete" onclick="confirmDeleteEndpoint(this, '${name}')">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;
    
    // Insert after the section header
    sectionRow.parentNode.insertBefore(newRow, sectionRow.nextSibling);
    
    // Update connection status
    updateConnectionStatus();
    
    // Hide the modal
    hideAddEndpointModal();
    
    // Show success message
    showNotification(`New ${sectionName.slice(0, -1)} endpoint added`, 'success');
}

function confirmDeleteEndpoint(button, serviceName) {
    // Create a modal for delete confirmation
    let modal = document.createElement('div');
    modal.className = 'fusion-modal';
    
    modal.innerHTML = `
        <div class="fusion-modal-content">
            <div class="fusion-modal-header">
                <h2 class="fusion-modal-title">Confirm Deletion</h2>
                <button class="fusion-modal-close" onclick="this.closest('.fusion-modal').remove()">&times;</button>
            </div>
            <div class="fusion-modal-body">
                <p>Are you sure you want to delete the entry '${serviceName}'?</p>
            </div>
            <div class="fusion-modal-footer">
                <button class="fusion-button" id="confirm-delete-btn">Delete</button>
                <button class="fusion-button secondary" onclick="this.closest('.fusion-modal').remove()">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Set up event listener for the confirm button
    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (confirmBtn) {
        confirmBtn.onclick = function() {
            // Get the row and remove it
            const row = button.closest('tr');
            if (row) {
                row.remove();
                showNotification(`Endpoint '${serviceName}' deleted`, 'success');
            }
            
            // Remove the modal
            modal.remove();
        };
    }
}

// Toggle endpoint status (enable/disable)
function toggleEndpointStatus(statusIndicator) {
    // Get the service name
    const row = statusIndicator.closest('tr');
    const nameInput = row.querySelector('.name-input');
    const serviceName = nameInput ? nameInput.value : 'this service';
    
    // Create status toggle modal if it doesn't exist
    let modal = document.getElementById('status-toggle-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'status-toggle-modal';
        modal.className = 'fusion-modal';
        
        modal.innerHTML = `
            <div class="fusion-modal-content">
                <div class="fusion-modal-header">
                    <h2 class="fusion-modal-title">Endpoint Status</h2>
                    <button class="fusion-modal-close" onclick="hideStatusToggleModal()">&times;</button>
                </div>
                <div class="fusion-modal-body">
                    <p id="status-toggle-message">Do you want to enable or disable this endpoint?</p>
                    <div class="fusion-button-group">
                        <button class="fusion-button" id="enable-endpoint-btn">Enable</button>
                        <button class="fusion-button secondary" id="disable-endpoint-btn">Disable</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Update the message
    const message = document.getElementById('status-toggle-message');
    if (message) {
        message.textContent = `Do you want to enable or disable '${serviceName}'?`;
    }
    
    // Set up event listeners for the buttons
    const enableBtn = document.getElementById('enable-endpoint-btn');
    const disableBtn = document.getElementById('disable-endpoint-btn');
    
    if (enableBtn) {
        enableBtn.onclick = function() {
            // Enable the endpoint
            statusIndicator.classList.remove('disabled');
            
            // Set to offline initially until reachability is checked
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
            
            // Check if the endpoint is reachable
            const endpointInput = row.querySelector('input.endpoint-input');
            if (endpointInput) {
                // Create a single endpoint object for reachability checking
                const endpoint = {};
                endpoint[serviceName] = {
                    indicator: statusIndicator,
                    urlInput: endpointInput
                };
                
                // Check reachability
                simulateEndpointReachability(endpoint);
            }
            
            // Hide the modal
            hideStatusToggleModal();
            
            // Show success message
            showNotification(`Endpoint '${serviceName}' enabled`, 'success');
        };
    }
    
    if (disableBtn) {
        disableBtn.onclick = function() {
            // Disable the endpoint
            statusIndicator.classList.remove('online', 'offline');
            statusIndicator.classList.add('disabled');
            
            // Hide the modal
            hideStatusToggleModal();
            
            // Show success message
            showNotification(`Endpoint '${serviceName}' disabled`, 'info');
        };
    }
    
    // Show the modal
    modal.style.display = 'flex';
}

function hideStatusToggleModal() {
    const modal = document.getElementById('status-toggle-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Edit mode for endpoints
function toggleEditMode(button) {
    const row = button.closest('tr');
    if (!row) return;
    
    // Get the inputs
    const nameInput = row.querySelector('.name-input');
    const endpointInput = row.querySelector('.endpoint-input');
    const keyInput = row.querySelector('.key-input');
    
    // Toggle readonly attribute
    nameInput.readOnly = !nameInput.readOnly;
    endpointInput.readOnly = !endpointInput.readOnly;
    keyInput.readOnly = !keyInput.readOnly;
    
    // Toggle edit/save/cancel buttons
    const editBtn = row.querySelector('.edit');
    const saveBtn = row.querySelector('.save');
    const cancelBtn = row.querySelector('.cancel');
    
    if (editBtn) editBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'inline-block';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    
    // Store original values for cancel
    if (!nameInput.dataset.original) {
        nameInput.dataset.original = nameInput.value;
        endpointInput.dataset.original = endpointInput.value;
        keyInput.dataset.original = keyInput.value;
    }
    
    // Focus on the name input
    nameInput.focus();
}

function saveEndpointChanges(button) {
    const row = button.closest('tr');
    if (!row) return;
    
    // Get the inputs
    const nameInput = row.querySelector('.name-input');
    const endpointInput = row.querySelector('.endpoint-input');
    const keyInput = row.querySelector('.key-input');
    
    // Make inputs readonly again
    nameInput.readOnly = true;
    endpointInput.readOnly = true;
    keyInput.readOnly = true;
    
    // Toggle edit/save/cancel buttons
    const editBtn = row.querySelector('.edit');
    const saveBtn = row.querySelector('.save');
    const cancelBtn = row.querySelector('.cancel');
    
    if (editBtn) editBtn.style.display = 'inline-block';
    if (saveBtn) saveBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    // Clear original values
    delete nameInput.dataset.original;
    delete endpointInput.dataset.original;
    delete keyInput.dataset.original;
    
    // Update delete button onclick to use the new name
    const deleteBtn = row.querySelector('.delete');
    if (deleteBtn) {
        deleteBtn.setAttribute('onclick', `confirmDeleteEndpoint(this, '${nameInput.value}')`);
    }
    
    // Show success message
    showNotification(`Endpoint '${nameInput.value}' updated`, 'success');
}

function cancelEndpointEdit(button) {
    const row = button.closest('tr');
    if (!row) return;
    
    // Get the inputs
    const nameInput = row.querySelector('.name-input');
    const endpointInput = row.querySelector('.endpoint-input');
    const keyInput = row.querySelector('.key-input');
    
    // Restore original values
    if (nameInput.dataset.original) {
        nameInput.value = nameInput.dataset.original;
        endpointInput.value = endpointInput.dataset.original;
        keyInput.value = keyInput.dataset.original;
        
        // Clear original values
        delete nameInput.dataset.original;
        delete endpointInput.dataset.original;
        delete keyInput.dataset.original;
    }
    
    // Make inputs readonly again
    nameInput.readOnly = true;
    endpointInput.readOnly = true;
    keyInput.readOnly = true;
    
    // Toggle edit/save/cancel buttons
    const editBtn = row.querySelector('.edit');
    const saveBtn = row.querySelector('.save');
    const cancelBtn = row.querySelector('.cancel');
    
    if (editBtn) editBtn.style.display = 'inline-block';
    if (saveBtn) saveBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
}

function applyTheme(theme) {
    console.log('Applying theme:', theme);
    
    // Get all possible theme classes
    const themeClasses = [
        'theme-dark',
        'theme-light',
        'theme-red',
        'theme-blue',
        'theme-green',
        'theme-purple'
    ];
    
    // Remove all theme classes from document and body
    themeClasses.forEach(cls => {
        document.documentElement.classList.remove(cls);
        document.body.classList.remove(cls);
    });
    
    // Apply theme based on selection
    if (theme === 'system') {
        // For system theme, check user's preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = prefersDark ? 'dark' : 'light';
        
        // Apply theme class
        const themeClass = `theme-${systemTheme}`;
        document.documentElement.classList.add(themeClass);
        document.body.classList.add(themeClass);
        
        console.log('Applied system theme:', themeClass);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            const newThemeClass = `theme-${newSystemTheme}`;
            
            // Remove all theme classes
            themeClasses.forEach(cls => {
                document.documentElement.classList.remove(cls);
                document.body.classList.remove(cls);
            });
            
            // Apply new theme class
            document.documentElement.classList.add(newThemeClass);
            document.body.classList.add(newThemeClass);
            
            console.log('System theme changed to:', newThemeClass);
        });
    } else {
        // Apply the selected theme
        const themeClass = `theme-${theme}`;
        document.documentElement.classList.add(themeClass);
        document.body.classList.add(themeClass);
        
        // Force a repaint to ensure styles are applied
        setTimeout(() => {
            // This will force a complete repaint of the page
            const currentBodyBg = getComputedStyle(document.body).backgroundColor;
            document.body.style.backgroundColor = 'transparent';
            document.body.offsetHeight; // Trigger a reflow
            document.body.style.backgroundColor = '';
            
            console.log('Forced repaint for theme change');
        }, 10);
        
        console.log('Applied theme class:', themeClass);
    }
    
    // Update the theme selector dropdown
    const themeSelector = document.getElementById('theme');
    if (themeSelector) {
        themeSelector.value = theme;
    }
    
    // Ensure the modal also inherits the theme
    const modal = document.querySelector('.fusion-modal-content');
    if (modal) {
        // The modal will inherit the theme from CSS variables
        console.log('Applied theme to modal');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fusion-notification ${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
