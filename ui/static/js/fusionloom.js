// FusionLoom Custom UI JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the UI
    initializeFusionLoom();
    
    // Load saved settings
    loadSettings();
    
    // Update performance gauges periodically
    setInterval(updatePerformanceGauges, 2000);
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
    // This function simulates checking the connection status of each endpoint
    // In a real implementation, this would make actual API calls to check if services are available
    
    // Get all status indicators
    const statusIndicators = document.querySelectorAll('.status-indicator');
    
    // For demonstration, we'll set local endpoints as online and external ones as offline
    // But for LLM services, we'll keep them disabled by default as requested
    statusIndicators.forEach(indicator => {
        const row = indicator.closest('tr');
        if (!row) return;
        
        const endpointInput = row.querySelector('input.endpoint-input');
        if (!endpointInput) return;
        
        const endpoint = endpointInput.value;
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
            // For other services, use the local/external logic
            const isLocal = endpoint.includes('localhost') || endpoint.includes('127.0.0.1');
            
            // Set status based on whether endpoint is local or external
            if (isLocal) {
                indicator.classList.remove('offline', 'disabled');
                indicator.classList.add('online');
            } else {
                indicator.classList.remove('online', 'disabled');
                indicator.classList.add('offline');
            }
        }
    });
}

function testConnections() {
    // Simulate testing connections with a loading state
    showNotification('Testing connections...', 'info');
    
    // Get all status indicators and set them to a "testing" state
    const statusIndicators = document.querySelectorAll('.status-indicator');
    statusIndicators.forEach(indicator => {
        indicator.classList.remove('online', 'offline', 'disabled');
        indicator.classList.add('testing');
    });
    
    // Simulate a delay for testing
    setTimeout(() => {
        // Update connection status
        updateConnectionStatus();
        
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
                        <select id="endpoint-type" name="endpoint-type">
                            <option value="llm">LLM Service</option>
                            <option value="image">Image Generation</option>
                            <option value="speech">Speech Service</option>
                        </select>
                    </div>
                    <div class="fusion-setting-item">
                        <label for="endpoint-name">Service Name</label>
                        <input type="text" id="endpoint-name" placeholder="Enter service name" value="Custom Service">
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
            <button class="endpoint-action-btn save" title="Save" onclick="saveEndpointChanges(this)">
                <i class="fas fa-save"></i>
            </button>
            <button class="endpoint-action-btn cancel" title="Cancel" onclick="cancelEndpointEdit(this)">
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
    // Ask for confirmation before deleting
    if (confirm(`Are you sure you want to delete the entry '${serviceName}'?`)) {
        // Get the row and remove it
        const row = button.closest('tr');
        if (row) {
            row.remove();
            showNotification(`Endpoint '${serviceName}' deleted`, 'success');
        }
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
            statusIndicator.classList.remove('offline', 'disabled');
            statusIndicator.classList.add('online');
            hideStatusToggleModal();
            showNotification(`'${serviceName}' has been enabled`, 'success');
        };
    }
    
    if (disableBtn) {
        disableBtn.onclick = function() {
            // Disable the endpoint
            statusIndicator.classList.remove('online', 'offline');
            statusIndicator.classList.add('disabled');
            hideStatusToggleModal();
            showNotification(`'${serviceName}' has been disabled`, 'info');
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

// Edit mode for endpoint fields
function toggleEditMode(button) {
    const row = button.closest('tr');
    if (!row) return;
    
    const nameInput = row.querySelector('.name-input');
    const endpointInput = row.querySelector('.endpoint-input');
    const keyInput = row.querySelector('.key-input');
    const editButton = row.querySelector('.endpoint-action-btn.edit');
    const saveButton = row.querySelector('.endpoint-action-btn.save');
    const cancelButton = row.querySelector('.endpoint-action-btn.cancel');
    const deleteButton = row.querySelector('.endpoint-action-btn.delete');
    
    // Check if we're entering or exiting edit mode
    const isEnteringEditMode = !nameInput.classList.contains('editing');
    
    if (isEnteringEditMode) {
        // Enter edit mode
        
        // Store original values for potential cancellation
        nameInput.dataset.originalValue = nameInput.value;
        endpointInput.dataset.originalValue = endpointInput.value;
        keyInput.dataset.originalValue = keyInput.value;
        
        // Make fields editable
        nameInput.classList.add('editing');
        nameInput.removeAttribute('readonly');
        
        endpointInput.classList.add('editing');
        endpointInput.removeAttribute('readonly');
        
        keyInput.classList.add('editing');
        keyInput.removeAttribute('readonly');
        
        // Show save/cancel buttons, hide edit/delete buttons
        editButton.style.display = 'none';
        deleteButton.style.display = 'none';
        saveButton.style.display = 'inline-block';
        cancelButton.style.display = 'inline-block';
        
        // Focus on the name input
        nameInput.focus();
    }
}

function saveEndpointChanges(button) {
    const row = button.closest('tr');
    if (!row) return;
    
    const nameInput = row.querySelector('.name-input');
    const endpointInput = row.querySelector('.endpoint-input');
    const keyInput = row.querySelector('.key-input');
    const editButton = row.querySelector('.endpoint-action-btn.edit');
    const saveButton = row.querySelector('.endpoint-action-btn.save');
    const cancelButton = row.querySelector('.endpoint-action-btn.cancel');
    const deleteButton = row.querySelector('.endpoint-action-btn.delete');
    
    // Exit edit mode
    nameInput.classList.remove('editing');
    nameInput.setAttribute('readonly', true);
    
    endpointInput.classList.remove('editing');
    endpointInput.setAttribute('readonly', true);
    
    keyInput.classList.remove('editing');
    keyInput.setAttribute('readonly', true);
    
    // Show edit/delete buttons, hide save/cancel buttons
    editButton.style.display = 'inline-block';
    deleteButton.style.display = 'inline-block';
    saveButton.style.display = 'none';
    cancelButton.style.display = 'none';
    
    // Update delete button onclick to use the new name
    deleteButton.setAttribute('onclick', `confirmDeleteEndpoint(this, '${nameInput.value}')`);
    
    // Show success message
    showNotification(`Endpoint '${nameInput.value}' updated`, 'success');
}

function cancelEndpointEdit(button) {
    const row = button.closest('tr');
    if (!row) return;
    
    const nameInput = row.querySelector('.name-input');
    const endpointInput = row.querySelector('.endpoint-input');
    const keyInput = row.querySelector('.key-input');
    const editButton = row.querySelector('.endpoint-action-btn.edit');
    const saveButton = row.querySelector('.endpoint-action-btn.save');
    const cancelButton = row.querySelector('.endpoint-action-btn.cancel');
    const deleteButton = row.querySelector('.endpoint-action-btn.delete');
    
    // Restore original values
    nameInput.value = nameInput.dataset.originalValue || nameInput.value;
    endpointInput.value = endpointInput.dataset.originalValue || endpointInput.value;
    keyInput.value = keyInput.dataset.originalValue || keyInput.value;
    
    // Exit edit mode
    nameInput.classList.remove('editing');
    nameInput.setAttribute('readonly', true);
    
    endpointInput.classList.remove('editing');
    endpointInput.setAttribute('readonly', true);
    
    keyInput.classList.remove('editing');
    keyInput.setAttribute('readonly', true);
    
    // Show edit/delete buttons, hide save/cancel buttons
    editButton.style.display = 'inline-block';
    deleteButton.style.display = 'inline-block';
    saveButton.style.display = 'none';
    cancelButton.style.display = 'none';
    
    // Show info message
    showNotification('Edit cancelled', 'info');
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
