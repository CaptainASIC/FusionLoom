// FusionLoom v0.4.1 - OpenRouter Module
// Handles interactions with the OpenRouter API

import { showNotification } from '../../modules/notifications.js';

// OpenRouter API endpoint and key
let openrouterEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
let openrouterApiKey = '';

/**
 * Set the OpenRouter API key
 * @param {string} apiKey - The API key
 */
export function setOpenRouterApiKey(apiKey) {
    openrouterApiKey = apiKey;
}

/**
 * Set the OpenRouter API endpoint
 * @param {string} endpoint - The API endpoint URL
 */
export function setOpenRouterEndpoint(endpoint) {
    openrouterEndpoint = endpoint + '/chat/completions';
}

/**
 * Get available OpenRouter models
 * @returns {Promise<Array>} Promise that resolves to an array of model names
 */
export async function getOpenRouterModels() {
    try {
        // First try to get models from the models API
        const response = await fetch('http://localhost:5052/api/models/openrouter', {
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
        if (!openrouterApiKey) {
            throw new Error('API key not set and models API failed');
        }
        
        // If models API fails but API key is set, try to fetch from OpenRouter API
        const openrouterResponse = await fetch('https://openrouter.ai/api/v1/models', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openrouterApiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'FusionLoom'
            }
        });
        
        if (!openrouterResponse.ok) {
            console.error('Failed to fetch OpenRouter models:', openrouterResponse.statusText);
            throw new Error(`HTTP error! status: ${openrouterResponse.status}`);
        }
        
        const data = await openrouterResponse.json();
        
        // Extract model names from the response
        if (data.data && Array.isArray(data.data)) {
            return data.data.map(model => model.id);
        } else {
            throw new Error('Invalid response format from OpenRouter API');
        }
    } catch (error) {
        console.error('Error fetching OpenRouter models:', error);
        
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
                if (allModels.openrouter && Array.isArray(allModels.openrouter)) {
                    return allModels.openrouter;
                }
            }
        } catch (fallbackError) {
            console.error('Error fetching from fallback models API:', fallbackError);
        }
        
        // If all else fails, return hardcoded default models
        return [
            'anthropic/claude-3-opus',
            'anthropic/claude-3-sonnet',
            'anthropic/claude-3-haiku',
            'openai/gpt-4o',
            'openai/gpt-4-turbo',
            'mistralai/mistral-large',
            'meta-llama/llama-3-70b-instruct'
        ];
    }
}

/**
 * Send a message to OpenRouter
 * @param {string} message - The message to send
 * @param {string} model - The model to use
 * @returns {Promise<string>} The response from OpenRouter
 */
export async function sendOpenRouterMessage(message, model = 'anthropic/claude-3-opus') {
    if (!openrouterApiKey) {
        throw new Error('OpenRouter API key is not set');
    }
    
    try {
        const response = await fetch(openrouterEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openrouterApiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'FusionLoom'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: message }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error sending message to OpenRouter:', error);
        throw new Error(`Failed to communicate with OpenRouter: ${error.message}`);
    }
}

/**
 * Check if OpenRouter API is available
 * @returns {Promise<boolean>} True if OpenRouter API is available
 */
