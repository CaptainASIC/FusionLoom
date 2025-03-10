// FusionLoom v0.4 - Gemini Module
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
 * @returns {Promise<Array>} Promise that resolves to an array of model names
 */
export async function getGeminiModels() {
    try {
        // First try to get models from the models API
        const response = await fetch('http://localhost:5052/api/models/gemini', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const models = await response.json();
            return models;
        }
        
        // If that fails and API key is not set, throw error to trigger fallback
        if (!geminiApiKey) {
            throw new Error('API key not set and models API failed');
        }
        
        // If models API fails but API key is set, try to fetch from Gemini API
        const geminiResponse = await fetch('http://localhost:5052/api/proxy/gemini/models', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!geminiResponse.ok) {
            console.error('Failed to fetch Gemini models:', geminiResponse.statusText);
            throw new Error(`HTTP error! status: ${geminiResponse.status}`);
        }
        
        const data = await geminiResponse.json();
        
        // Extract model names from the response
        if (data.models && Array.isArray(data.models)) {
            return data.models.map(model => model.name.split('/').pop());
        } else {
            throw new Error('Invalid response format from Gemini API');
        }
    } catch (error) {
        console.error('Error fetching Gemini models:', error);
        
        // Try one more time to get models from the models API
        try {
            const fallbackResponse = await fetch('http://localhost:5052/api/models', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (fallbackResponse.ok) {
                const allModels = await fallbackResponse.json();
                if (allModels.gemini && Array.isArray(allModels.gemini)) {
                    return allModels.gemini;
                }
            }
        } catch (fallbackError) {
            console.error('Error fetching from fallback models API:', fallbackError);
        }
        
        // If all else fails, return hardcoded default models
        return [
            'gemini-1.5-pro-latest',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-001',
            'gemini-1.5-flash-001',
            'gemini-1.0-pro-latest',
            'gemini-1.0-pro-vision-latest'
        ];
    }
}

/**
 * Send a message to Gemini
 * @param {string} message - The message to send
 * @param {string} model - The model to use
 * @returns {Promise<string>} The response from Gemini
 */
export async function sendGeminiMessage(message, model = 'gemini-1.5-pro-latest') {
    if (!geminiApiKey) {
        throw new Error('Gemini API key is not set');
    }
    
    try {
        // Use the proxy endpoint instead of direct API call
        const response = await fetch(`http://localhost:5052/api/proxy/gemini/${model}:generateContent`, {
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
        // Try to get API key directly from localStorage
        try {
            const settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
            console.log('Direct check of settings in localStorage for Gemini:', settings);
            
            if (settings.gemini_key) {
                console.log('Found gemini_key in localStorage:', settings.gemini_key);
                geminiApiKey = settings.gemini_key;
                if (settings.gemini_api) {
                    geminiEndpoint = settings.gemini_api;
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking localStorage for Gemini API key:', error);
            return false;
        }
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
 * Check if API key is set
 * @returns {boolean} True if API key is set
 */
export function checkApiKeySet() {
    return !!geminiApiKey;
}

/**
 * Initialize the Gemini UI
 */
export async function initializeGeminiUI() {
    const modelContainer = document.getElementById('gemini-model-container');
    const chatDisplay = document.getElementById('gemini-chat-display');
    const messageInput = document.getElementById('gemini-message-input');
    const attachButton = document.getElementById('gemini-attach-button');
    const sendButton = document.getElementById('gemini-send-button');
    const modelStatus = document.querySelector('#gemini-container .llm-model-status');
    
    if (!modelContainer) return;
    
    // Check if API key is set in settings
    if (!geminiApiKey) {
        // Try to get API key from settings
        try {
            // First try localStorage
            const localSettings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
            
            // Log the settings to see what's available
            console.log('Local settings for Gemini:', localSettings);
            
            if (localSettings.gemini_key) {
                geminiApiKey = localSettings.gemini_key;
                console.log('Found gemini_key in localStorage:', geminiApiKey);
                if (localSettings.gemini_api) {
                    geminiEndpoint = localSettings.gemini_api;
                    console.log('Set Gemini endpoint from localStorage to:', geminiEndpoint);
                }
            } else {
                // Try to get from config.ini via API
                console.log('No API key found in localStorage, trying config.ini...');
                const response = await fetch('http://localhost:5052/api/settings');
                if (response.ok) {
                    const configSettings = await response.json();
                    console.log('Config settings for Gemini:', configSettings);
                    
                    if (configSettings.gemini_key) {
                        geminiApiKey = configSettings.gemini_key;
                        console.log('Found gemini_key in config.ini:', geminiApiKey);
                        if (configSettings.gemini_api) {
                            geminiEndpoint = configSettings.gemini_api;
                            console.log('Set Gemini endpoint from config.ini to:', geminiEndpoint);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    console.log('Gemini API Key status:', geminiApiKey ? 'Set' : 'Not set');
    
    // If API key is still not set, show error message
    if (!geminiApiKey) {
        if (chatDisplay) {
            chatDisplay.innerHTML = `
                <div class="llm-error-message">
                    <i class="fas fa-key"></i>
                    <p>Google API key required. Please add your API key in the Settings page.</p>
                    <button class="fusion-button small" onclick="navigateToPage('settings')">Go to Settings</button>
                </div>
            `;
        }
        
        // Disable input
        if (messageInput) messageInput.disabled = true;
        if (attachButton) attachButton.disabled = true;
        if (sendButton) sendButton.disabled = true;
        
        // Update status
        if (modelStatus) {
            const indicator = modelStatus.querySelector('.llm-model-status-indicator');
            const text = modelStatus.querySelector('span');
            if (indicator) indicator.className = 'llm-model-status-indicator error';
            if (text) text.textContent = 'API Key Required';
        }
        
        // Show error in model container
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
    
    // API key is set, enable input
    if (messageInput) messageInput.disabled = false;
    if (attachButton) attachButton.disabled = false;
    if (sendButton) sendButton.disabled = false;
    
    // Update status
    if (modelStatus) {
        const indicator = modelStatus.querySelector('.llm-model-status-indicator');
        const text = modelStatus.querySelector('span');
        if (indicator) indicator.className = 'llm-model-status-indicator online';
        if (text) text.textContent = 'Ready';
    }
    
    // Clear error message if present
    if (chatDisplay && chatDisplay.querySelector('.llm-error-message')) {
        chatDisplay.innerHTML = `
            <div class="llm-welcome-message">
                <h2>Welcome to Gemini Chat</h2>
                <p>Start a conversation with Google's Gemini AI models. Select a model from the sidebar and start chatting.</p>
                <div class="llm-welcome-suggestions">
                    <div class="llm-welcome-suggestion">Explain quantum computing in simple terms</div>
                    <div class="llm-welcome-suggestion">Write a short story about a robot learning to paint</div>
                    <div class="llm-welcome-suggestion">What are the best practices for sustainable gardening?</div>
                    <div class="llm-welcome-suggestion">Help me debug a Python function that's not working</div>
                </div>
            </div>
        `;
        
        // Set up welcome suggestions
        const suggestions = chatDisplay.querySelectorAll('.llm-welcome-suggestion');
        suggestions.forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                if (messageInput && sendButton) {
                    messageInput.value = suggestion.textContent;
                    sendButton.click();
                }
            });
        });
    }
    
    // Show loading indicator
    modelContainer.innerHTML = `
        <div class="llm-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading available models...</p>
        </div>
    `;
    
    try {
        // Fetch available models
        const models = await getGeminiModels();
        
        // Create model selection UI
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
    } catch (error) {
        console.error('Error initializing Gemini UI:', error);
        
        modelContainer.innerHTML = `
            <div class="llm-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading Gemini models: ${error.message}</p>
                <button id="gemini-retry" class="fusion-button small">Retry</button>
            </div>
        `;
        
        // Add retry button event listener
        const retryButton = document.getElementById('gemini-retry');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                initializeGeminiUI();
            });
        }
    }
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
