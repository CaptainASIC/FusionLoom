// FusionLoom v0.4.3 - SillyTavern Integration Module
// Handles integration with SillyTavern

import { showNotification } from '../notifications.js';

// Default endpoint
let sillyTavernEndpoint = 'http://localhost:8000';

/**
 * Initialize the SillyTavern UI
 */
export function initializeSillyTavernUI() {
    console.log('Initializing SillyTavern UI');
    
    // Get settings from localStorage
    const settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
    
    // Update endpoint if set in settings
    if (settings.sillytavern_api) {
        sillyTavernEndpoint = settings.sillytavern_api;
    }
    
    // Get the iframe element
    const iframe = document.getElementById('sillytavern-iframe');
    const loadingIndicator = document.querySelector('#sillytavern-container .llm-iframe-loading');
    const errorIndicator = document.querySelector('#sillytavern-container .llm-iframe-error');
    
    if (iframe && loadingIndicator && errorIndicator) {
        // Show loading indicator
        loadingIndicator.style.display = 'flex';
        errorIndicator.style.display = 'none';
        
        // Set iframe src
        iframe.src = sillyTavernEndpoint;
        
        // Handle iframe load event
        iframe.onload = () => {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            
            // Check if the iframe loaded successfully
            try {
                // Try to access the iframe content to check if it loaded
                const iframeContent = iframe.contentWindow.document;
                if (iframeContent) {
                    console.log('SillyTavern iframe loaded successfully');
                    showNotification('SillyTavern loaded successfully', 'success');
                    
                    // Update status indicator
                    updateStatusIndicator(true);
                }
            } catch (error) {
                console.error('Error accessing SillyTavern iframe content:', error);
                showErrorState();
            }
        };
        
        // Handle iframe error event
        iframe.onerror = () => {
            console.error('Error loading SillyTavern iframe');
            showErrorState();
        };
    }
}

/**
 * Show error state
 */
function showErrorState() {
    const loadingIndicator = document.querySelector('#sillytavern-container .llm-iframe-loading');
    const errorIndicator = document.querySelector('#sillytavern-container .llm-iframe-error');
    const iframe = document.getElementById('sillytavern-iframe');
    
    if (loadingIndicator && errorIndicator && iframe) {
        loadingIndicator.style.display = 'none';
        errorIndicator.style.display = 'flex';
        iframe.src = 'about:blank';
        
        showNotification('Failed to connect to SillyTavern', 'error');
        
        // Update status indicator
        updateStatusIndicator(false);
    }
}

/**
 * Update status indicator
 * @param {boolean} online - Whether the service is online
 */
function updateStatusIndicator(online) {
    const statusIndicator = document.querySelector('.llm-service-tab[data-provider="sillytavern"] .llm-service-tab-status');
    if (statusIndicator) {
        statusIndicator.className = online ? 'llm-service-tab-status online' : 'llm-service-tab-status offline';
    }
}

/**
 * Set SillyTavern endpoint
 * @param {string} endpoint - The endpoint URL
 */
export function setSillyTavernEndpoint(endpoint) {
    sillyTavernEndpoint = endpoint;
}

/**
 * Check SillyTavern status
 * @returns {Promise<boolean>} Whether SillyTavern is online
 */
export async function checkSillyTavernStatus() {
    try {
        const response = await fetch(sillyTavernEndpoint, {
            method: 'HEAD',
            mode: 'no-cors'
        });
        
        // Update status indicator
        updateStatusIndicator(true);
        
        return true;
    } catch (error) {
        console.error('Error checking SillyTavern status:', error);
        
        // Update status indicator
        updateStatusIndicator(false);
        
        return false;
    }
}
