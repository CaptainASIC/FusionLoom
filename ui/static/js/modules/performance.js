// FusionLoom v0.3 - Performance Module

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
 * This function fetches system information from the server
 */
export function updateSystemInfo() {
    const systemInfo = document.querySelector('.fusion-system-info');
    
    if (systemInfo) {
        // Show loading state
        systemInfo.innerHTML = `
            <div>Loading system information...</div>
        `;
        
        // Fetch system information from the server API
        // Use the full URL to avoid CORS issues with containers
        fetch('http://localhost:5050/api/system-info')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`);
                }
                console.log('System info API response:', response);
                return response.json();
            })
            .then(data => {
                // Update the UI with the system information from the server
                systemInfo.innerHTML = `
                    <div>System: ${data.architecture || 'Unknown'}</div>
                    <div>CPU: ${data.cpu || 'Unknown'}</div>
                    <div>GPU: ${data.gpu || 'Unknown'}</div>
                    <div>RAM: ${data.ram || 'Unknown'}</div>
                    <div>OS: ${data.os || 'Unknown'}</div>
                    <div>FusionLoom v0.3</div>
                `;
            })
            .catch(error => {
                console.error('Error fetching system information:', error);
                // Try with HTTP if HTTPS fails (for local development)
                if (window.location.protocol === 'https:') {
                    console.log('Retrying with HTTP...');
                    fetch('http://localhost:5050/api/system-info')
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`API returned ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            // Update the UI with the system information from the server
                            systemInfo.innerHTML = `
                                <div>System: ${data.architecture || 'Unknown'}</div>
                                <div>CPU: ${data.cpu || 'Unknown'}</div>
                                <div>GPU: ${data.gpu || 'Unknown'}</div>
                                <div>RAM: ${data.ram || 'Unknown'}</div>
                                <div>OS: ${data.os || 'Unknown'}</div>
                                <div>FusionLoom v0.3</div>
                            `;
                            return;
                        })
                        .catch(secondError => {
                            console.error('Error on second attempt:', secondError);
                            showFallbackInfo();
                        });
                } else {
                    showFallbackInfo();
                }
                
                // Function to show fallback information
                function showFallbackInfo() {
                    // Fallback to basic detection if the API fails
                    const userAgent = navigator.userAgent;
                    let osInfo = "Unknown";
                    
                    // Basic OS detection
                    if (userAgent.indexOf("Win") !== -1) osInfo = "Windows";
                    else if (userAgent.indexOf("Mac") !== -1) osInfo = "macOS";
                    else if (userAgent.indexOf("Linux") !== -1) osInfo = "Linux";
                    else if (userAgent.indexOf("Android") !== -1) osInfo = "Android";
                    else if (userAgent.indexOf("iOS") !== -1) osInfo = "iOS";
                    
                    // Show fallback information
                    systemInfo.innerHTML = `
                        <div>System: ${navigator.platform}</div>
                        <div>CPU: ${navigator.hardwareConcurrency || 'Unknown'} cores</div>
                        <div>GPU: WebGL Renderer</div>
                        <div>RAM: Not available</div>
                        <div>OS: ${osInfo}</div>
                        <div>FusionLoom v0.3</div>
                        <div class="system-info-note">API connection failed</div>
                    `;
                }
            });
    }
}
