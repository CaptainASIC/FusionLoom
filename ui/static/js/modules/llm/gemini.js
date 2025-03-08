// FusionLoom v0.3 - Gemini Module
// Handles interactions with the Google Gemini API

import { showNotification } from '../../modules/notifications.js';

// Gemini API endpoint and key
let geminiEndpoint = 'https://generativelanguage.googleapis.com/v1/models';
let geminiApiKey = '';

/**
 * Set the Gemini API key
 * @param {string} apiKey - The API key
 */
export function setGeminiApiKey(apiKey) {
    geminiApiKey = apiKey;
}

/**
 * Set the Gemini API endpoint
 * @param {string} endpoint - The API endpoint URL
 */
export function setGeminiEndpoint(endpoint) {
    geminiEndpoint = endpoint;
}

/**
 * Get available Gemini models
 * @returns {Array} Array of model names
 */
export function getGeminiModels() {
    return [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'gemini-1.0-pro-vision'
    ];
}

/**
 * Send a message to Gemini
 * @param {string} message - The message to send
 * @param {string} model - The model to use
 * @returns {Promise<string>} The response from Gemini
 */
export async function sendGeminiMessage(message, model = 'gemini-1.0-pro') {
    if (!geminiApiKey) {
        throw new Error('Gemini API key is not set');
    }
    
    try {
        const url = `${geminiEndpoint}/${model}:generateContent?key=${geminiApiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: message }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 1000,
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('No response from Gemini');
        }
        
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error sending message to Gemini:', error);
        throw new Error(`Failed to communicate with Gemini: ${error.message}`);
    }
}

/**
 * Check if Gemini API is available
 * @returns {Promise<boolean>} True if Gemini API is available
 */
export async function checkGeminiAvailability() {
    if (!geminiApiKey) {
        return false;
    }
    
    try {
        // We can't actually check the API without making a real request,
        // so we'll just check if the API key is set
        return true;
    } catch (error) {
        console.error('Error checking Gemini availability:', error);
        return false;
    }
}

/**
 * Initialize the Gemini UI
 */
export function initializeGeminiUI() {
    const modelContainer = document.getElementById('gemini-model-container');
    if (!modelContainer) return;
    
    // Check if API key is set
    if (!geminiApiKey) {
        modelContainer.innerHTML = `
            <div class="llm-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Gemini API key is not set. Please set your API key in the settings.</p>
                <button id="gemini-settings" class="fusion-button small">Go to Settings</button>
            </div>
        `;
        
        // Add settings button event listener
        const settingsButton = document.getElementById('gemini-settings');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                // Navigate to settings page
                window.navigateToPage('settings');
            });
        }
        
        return;
    }
    
    // Create model selection UI
    const models = getGeminiModels();
    let modelHTML = '<div class="llm-model-selection">';
    
    models.forEach((model, index) => {
        modelHTML += `
            <div class="llm-model-option">
                <input type="radio" id="gemini-model-${index}" name="gemini-model" value="${model}" ${index === 0 ? 'checked' : ''}>
                <label for="gemini-model-${index}">${model}</label>
            </div>
        `;
    });
    
    modelHTML += '</div>';
    modelContainer.innerHTML = modelHTML;
}

/**
 * Update Gemini API settings
 * @param {string} apiKey - The API key
 * @param {string} endpoint - The API endpoint URL
 */
export function updateGeminiSettings(apiKey, endpoint) {
    if (apiKey) {
        setGeminiApiKey(apiKey);
    }
    
    if (endpoint) {
        setGeminiEndpoint(endpoint);
    }
    
    // Re-initialize the UI
    initializeGeminiUI();
    
    showNotification('Gemini API settings updated', 'success');
}
