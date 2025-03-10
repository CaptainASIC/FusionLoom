// FusionLoom v0.4 - Claude Module
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
 * @returns {Promise<Array>} Promise that resolves to an array of model names
 */
export async function getClaudeModels() {
    try {
        // First try to get models from the models API
        const response = await fetch('http://localhost:5052/api/models/claude', {
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
        if (!claudeApiKey) {
            throw new Error('API key not set and models API failed');
        }
        
        // If models API fails but API key is set, try to fetch from Claude API
        const claudeResponse = await fetch('http://localhost:5052/api/proxy/claude/models', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!claudeResponse.ok) {
            console.error('Failed to fetch Claude models:', claudeResponse.statusText);
            throw new Error(`HTTP error! status: ${claudeResponse.status}`);
        }
        
        const data = await claudeResponse.json();
        
        // Extract model names from the response
        if (data.models && Array.isArray(data.models)) {
            return data.models.map(model => model.id);
        } else {
            throw new Error('Invalid response format from Anthropic API');
        }
    } catch (error) {
        console.error('Error fetching Claude models:', error);
        
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
                if (allModels.claude && Array.isArray(allModels.claude)) {
                    return allModels.claude;
                }
            }
        } catch (fallbackError) {
            console.error('Error fetching from fallback models API:', fallbackError);
        }
        
        // If all else fails, return hardcoded default models
        return [
            'claude-3-7-sonnet',
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku',
            'claude-3-5-sonnet-20240620',
            'claude-3-haiku',
            'claude-3-opus'
        ];
    }
}

/**
 * Send a message to Claude
 * @param {string} message - The message to send
 * @param {string} model - The model to use
 * @returns {Promise<string>} The response from Claude
 */
export async function sendClaudeMessage(message, model = 'claude-3-5-sonnet-20241022') {
    if (!claudeApiKey) {
        throw new Error('Claude API key is not set');
    }
    
    try {
        // Use the proxy endpoint instead of direct API call
        const response = await fetch('http://localhost:5052/api/proxy/claude/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
        // Try to get API key directly from localStorage
        try {
            const settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
            console.log('Direct check of settings in localStorage:', settings);
            
            if (settings.anthropic_key) {
                console.log('Found anthropic_key in localStorage:', settings.anthropic_key);
                claudeApiKey = settings.anthropic_key;
                if (settings.anthropic_api) {
                    claudeEndpoint = settings.anthropic_api + '/messages';
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error checking localStorage for Claude API key:', error);
            return false;
        }
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
 * Check if API key is set
 * @returns {boolean} True if API key is set
 */
export function checkApiKeySet() {
    return !!claudeApiKey;
}

/**
 * Initialize the Claude UI
 */
export async function initializeClaudeUI() {
    const modelContainer = document.getElementById('claude-model-container');
    const chatDisplay = document.getElementById('claude-chat-display');
    const messageInput = document.getElementById('claude-message-input');
    const attachButton = document.getElementById('claude-attach-button');
    const sendButton = document.getElementById('claude-send-button');
    const modelStatus = document.querySelector('#claude-container .llm-model-status');
    
    if (!modelContainer) return;
    
    // Check if API key is set in settings
    if (!claudeApiKey) {
        // Try to get API key from settings
        try {
            // First try localStorage
            const localSettings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
            
            // Log the settings to see what's available
            console.log('Local settings for Claude:', localSettings);
            
            if (localSettings.anthropic_key) {
                claudeApiKey = localSettings.anthropic_key;
                console.log('Found anthropic_key in localStorage:', claudeApiKey);
                if (localSettings.anthropic_api) {
                    claudeEndpoint = localSettings.anthropic_api + '/messages';
                    console.log('Set Claude endpoint from localStorage to:', claudeEndpoint);
                }
            } else {
                // Try to get from config.ini via API
                console.log('No API key found in localStorage, trying config.ini...');
                const response = await fetch('http://localhost:5052/api/settings');
                if (response.ok) {
                    const configSettings = await response.json();
                    console.log('Config settings for Claude:', configSettings);
                    
                    if (configSettings.anthropic_key) {
                        claudeApiKey = configSettings.anthropic_key;
                        console.log('Found anthropic_key in config.ini:', claudeApiKey);
                        if (configSettings.anthropic_api) {
                            claudeEndpoint = configSettings.anthropic_api + '/messages';
                            console.log('Set Claude endpoint from config.ini to:', claudeEndpoint);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    console.log('Claude API Key status:', claudeApiKey ? 'Set' : 'Not set');
    
    // If API key is still not set, show error message
    if (!claudeApiKey) {
        if (chatDisplay) {
            chatDisplay.innerHTML = `
                <div class="llm-error-message">
                    <i class="fas fa-key"></i>
                    <p>Claude API key required. Please add your API key in the Settings page.</p>
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
                <h2>Welcome to Claude Chat</h2>
                <p>Start a conversation with Anthropic's Claude AI assistant. Select a model from the sidebar and start chatting.</p>
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
        const models = await getClaudeModels();
        
        // Create model selection UI
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
    } catch (error) {
        console.error('Error initializing Claude UI:', error);
        
        modelContainer.innerHTML = `
            <div class="llm-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading Claude models: ${error.message}</p>
                <button id="claude-retry" class="fusion-button small">Retry</button>
            </div>
        `;
        
        // Add retry button event listener
        const retryButton = document.getElementById('claude-retry');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                initializeClaudeUI();
            });
        }
    }
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