export async function checkOpenRouterAvailability() {
    if (!openrouterApiKey) {
        // Try to get API key directly from localStorage
        try {
            const settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
            console.log('Direct check of settings in localStorage:', settings);
            
            if (settings.openrouter_key) {
                console.log('Found openrouter_key in localStorage:', settings.openrouter_key);
                openrouterApiKey = settings.openrouter_key;
                if (settings.openrouter_api) {
                    openrouterEndpoint = settings.openrouter_api + '/chat/completions';
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking localStorage for OpenRouter API key:', error);
            return false;
        }
    }
    
    try {
        // We can't actually check the API without making a real request,
        // so we'll just check if the API key is set
        return true;
    } catch (error) {
        console.error('Error checking OpenRouter availability:', error);
        return false;
    }
}

/**
 * Check if API key is set
 * @returns {boolean} True if API key is set
 */
export function checkApiKeySet() {
    return !!openrouterApiKey;
}

/**
 * Initialize the OpenRouter UI
 */
export async function initializeOpenRouterUI() {
    const modelContainer = document.getElementById('openrouter-model-container');
    const chatDisplay = document.getElementById('openrouter-chat-display');
    const messageInput = document.getElementById('openrouter-message-input');
    const attachButton = document.getElementById('openrouter-attach-button');
    const sendButton = document.getElementById('openrouter-send-button');
    const modelStatus = document.querySelector('#openrouter-container .llm-model-status');
    
    if (!modelContainer) return;
    
    // Check if API key is set in settings
    if (!openrouterApiKey) {
        // Try to get API key from settings
        try {
            // First try localStorage
            const localSettings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
            
            // Log the settings to see what's available
            console.log('Local settings for OpenRouter:', localSettings);
            
            if (localSettings.openrouter_key) {
                openrouterApiKey = localSettings.openrouter_key;
                console.log('Found openrouter_key in localStorage:', openrouterApiKey);
                if (localSettings.openrouter_api) {
                    openrouterEndpoint = localSettings.openrouter_api + '/chat/completions';
                    console.log('Set OpenRouter endpoint from localStorage to:', openrouterEndpoint);
                }
            } else {
                // Try to get from config.ini via API
                console.log('No API key found in localStorage, trying config.ini...');
                const response = await fetch('http://localhost:5052/api/settings');
                if (response.ok) {
                    const configSettings = await response.json();
                    console.log('Config settings for OpenRouter:', configSettings);
                    
                    if (configSettings.openrouter_key) {
                        openrouterApiKey = configSettings.openrouter_key;
                        console.log('Found openrouter_key in config.ini:', openrouterApiKey);
                        if (configSettings.openrouter_api) {
                            openrouterEndpoint = configSettings.openrouter_api + '/chat/completions';
                            console.log('Set OpenRouter endpoint from config.ini to:', openrouterEndpoint);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    console.log('OpenRouter API Key status:', openrouterApiKey ? 'Set' : 'Not set');
    
    // If API key is still not set, show error message
    if (!openrouterApiKey) {
        if (chatDisplay) {
            chatDisplay.innerHTML = `
                <div class="llm-error-message">
                    <i class="fas fa-key"></i>
                    <p>OpenRouter API key required. Please add your API key in the Settings page.</p>
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
                <p>OpenRouter API key is not set. Please set your API key in the settings.</p>
                <button id="openrouter-settings" class="fusion-button small">Go to Settings</button>
            </div>
        `;
        
        // Add settings button event listener
        const settingsButton = document.getElementById('openrouter-settings');
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
                <h2>Welcome to OpenRouter Chat</h2>
                <p>Start a conversation with any AI model through OpenRouter. Select a model from the sidebar and start chatting.</p>
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
        const models = await getOpenRouterModels();
        
        // Create model selection UI
        let modelHTML = '<div class="llm-model-list">';
        
        models.forEach((model, index) => {
            const displayName = model.split('/').pop();
            const provider = model.split('/')[0];
            
            modelHTML += `
                <div class="llm-model-item ${index === 0 ? 'selected' : ''}">
                    <input type="radio" id="openrouter-model-${index}" name="openrouter-model" value="${model}" class="llm-model-radio" ${index === 0 ? 'checked' : ''}>
                    <div class="llm-model-info">
                        <label for="openrouter-model-${index}" class="llm-model-name">${displayName}</label>
                        <div class="llm-model-description">${provider}</div>
                    </div>
                </div>
            `;
        });
        
        modelHTML += '</div>';
        modelContainer.innerHTML = modelHTML;
        
        // Add event listeners to model items
        const modelItems = modelContainer.querySelectorAll('.llm-model-item');
        modelItems.forEach(item => {
            item.addEventListener('click', () => {
                // Find the radio input and check it
                const radio = item.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    
                    // Update selected class
                    modelItems.forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                }
            });
        });
    } catch (error) {
        console.error('Error initializing OpenRouter UI:', error);
        
        modelContainer.innerHTML = `
            <div class="llm-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading OpenRouter models: ${error.message}</p>
                <button id="openrouter-retry" class="fusion-button small">Retry</button>
            </div>
        `;
        
        // Add retry button event listener
        const retryButton = document.getElementById('openrouter-retry');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                initializeOpenRouterUI();
            });
        }
    }
}

/**
 * Update OpenRouter API settings
 * @param {string} apiKey - The API key
 * @param {string} endpoint - The API endpoint URL
 */
export function updateOpenRouterSettings(apiKey, endpoint) {
    if (apiKey) {
        setOpenRouterApiKey(apiKey);
    }
    
    if (endpoint) {
        setOpenRouterEndpoint(endpoint);
    }
    
    // Re-initialize the UI
    initializeOpenRouterUI();
    
    showNotification('OpenRouter API settings updated', 'success');
}
