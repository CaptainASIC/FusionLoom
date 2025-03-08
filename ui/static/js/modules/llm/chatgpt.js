// FusionLoom v0.3 - ChatGPT Module
// Handles interactions with the OpenAI API

import { showNotification } from '../../modules/notifications.js';

// OpenAI API endpoint and key
let openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
let openaiApiKey = '';

/**
 * Set the OpenAI API key
 * @param {string} apiKey - The API key
 */
export function setOpenAIApiKey(apiKey) {
    openaiApiKey = apiKey;
}

/**
 * Set the OpenAI API endpoint
 * @param {string} endpoint - The API endpoint URL
 */
export function setOpenAIEndpoint(endpoint) {
    openaiEndpoint = endpoint;
}

/**
 * Get available OpenAI models
 * @returns {Array} Array of model names
 */
export function getOpenAIModels() {
    return [
        'gpt-4o',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
        'gpt-3.5-turbo-16k'
    ];
}

/**
 * Send a message to ChatGPT
 * @param {string} message - The message to send
 * @param {string} model - The model to use
 * @returns {Promise<string>} The response from ChatGPT
 */
export async function sendChatGPTMessage(message, model = 'gpt-3.5-turbo') {
    if (!openaiApiKey) {
        throw new Error('OpenAI API key is not set');
    }
    
    try {
        const response = await fetch(openaiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: message }],
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error sending message to ChatGPT:', error);
        throw new Error(`Failed to communicate with ChatGPT: ${error.message}`);
    }
}

/**
 * Check if OpenAI API is available
 * @returns {Promise<boolean>} True if OpenAI API is available
 */
export async function checkOpenAIAvailability() {
    if (!openaiApiKey) {
        return false;
    }
    
    try {
        // We can't actually check the API without making a real request,
        // so we'll just check if the API key is set
        return true;
    } catch (error) {
        console.error('Error checking OpenAI availability:', error);
        return false;
    }
}

/**
 * Initialize the ChatGPT UI
 */
export function initializeChatGPTUI() {
    const modelContainer = document.getElementById('chatgpt-model-container');
    if (!modelContainer) return;
    
    // Check if API key is set
    if (!openaiApiKey) {
        modelContainer.innerHTML = `
            <div class="llm-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>OpenAI API key is not set. Please set your API key in the settings.</p>
                <button id="chatgpt-settings" class="fusion-button small">Go to Settings</button>
            </div>
        `;
        
        // Add settings button event listener
        const settingsButton = document.getElementById('chatgpt-settings');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                // Navigate to settings page
                window.navigateToPage('settings');
            });
        }
        
        return;
    }
    
    // Create model selection UI
    const models = getOpenAIModels();
    let modelHTML = '<div class="llm-model-selection">';
    
    models.forEach((model, index) => {
        modelHTML += `
            <div class="llm-model-option">
                <input type="radio" id="chatgpt-model-${index}" name="chatgpt-model" value="${model}" ${index === 0 ? 'checked' : ''}>
                <label for="chatgpt-model-${index}">${model}</label>
            </div>
        `;
    });
    
    modelHTML += '</div>';
    modelContainer.innerHTML = modelHTML;
}

/**
 * Update OpenAI API settings
 * @param {string} apiKey - The API key
 * @param {string} endpoint - The API endpoint URL
 */
export function updateOpenAISettings(apiKey, endpoint) {
    if (apiKey) {
        setOpenAIApiKey(apiKey);
    }
    
    if (endpoint) {
        setOpenAIEndpoint(endpoint);
    }
    
    // Re-initialize the UI
    initializeChatGPTUI();
    
    showNotification('OpenAI API settings updated', 'success');
}
