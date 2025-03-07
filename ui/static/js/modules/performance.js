// FusionLoom v0.2 - Performance Module

/**
 * Update all performance gauges with random values (for demo purposes)
 * In a real implementation, this would fetch actual system metrics
 */
export function updatePerformanceGauges() {
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

/**
 * Update a specific gauge with a value
 * @param {string} id - The ID of the gauge to update
 * @param {number} value - The value to set (0-100)
 */
export function updateGauge(id, value) {
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

/**
 * Update system information in the UI
 * In a real implementation, this would fetch actual system information
 */
export function updateSystemInfo() {
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
            <div>FusionLoom v0.2</div>
        `;
    }
}
