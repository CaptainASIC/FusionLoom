// FusionLoom v0.3 - Ollama Module
// Handles interactions with the Ollama API

import { showNotification } from '../../modules/notifications.js';

// Ollama API endpoint
let ollamaEndpoint = 'http://localhost:11434/api';

/**
 * Set the Ollama API endpoint
 * @param {string} endpoint - The API endpoint URL
 */
export function setOllamaEndpoint(endpoint) {
    ollamaEndpoint = endpoint;
}

/**
 * Get available Ollama models
 * @returns {Promise<Array>} Array of model names
 */
export async function getOllamaModels() {
    try {
        const response = await fetch(`${ollamaEndpoint}/tags`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.models.map(model => model.name);
    } catch (error) {
        console.error('Error fetching Ollama models:', error);
        return [];
    }
}

/**
 * Send a message to Ollama
 * @param {string} message - The message to send
 * @param {string} model - The model to use
 * @returns {Promise<string>} The response from Ollama
 */
export async function sendOllamaMessage(message, model = 'llama3') {
    try {
        const response = await fetch(`${ollamaEndpoint}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: message }],
                stream: false
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.message.content;
    } catch (error) {
        console.error('Error sending message to Ollama:', error);
        throw new Error(`Failed to communicate with Ollama: ${error.message}`);
    }
}

/**
 * Check if Ollama is available
 * @returns {Promise<boolean>} True if Ollama is available
 */
export async function checkOllamaAvailability() {
    try {
        const response = await fetch(`${ollamaEndpoint}/tags`, { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error checking Ollama availability:', error);
        return false;
    }
}

/**
 * Initialize the Ollama UI
 */
export async function initializeOllamaUI() {
    const modelContainer = document.getElementById('ollama-model-container');
    if (!modelContainer) return;
    
    try {
        // Check if Ollama is available
        const isAvailable = await checkOllamaAvailability();
        
        if (!isAvailable) {
            modelContainer.innerHTML = `
                <div class="llm-error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Could not connect to Ollama. Please make sure Ollama is running and try again.</p>
                    <button id="ollama-retry" class="fusion-button small">Retry</button>
                </div>
            `;
            
            // Add retry button event listener
            const retryButton = document.getElementById('ollama-retry');
            if (retryButton) {
                retryButton.addEventListener('click', initializeOllamaUI);
            }
            
            return;
        }
        
        // Get available models
        const models = await getOllamaModels();
        
        if (models.length === 0) {
            modelContainer.innerHTML = `
                <div class="llm-error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No models found in Ollama. Please pull a model and try again.</p>
                    <button id="ollama-retry" class="fusion-button small">Retry</button>
                </div>
            `;
            
            // Add retry button event listener
            const retryButton = document.getElementById('ollama-retry');
            if (retryButton) {
                retryButton.addEventListener('click', initializeOllamaUI);
            }
            
            return;
        }
        
        // Create model selection UI
        let modelHTML = '<div class="llm-model-selection">';
        
        models.forEach((model, index) => {
            modelHTML += `
                <div class="llm-model-option">
                    <input type="radio" id="ollama-model-${index}" name="ollama-model" value="${model}" ${index === 0 ? 'checked' : ''}>
                    <label for="ollama-model-${index}">${model}</label>
                </div>
            `;
        });
        
        modelHTML += '</div>';
        modelContainer.innerHTML = modelHTML;
        
        showNotification('Connected to Ollama successfully', 'success');
    } catch (error) {
        console.error('Error initializing Ollama UI:', error);
        
        modelContainer.innerHTML = `
            <div class="llm-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error connecting to Ollama: ${error.message}</p>
                <button id="ollama-retry" class="fusion-button small">Retry</button>
            </div>
        `;
        
        // Add retry button event listener
        const retryButton = document.getElementById('ollama-retry');
        if (retryButton) {
            retryButton.addEventListener('click', initializeOllamaUI);
        }
    }
}

/**
 * Pull a model from Ollama
 * @param {string} model - The model to pull
 * @returns {Promise<boolean>} True if successful
 */
export async function pullOllamaModel(model) {
    try {
        showNotification(`Pulling model: ${model}...`, 'info');
        
        const response = await fetch(`${ollamaEndpoint}/pull`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: model })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showNotification(`Successfully pulled model: ${model}`, 'success');
        return true;
    } catch (error) {
        console.error('Error pulling Ollama model:', error);
        showNotification(`Error pulling model: ${error.message}`, 'error');
        return false;
    }
}
