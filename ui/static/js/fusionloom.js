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
        llm_api: 'http://localhost:8000/v1',
        stable_diffusion: 'http://localhost:7860',
        tts_service: 'http://localhost:5500/api/tts',
        sts_service: 'http://localhost:5501/api/sts'
    };
}

function saveSettings() {
    const settings = {};
    
    // Collect all settings from form elements
    document.querySelectorAll('.fusion-setting-item select, .fusion-setting-item input').forEach(element => {
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
