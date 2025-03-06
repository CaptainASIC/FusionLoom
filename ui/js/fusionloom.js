// FusionLoom Custom UI JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the UI
    initializeFusionLoom();
    
    // Update performance gauges periodically
    setInterval(updatePerformanceGauges, 2000);
});

function initializeFusionLoom() {
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
