// FusionLoom v0.4.3 - TavernAI Integration Module
// Handles integration with TavernAI

import { showNotification } from '../notifications.js';

// Default endpoint
let tavernAIEndpoint = 'http://localhost:8001';

/**
 * Initialize the TavernAI UI
 */
export function initializeTavernAIUI() {
    console.log('Initializing TavernAI UI');
    
    // Get settings from localStorage
    const settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
    
    // Update endpoint if set in settings
    if (settings.tavernai_api) {
        tavernAIEndpoint = settings.tavernai_api;
    }
    
    // Get the iframe element
    const iframe = document.getElementById('tavernai-iframe');
    const loadingIndicator = document.querySelector('#tavernai-container .llm-iframe-loading');
    const errorIndicator = document.querySelector('#tavernai-container .llm-iframe-error');
    
    if (iframe && loadingIndicator && errorIndicator) {
        // Show loading indicator
        loadingIndicator.style.display = 'flex';
        errorIndicator.style.display = 'none';
        
        // Set iframe src
        iframe.src = tavernAIEndpoint;
        
        // Handle iframe load event
        iframe.onload = () => {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            
            // Check if the iframe loaded successfully
            try {
                // Try to access the iframe content to check if it loaded
                const iframeContent = iframe.contentWindow.document;
                if (iframeContent) {
                    console.log('TavernAI iframe loaded successfully');
                    showNotification('TavernAI loaded successfully', 'success');
                    
                    // Update status indicator
                    updateStatusIndicator(true);
                }
            } catch (error) {
                console.error('Error accessing TavernAI iframe content:', error);
                showErrorState();
            }
        };
        
        // Handle iframe error event
        iframe.onerror = () => {
            console.error('Error loading TavernAI iframe');
            showErrorState();
        };
    }
}

/**
 * Show error state
 */
function showErrorState() {
    const loadingIndicator = document.querySelector('#tavernai-container .llm-iframe-loading');
    const errorIndicator = document.querySelector('#tavernai-container .llm-iframe-error');
    const iframe = document.getElementById('tavernai-iframe');
    
    if (loadingIndicator && errorIndicator && iframe) {
        loadingIndicator.style.display = 'none';
        errorIndicator.style.display = 'flex';
        iframe.src = 'about:blank';
        
        showNotification('Failed to connect to TavernAI', 'error');
        
        // Update status indicator
        updateStatusIndicator(false);
    }
}

/**
 * Update status indicator
 * @param {boolean} online - Whether the service is online
 */
function updateStatusIndicator(online) {
    const statusIndicator = document.querySelector('.llm-service-tab[data-provider="tavernai"] .llm-service-tab-status');
    if (statusIndicator) {
        statusIndicator.className = online ? 'llm-service-tab-status online' : 'llm-service-tab-status offline';
    }
}

/**
 * Set TavernAI endpoint
 * @param {string} endpoint - The endpoint URL
 */
export function setTavernAIEndpoint(endpoint) {
    tavernAIEndpoint = endpoint;
}

/**
 * Check TavernAI status
 * @returns {Promise<boolean>} Whether TavernAI is online
 */
export async function checkTavernAIStatus() {
    try {
        const response = await fetch(tavernAIEndpoint, {
            method: 'HEAD',
            mode: 'no-cors'
        });
        
        // Update status indicator
        updateStatusIndicator(true);
        
        return true;
    } catch (error) {
        console.error('Error checking TavernAI status:', error);
        
        // Update status indicator
        updateStatusIndicator(false);
        
        return false;
    }
}
