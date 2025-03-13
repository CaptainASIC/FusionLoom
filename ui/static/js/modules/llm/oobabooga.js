// FusionLoom v0.4.3 - Oobabooga Integration Module
// Handles integration with Oobabooga (text-generation-webui)

import { showNotification } from '../notifications.js';

// Default endpoint
let oobaboogaEndpoint = 'http://localhost:5000';

/**
 * Initialize the Oobabooga UI
 */
export function initializeOobaboogaUI() {
    console.log('Initializing Oobabooga UI');
    
    // Get settings from localStorage
    const settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
    
    // Update endpoint if set in settings
    if (settings.oobabooga_api) {
        oobaboogaEndpoint = settings.oobabooga_api;
    }
    
    // Get the iframe element
    const iframe = document.getElementById('oobabooga-iframe');
    const loadingIndicator = document.querySelector('#oobabooga-container .llm-iframe-loading');
    const errorIndicator = document.querySelector('#oobabooga-container .llm-iframe-error');
    
    if (iframe && loadingIndicator && errorIndicator) {
        // Show loading indicator
        loadingIndicator.style.display = 'flex';
        errorIndicator.style.display = 'none';
        
        // Set iframe src
        iframe.src = oobaboogaEndpoint;
        
        // Handle iframe load event
        iframe.onload = () => {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            
            // Check if the iframe loaded successfully
            try {
                // Try to access the iframe content to check if it loaded
                const iframeContent = iframe.contentWindow.document;
                if (iframeContent) {
                    console.log('Oobabooga iframe loaded successfully');
                    showNotification('Oobabooga loaded successfully', 'success');
                    
                    // Update status indicator
                    updateStatusIndicator(true);
                }
            } catch (error) {
                console.error('Error accessing Oobabooga iframe content:', error);
                showErrorState();
            }
        };
        
        // Handle iframe error event
        iframe.onerror = () => {
            console.error('Error loading Oobabooga iframe');
            showErrorState();
        };
    }
}

/**
 * Show error state
 */
function showErrorState() {
    const loadingIndicator = document.querySelector('#oobabooga-container .llm-iframe-loading');
    const errorIndicator = document.querySelector('#oobabooga-container .llm-iframe-error');
    const iframe = document.getElementById('oobabooga-iframe');
    
    if (loadingIndicator && errorIndicator && iframe) {
        loadingIndicator.style.display = 'none';
        errorIndicator.style.display = 'flex';
        iframe.src = 'about:blank';
        
        showNotification('Failed to connect to Oobabooga', 'error');
        
        // Update status indicator
        updateStatusIndicator(false);
    }
}

/**
 * Update status indicator
 * @param {boolean} online - Whether the service is online
 */
function updateStatusIndicator(online) {
    const statusIndicator = document.querySelector('.llm-service-tab[data-provider="oobabooga"] .llm-service-tab-status');
    if (statusIndicator) {
        statusIndicator.className = online ? 'llm-service-tab-status online' : 'llm-service-tab-status offline';
    }
}

/**
 * Set Oobabooga endpoint
 * @param {string} endpoint - The endpoint URL
 */
export function setOobaboogaEndpoint(endpoint) {
    oobaboogaEndpoint = endpoint;
}

/**
 * Check Oobabooga status
 * @returns {Promise<boolean>} Whether Oobabooga is online
 */
export async function checkOobaboogaStatus() {
    try {
        const response = await fetch(oobaboogaEndpoint, {
            method: 'HEAD',
            mode: 'no-cors'
        });
        
        // Update status indicator
        updateStatusIndicator(true);
        
        return true;
    } catch (error) {
        console.error('Error checking Oobabooga status:', error);
        
        // Update status indicator
        updateStatusIndicator(false);
        
        return false;
    }
}
