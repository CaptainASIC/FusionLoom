// FusionLoom v0.2 - Endpoints Module

import { showNotification } from './notifications.js';
import { getDefaultSettings } from './settings.js';
import { checkContainerStatus } from './containers.js';

/**
 * Update connection status for all endpoints
 */
export function updateConnectionStatus() {
    // This function handles the initial setup of service endpoint status indicators
    // It separates the enabled/disabled state from the reachability (online/offline) state
    
    // Get all status indicators in the settings table (service endpoints)
    const serviceStatusIndicators = document.querySelectorAll('.fusion-table .status-indicator');
    
    // Load saved settings to determine which services should be enabled
    const settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || getDefaultSettings();
    
    // Process each service endpoint indicator
    serviceStatusIndicators.forEach(indicator => {
        const row = indicator.closest('tr');
        if (!row) return;
        
        const endpointInput = row.querySelector('input.endpoint-input');
        if (!endpointInput) return;
        
        const nameInput = row.querySelector('.name-input');
        const serviceName = nameInput ? nameInput.value : '';
        
        // Get the endpoint ID from the input ID (e.g., "ollama_api" -> "ollama")
        const endpointId = endpointInput.id.replace('_api', '');
        
        // Check if this endpoint is enabled in settings
        // By default, most external APIs are disabled, local services are enabled
        const isLocalService = endpointInput.value.includes('localhost') || 
                              endpointInput.value.includes('127.0.0.1');
        
        // Determine if the service should be enabled
        // For this implementation, we'll enable local services by default
        // and disable external services unless they have an API key set
        let shouldBeEnabled = isLocalService;
        
        // If it's an external service with an API key in settings, enable it
        if (!isLocalService) {
            const apiKeyId = `${endpointId}_key`;
            const hasApiKey = settings[apiKeyId] && settings[apiKeyId].length > 0;
            shouldBeEnabled = hasApiKey;
        }
        
        // Set the initial state based on whether it should be enabled
        if (shouldBeEnabled) {
            // Service is enabled, but we need to check reachability
            indicator.classList.remove('disabled');
            
            // Default to offline until reachability is checked
            indicator.classList.remove('online');
            indicator.classList.add('offline');
        } else {
            // Service is disabled
            indicator.classList.remove('online', 'offline');
            indicator.classList.add('disabled');
        }
    });
    
    // Create a mapping of enabled service endpoints for reachability checking
    const enabledEndpoints = {};
    
    document.querySelectorAll('.fusion-table .status-indicator:not(.disabled)').forEach(indicator => {
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
    checkEndpointReachability(enabledEndpoints);
    
    // After setting service status, check container status in the footer
    // This is separate from service endpoints - containers are shown in the footer
    checkContainerStatus();
}

/**
 * Test connections to all endpoints
 */
export function testConnections() {
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
    
    // Check reachability of enabled endpoints
    checkEndpointReachability(serviceEndpoints).then(() => {
        // Show completion notification
        showNotification('Connection test complete', 'success');
    });
}

/**
 * Check if endpoints are reachable
 * @param {Object} serviceEndpoints - Object containing service endpoints to check
 * @returns {Promise} Promise that resolves when all endpoints have been checked
 */
export async function checkEndpointReachability(serviceEndpoints) {
    // This function makes actual HTTP requests to check if endpoints are reachable
    
    // Process each endpoint in parallel
    const checkPromises = Object.entries(serviceEndpoints).map(async ([serviceName, data]) => {
        const { indicator, urlInput } = data;
        const url = urlInput.value;
        
        // Set to testing state while checking
        indicator.classList.remove('online', 'offline');
        indicator.classList.add('testing');
        
        // Check if the endpoint is disabled
        if (indicator.classList.contains('disabled')) {
            return;
        }
        
        try {
            // For API endpoints, we'll use a HEAD request when possible to minimize data transfer
            // Some APIs don't support HEAD, so we'll fall back to GET with a timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            // Determine the appropriate URL to check
            let checkUrl = url;
            
            // For some APIs, we need to check a specific endpoint that doesn't require authentication
            if (url.includes('api.openai.com')) {
                checkUrl = 'https://api.openai.com/v1';
            } else if (url.includes('api.anthropic.com')) {
                checkUrl = 'https://api.anthropic.com/v1/models';
            } else if (url.includes('generativelanguage.googleapis.com')) {
                checkUrl = 'https://generativelanguage.googleapis.com/v1/models';
            }
            
            // Try HEAD request first
            let response;
            try {
                response = await fetch(checkUrl, {
                    method: 'HEAD',
                    mode: 'no-cors', // This allows checking cross-origin endpoints
                    signal: controller.signal
                });
            } catch (headError) {
                // If HEAD fails, try GET
                response = await fetch(checkUrl, {
                    method: 'GET',
                    mode: 'no-cors', // This allows checking cross-origin endpoints
                    signal: controller.signal
                });
            }
            
            // Clear the timeout
            clearTimeout(timeoutId);
            
            // Update the status indicator based on response
            if (response.ok || response.status === 0) { // status 0 is for no-cors mode
                indicator.classList.remove('offline', 'testing');
                indicator.classList.add('online');
            } else {
                indicator.classList.remove('online', 'testing');
                indicator.classList.add('offline');
            }
        } catch (error) {
            console.error(`Error checking endpoint ${url}:`, error);
            // Update the status indicator to offline
            indicator.classList.remove('online', 'testing');
            indicator.classList.add('offline');
        }
    });
    
    // Wait for all checks to complete
    await Promise.all(checkPromises);
}
