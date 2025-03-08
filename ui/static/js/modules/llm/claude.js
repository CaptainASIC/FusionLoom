// FusionLoom v0.3 - Claude Module
// Handles interactions with the Anthropic Claude API

import { showNotification } from '../../modules/notifications.js';

// Claude API endpoint and key
let claudeEndpoint = 'https://api.anthropic.com/v1/messages';
let claudeApiKey = '';

/**
 * Set the Claude API key
 * @param {string} apiKey - The API key
 */
export function setClaudeApiKey(apiKey) {
    claudeApiKey = apiKey;
}

/**
 * Set the Claude API endpoint
 * @param {string} endpoint - The API endpoint URL
 */
export function setClaudeEndpoint(endpoint) {
    claudeEndpoint = endpoint;
}

/**
 * Get available Claude models
 * @returns {Array} Array of model names
 */
export function getClaudeModels() {
    return [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-2.1',
        'claude-2.0',
        'claude-instant-1.2'
    ];
}

/**
 * Send a message to Claude
 * @param {string} message - The message to send
 * @param {string} model - The model to use
 * @returns {Promise<string>} The response from Claude
 */
export async function sendClaudeMessage(message, model = 'claude-3-sonnet-20240229') {
    if (!claudeApiKey) {
        throw new Error('Claude API key is not set');
    }
    
    try {
        const response = await fetch(claudeEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': claudeApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 1000,
                messages: [{ role: 'user', content: message }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.content[0].text;
    } catch (error) {
        console.error('Error sending message to Claude:', error);
        throw new Error(`Failed to communicate with Claude: ${error.message}`);
    }
}

/**
 * Check if Claude API is available
 * @returns {Promise<boolean>} True if Claude API is available
 */
export async function checkClaudeAvailability() {
    if (!claudeApiKey) {
        return false;
    }
    
    try {
        // We can't actually check the API without making a real request,
        // so we'll just check if the API key is set
        return true;
    } catch (error) {
        console.error('Error checking Claude availability:', error);
        return false;
    }
}

/**
 * Initialize the Claude UI
 */
export function initializeClaudeUI() {
    const modelContainer = document.getElementById('claude-model-container');
    if (!modelContainer) return;
    
    // Check if API key is set
    if (!claudeApiKey) {
        modelContainer.innerHTML = `
            <div class="llm-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Claude API key is not set. Please set your API key in the settings.</p>
                <button id="claude-settings" class="fusion-button small">Go to Settings</button>
            </div>
        `;
        
        // Add settings button event listener
        const settingsButton = document.getElementById('claude-settings');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                // Navigate to settings page
                window.navigateToPage('settings');
            });
        }
        
        return;
    }
    
    // Create model selection UI
    const models = getClaudeModels();
    let modelHTML = '<div class="llm-model-selection">';
    
    models.forEach((model, index) => {
        modelHTML += `
            <div class="llm-model-option">
                <input type="radio" id="claude-model-${index}" name="claude-model" value="${model}" ${index === 0 ? 'checked' : ''}>
                <label for="claude-model-${index}">${model}</label>
            </div>
        `;
    });
    
    modelHTML += '</div>';
    modelContainer.innerHTML = modelHTML;
}

/**
 * Update Claude API settings
 * @param {string} apiKey - The API key
 * @param {string} endpoint - The API endpoint URL
 */
export function updateClaudeSettings(apiKey, endpoint) {
    if (apiKey) {
        setClaudeApiKey(apiKey);
    }
    
    if (endpoint) {
        setClaudeEndpoint(endpoint);
    }
    
    // Re-initialize the UI
    initializeClaudeUI();
    
    showNotification('Claude API settings updated', 'success');
}
