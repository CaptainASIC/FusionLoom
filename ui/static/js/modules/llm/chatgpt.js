// FusionLoom v0.4 - ChatGPT Module
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
 * @returns {Promise<Array>} Promise that resolves to an array of model names
 */
export async function getOpenAIModels() {
    try {
        // First try to get models from the models API
        const response = await fetch('http://localhost:5052/api/models/openai', {
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
        if (!openaiApiKey) {
            throw new Error('API key not set and models API failed');
        }
        
        // If models API fails but API key is set, try to fetch from OpenAI API
        const openaiResponse = await fetch('http://localhost:5052/api/proxy/openai/models', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!openaiResponse.ok) {
            console.error('Failed to fetch OpenAI models:', openaiResponse.statusText);
            throw new Error(`HTTP error! status: ${openaiResponse.status}`);
        }
        
        const data = await openaiResponse.json();
        
        // Extract model names from the response and filter for chat models
        if (data.data && Array.isArray(data.data)) {
            return data.data
                .filter(model => model.id.includes('gpt'))
                .map(model => model.id);
        } else {
            throw new Error('Invalid response format from OpenAI API');
        }
    } catch (error) {
        console.error('Error fetching OpenAI models:', error);
        
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
                if (allModels.openai && Array.isArray(allModels.openai)) {
                    return allModels.openai;
                }
            }
        } catch (fallbackError) {
            console.error('Error fetching from fallback models API:', fallbackError);
        }
        
        // If all else fails, return hardcoded default models
        return [
            'gpt-4o-2024-05-13',
            'gpt-4-turbo-2024-04-09',
            'gpt-4-vision-preview',
            'gpt-4-1106-preview',
            'gpt-3.5-turbo-0125'
        ];
    }
}

/**
 * Send a message to ChatGPT
 * @param {string} message - The message to send
 * @param {string} model - The model to use
 * @returns {Promise<string>} The response from ChatGPT
 */
export async function sendChatGPTMessage(message, model = 'gpt-4o-2024-05-13') {
    if (!openaiApiKey) {
        throw new Error('OpenAI API key is not set');
    }
    
    try {
        // Use the proxy endpoint instead of direct API call
        const response = await fetch('http://localhost:5052/api/proxy/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
        // Try to get API key directly from localStorage
        try {
            const settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
            console.log('Direct check of settings in localStorage for OpenAI:', settings);
            
            if (settings.openai_key) {
                console.log('Found openai_key in localStorage:', settings.openai_key);
                openaiApiKey = settings.openai_key;
                if (settings.openai_api) {
                    openaiEndpoint = settings.openai_api + '/chat/completions';
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking localStorage for OpenAI API key:', error);
            return false;
        }
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
 * Check if API key is set
 * @returns {boolean} True if API key is set
 */
export function checkApiKeySet() {
    return !!openaiApiKey;
}

/**
 * Initialize the ChatGPT UI
 */
export async function initializeChatGPTUI() {
    const modelContainer = document.getElementById('chatgpt-model-container');
    const chatDisplay = document.getElementById('chatgpt-chat-display');
    const messageInput = document.getElementById('chatgpt-message-input');
    const attachButton = document.getElementById('chatgpt-attach-button');
    const sendButton = document.getElementById('chatgpt-send-button');
    const modelStatus = document.querySelector('#chatgpt-container .llm-model-status');
    
    if (!modelContainer) return;
    
    // Check if API key is set in settings
    if (!openaiApiKey) {
        // Try to get API key from settings
        try {
            // First try localStorage
            const localSettings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
            
            // Log the settings to see what's available
            console.log('Local settings for ChatGPT:', localSettings);
            
            if (localSettings.openai_key) {
                openaiApiKey = localSettings.openai_key;
                console.log('Found openai_key in localStorage:', openaiApiKey);
                if (localSettings.openai_api) {
                    openaiEndpoint = localSettings.openai_api + '/chat/completions';
                    console.log('Set OpenAI endpoint from localStorage to:', openaiEndpoint);
                }
            } else {
                // Try to get from config.ini via API
                console.log('No API key found in localStorage, trying config.ini...');
                const response = await fetch('http://localhost:5052/api/settings');
                if (response.ok) {
                    const configSettings = await response.json();
                    console.log('Config settings for ChatGPT:', configSettings);
                    
                    if (configSettings.openai_key) {
                        openaiApiKey = configSettings.openai_key;
                        console.log('Found openai_key in config.ini:', openaiApiKey);
                        if (configSettings.openai_api) {
                            openaiEndpoint = configSettings.openai_api + '/chat/completions';
                            console.log('Set OpenAI endpoint from config.ini to:', openaiEndpoint);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    console.log('OpenAI API Key status:', openaiApiKey ? 'Set' : 'Not set');
    
    // If API key is still not set, show error message
    if (!openaiApiKey) {
        if (chatDisplay) {
            chatDisplay.innerHTML = `
                <div class="llm-error-message">
                    <i class="fas fa-key"></i>
                    <p>OpenAI API key required. Please add your API key in the Settings page.</p>
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
                <h2>Welcome to ChatGPT</h2>
                <p>Start a conversation with OpenAI's GPT models. Select a model from the sidebar and start chatting.</p>
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
        const models = await getOpenAIModels();
        
        // Create model selection UI
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
    } catch (error) {
        console.error('Error initializing ChatGPT UI:', error);
        
        modelContainer.innerHTML = `
            <div class="llm-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading OpenAI models: ${error.message}</p>
                <button id="chatgpt-retry" class="fusion-button small">Retry</button>
            </div>
        `;
        
        // Add retry button event listener
        const retryButton = document.getElementById('chatgpt-retry');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                initializeChatGPTUI();
            });
        }
    }
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
