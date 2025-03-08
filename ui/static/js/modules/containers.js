// FusionLoom v0.3 - Containers Module

import { showNotification } from './notifications.js';

/**
 * Check the status of containers and update the UI
 */
export function checkContainerStatus() {
    // This function checks the status of containers and updates the UI
    // Since the webUI is inside a container, we need to use a special endpoint
    // that can access the host's container engine
    
    // Get the container indicators section
    const containerIndicators = document.getElementById('container-indicators');
    if (!containerIndicators) return;
    
    // Try to detect the container engine from the environment
    const containerEngine = window.CONTAINER_ENGINE || 'podman';
    
    // Make API call to check container status from the host
    // This endpoint is provided by the container and has access to the host's container engine
    fetch('/api/host/containers')
        .then(response => {
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            return response.json().catch(err => {
                // Handle JSON parsing errors (e.g., HTML returned instead of JSON)
                throw new Error(`Invalid response format. The API might be returning an error page instead of JSON.`);
            });
        })
        .then(data => {
            // Get all containers
            const allContainers = data.containers || [];
            
            console.log('Detected containers:', allContainers);
            
            // Clear existing container indicators
            containerIndicators.innerHTML = '';
            
            // Add indicators for all containers
            allContainers.forEach(container => {
                if (!container.name) return;
                
                // Create a safe ID from the container name
                const containerId = container.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                const displayName = container.name;
                
                // Create a new indicator element
                const indicatorElement = document.createElement('div');
                indicatorElement.className = 'fusion-status-indicator';
                indicatorElement.innerHTML = `
                    <span class="status-indicator" id="${containerId}-status" onclick="toggleContainerStatus(this)"></span>
                    <span class="status-label">${displayName}</span>
                `;
                
                // Add to the container indicators section
                containerIndicators.appendChild(indicatorElement);
                
                // Update the status
                const statusIndicator = document.getElementById(`${containerId}-status`);
                if (statusIndicator) {
                    // Store the actual container name in a data attribute
                    statusIndicator.setAttribute('data-container-name', container.name);
                    updateContainerStatusIndicator(statusIndicator, container.status);
                }
            });
            
            // If no containers were found, show a message
            if (allContainers.length === 0) {
                containerIndicators.innerHTML = `
                    <div class="fusion-status-message">
                        No containers detected. 
                        <button class="fusion-button small" onclick="manuallyAddContainer()">Add Container Manually</button>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error checking container status:', error);
            
            // Show simplified error message
            containerIndicators.innerHTML = `
                <div class="fusion-status-message">
                    <p>Connection error</p>
                    <button class="fusion-button small" onclick="manuallyAddContainer()">Add Container</button>
                </div>
            `;
        });
}

/**
 * Toggle container status (show actions modal)
 * @param {HTMLElement} indicator - The status indicator element
 */
export function toggleContainerStatus(indicator) {
    // Get the container name from the indicator's ID
    const containerId = indicator.id;
    const serviceType = containerId.replace('-status', '');
    
    // Special case for container engine - can't control the container engine itself
    if (serviceType === 'container-engine') {
        showNotification('Cannot control the container engine directly', 'warning');
        return;
    }
    
    // Get the actual container name from the data attribute if it exists
    // This is set by the checkContainerStatus function when it finds a container
    let containerName = indicator.getAttribute('data-container-name');
    
    // If no container name is set, try to find it from the list of containers
    if (!containerName) {
        // Make API call to get container list
        fetch('/api/host/containers')
            .then(response => response.json())
            .then(data => {
                const allContainers = data.containers || [];
                
                // Try different naming patterns to find the container
                let containerInfo = null;
                
                // Pattern 1: fusionloom-<service>
                containerInfo = allContainers.find(c => 
                    c.name && c.name.toLowerCase().includes(`fusionloom-${serviceType.toLowerCase()}`)
                );
                
                // Pattern 2: <service> (exact match)
                if (!containerInfo) {
                    containerInfo = allContainers.find(c => 
                        c.name && c.name.toLowerCase() === serviceType.toLowerCase()
                    );
                }
                
                // Pattern 3: contains <service>
                if (!containerInfo) {
                    containerInfo = allContainers.find(c => 
                        c.name && c.name.toLowerCase().includes(serviceType.toLowerCase())
                    );
                }
                
                if (containerInfo && containerInfo.name) {
                    // Store the container name for future use
                    indicator.setAttribute('data-container-name', containerInfo.name);
                    
                    // Show the container actions modal with the found container name
                    showContainerActionsModal(indicator, containerInfo.name);
                } else {
                    // No container found
                    showNotification(`No container found for '${serviceType}'`, 'error');
                }
            })
            .catch(error => {
                console.error('Error getting container list:', error);
                showNotification('Error getting container list', 'error');
            });
        
        return;
    }
    
    // If we have a container name, show the actions modal
    showContainerActionsModal(indicator, containerName);
}

/**
 * Show container actions modal
 * @param {HTMLElement} indicator - The status indicator element
 * @param {string} containerName - The name of the container
 */
function showContainerActionsModal(indicator, containerName) {
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
                // Set to warning state while stopping
                indicator.className = 'status-indicator warning';
                showNotification(`Stopping container '${containerName}'...`, 'info');
                
                // Make API call to stop the container
                fetch(`/api/host/containers/${containerName}/stop`, {
                    method: 'POST'
                })
                .then(response => {
                    if (response.ok) {
                        // Update UI to show container is stopped
                        indicator.className = 'status-indicator offline';
                        showNotification(`Container '${containerName}' stopped successfully`, 'success');
                    } else {
                        // Handle error
                        indicator.className = 'status-indicator online'; // Revert to online state
                        showNotification(`Failed to stop container '${containerName}'`, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error stopping container:', error);
                    indicator.className = 'status-indicator online'; // Revert to online state
                    showNotification(`Error stopping container: ${error.message}`, 'error');
                });
                
                modal.remove();
            };
        }
        
        if (restartBtn) {
            restartBtn.onclick = function() {
                // Set to warning state while restarting
                indicator.className = 'status-indicator warning';
                showNotification(`Restarting container '${containerName}'...`, 'info');
                
                // Make API call to restart the container
                fetch(`/api/host/containers/${containerName}/restart`, {
                    method: 'POST'
                })
                .then(response => {
                    if (response.ok) {
                        // Update UI to show container is restarting
                        setTimeout(() => {
                            // Check container status after a delay
                            checkContainerStatus();
                            showNotification(`Container '${containerName}' restarted successfully`, 'success');
                        }, 2000);
                    } else {
                        // Handle error
                        indicator.className = 'status-indicator online'; // Revert to online state
                        showNotification(`Failed to restart container '${containerName}'`, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error restarting container:', error);
                    indicator.className = 'status-indicator online'; // Revert to online state
                    showNotification(`Error restarting container: ${error.message}`, 'error');
                });
                
                modal.remove();
            };
        }
    } else {
        const startBtn = document.getElementById('start-container-btn');
        
        if (startBtn) {
            startBtn.onclick = function() {
                // Set to warning state while starting
                indicator.className = 'status-indicator warning';
                showNotification(`Starting container '${containerName}'...`, 'info');
                
                // Make API call to start the container
                fetch(`/api/host/containers/${containerName}/start`, {
                    method: 'POST'
                })
                .then(response => {
                    if (response.ok) {
                        // Update UI to show container is starting
                        setTimeout(() => {
                            // Check container status after a delay
                            checkContainerStatus();
                            showNotification(`Container '${containerName}' started successfully`, 'success');
                        }, 2000);
                    } else {
                        // Handle error
                        indicator.className = 'status-indicator offline'; // Revert to offline state
                        showNotification(`Failed to start container '${containerName}'`, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error starting container:', error);
                    indicator.className = 'status-indicator offline'; // Revert to offline state
                    showNotification(`Error starting container: ${error.message}`, 'error');
                });
                
                modal.remove();
            };
        }
    }
}

/**
 * Update container status indicator
 * @param {HTMLElement} indicator - The status indicator element
 * @param {string} status - The container status
 */
export function updateContainerStatusIndicator(indicator, status) {
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

/**
 * Show modal for manually adding a container
 */
export function manuallyAddContainer() {
    // Create modal for adding a container manually
    let modal = document.createElement('div');
    modal.className = 'fusion-modal';
    
    modal.innerHTML = `
        <div class="fusion-modal-content">
            <div class="fusion-modal-header">
                <h2 class="fusion-modal-title">Add Container Manually</h2>
                <button class="fusion-modal-close" onclick="this.closest('.fusion-modal').remove()">&times;</button>
            </div>
            <div class="fusion-modal-body">
                <p>Enter the container details below:</p>
                <div class="fusion-setting-item">
                    <label for="container-name">Container Name</label>
                    <input type="text" id="container-name" placeholder="e.g., fusionloom-ollama">
                </div>
                <div class="fusion-setting-item">
                    <label for="container-status">Container Status</label>
                    <select id="container-status">
                        <option value="running">Running</option>
                        <option value="exited">Stopped</option>
                        <option value="paused">Paused</option>
                    </select>
                </div>
            </div>
            <div class="fusion-modal-footer">
                <button class="fusion-button" onclick="addManualContainer()">Add Container</button>
                <button class="fusion-button secondary" onclick="this.closest('.fusion-modal').remove()">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show the modal
    modal.style.display = 'flex';
}

/**
 * Add a manually configured container
 */
export function addManualContainer() {
    const containerName = document.getElementById('container-name').value;
    const containerStatus = document.getElementById('container-status').value;
    
    if (!containerName) {
        showNotification('Container name is required', 'error');
        return;
    }
    
    // Get the container indicators section
    const containerIndicators = document.getElementById('container-indicators');
    if (!containerIndicators) return;
    
    // Create a safe ID from the container name
    const containerId = containerName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    // Create a new indicator element
    const indicatorElement = document.createElement('div');
    indicatorElement.className = 'fusion-status-indicator';
    indicatorElement.innerHTML = `
        <span class="status-indicator" id="${containerId}-status" onclick="toggleContainerStatus(this)"></span>
        <span class="status-label">${containerName}</span>
    `;
    
    // Add to the container indicators section
    containerIndicators.appendChild(indicatorElement);
    
    // Update the status
    const statusIndicator = document.getElementById(`${containerId}-status`);
    if (statusIndicator) {
        // Store the actual container name in a data attribute
        statusIndicator.setAttribute('data-container-name', containerName);
        updateContainerStatusIndicator(statusIndicator, containerStatus);
    }
    
    // Close the modal
    const modal = document.querySelector('.fusion-modal');
    if (modal) {
        modal.remove();
    }
    
    // Show success message
    showNotification(`Container '${containerName}' added successfully`, 'success');
}
