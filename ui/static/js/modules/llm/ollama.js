// FusionLoom v0.3 - Ollama Module
// Handles interactions with the Ollama API

import { showNotification } from '../../modules/notifications.js';

// Ollama API endpoint
let ollamaEndpoint = 'http://localhost:11434/api';

// Model loading status
let modelLoadingStatus = {};

// Model availability cache
let modelAvailabilityCache = {
    lastChecked: 0,
    models: []
};

/**
 * Set the Ollama API endpoint
 * @param {string} endpoint - The API endpoint URL
 */
export function setOllamaEndpoint(endpoint) {
    ollamaEndpoint = endpoint;
}

/**
 * Get available Ollama models
 * @param {boolean} forceRefresh - Force a refresh of the cache
 * @returns {Promise<Array>} Array of model objects with name, size, and description
 */
export async function getOllamaModels(forceRefresh = false) {
    // Check cache first if not forcing refresh
    const now = Date.now();
    if (!forceRefresh && 
        modelAvailabilityCache.lastChecked > 0 && 
        now - modelAvailabilityCache.lastChecked < 60000) { // 1 minute cache
        return modelAvailabilityCache.models;
    }
    
    try {
        const response = await fetch(`${ollamaEndpoint}/tags`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the data to include more details
        const models = data.models.map(model => ({
            name: model.name,
            size: formatModelSize(model.size),
            modified: new Date(model.modified).toLocaleDateString(),
            description: getModelDescription(model.name),
            parameters: getModelParameters(model.name),
            status: 'ready'
        }));
        
        // Update cache
        modelAvailabilityCache = {
            lastChecked: now,
            models: models
        };
        
        return models;
    } catch (error) {
        console.error('Error fetching Ollama models:', error);
        return [];
    }
}

/**
 * Format model size in a human-readable format
 * @param {number} size - The size in bytes
 * @returns {string} Formatted size
 */
function formatModelSize(size) {
    const GB = 1024 * 1024 * 1024;
    const MB = 1024 * 1024;
    
    if (size >= GB) {
        return `${(size / GB).toFixed(1)}GB`;
    } else {
        return `${(size / MB).toFixed(0)}MB`;
    }
}

/**
 * Get a description for a model based on its name
 * @param {string} name - The model name
 * @returns {string} Model description
 */
function getModelDescription(name) {
    const modelDescriptions = {
        'llama3': 'Meta\'s Llama 3 model',
        'llama3:8b': 'Llama 3 8B parameter model',
        'llama3:70b': 'Llama 3 70B parameter model',
        'mistral': 'Mistral AI\'s base model',
        'mixtral': 'Mistral\'s mixture of experts model',
        'codellama': 'Code-specialized Llama model',
        'phi': 'Microsoft\'s Phi model',
        'phi3': 'Microsoft\'s Phi-3 model',
        'gemma': 'Google\'s Gemma model',
        'gemma:2b': 'Google\'s Gemma 2B model',
        'gemma:7b': 'Google\'s Gemma 7B model',
        'neural-chat': 'Intel\'s Neural Chat model',
        'wizard-math': 'Math-specialized model',
        'stable-code': 'Code generation model',
        'orca-mini': 'Small but capable model',
        'vicuna': 'Fine-tuned Llama model',
        'falcon': 'TII\'s Falcon model'
    };
    
    // Check for exact matches
    if (modelDescriptions[name]) {
        return modelDescriptions[name];
    }
    
    // Check for partial matches
    for (const [key, description] of Object.entries(modelDescriptions)) {
        if (name.toLowerCase().includes(key.toLowerCase())) {
            return description;
        }
    }
    
    return 'Ollama model';
}

/**
 * Get parameter count for a model based on its name
 * @param {string} name - The model name
 * @returns {string} Parameter count
 */
function getModelParameters(name) {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('70b')) return '70B';
    if (lowerName.includes('34b')) return '34B';
    if (lowerName.includes('13b')) return '13B';
    if (lowerName.includes('8b')) return '8B';
    if (lowerName.includes('7b')) return '7B';
    if (lowerName.includes('3b')) return '3B';
    if (lowerName.includes('2b')) return '2B';
    if (lowerName.includes('1b')) return '1B';
    
    // Extract numbers followed by 'b' or 'B'
    const match = name.match(/(\d+)[bB]/);
    if (match) {
        return `${match[1]}B`;
    }
    
    return '';
}

/**
 * Send a message to Ollama
 * @param {string} message - The message to send
 * @param {string} model - The model to use
 * @param {Array} history - Previous messages in the conversation
 * @returns {Promise<string>} The response from Ollama
 */
export async function sendOllamaMessage(message, model = 'llama3', history = []) {
    try {
        // Check if model is available
        const isAvailable = await checkModelAvailability(model);
        if (!isAvailable) {
            const shouldPull = confirm(`Model ${model} is not available. Would you like to pull it now?`);
            if (shouldPull) {
                await pullOllamaModel(model);
            } else {
                throw new Error(`Model ${model} is not available`);
            }
        }
        
        // Update model status
        updateModelStatus(model, 'loading');
        
        // Format history for Ollama API
        const formattedHistory = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        // Add the current message
        formattedHistory.push({
            role: 'user',
            content: message
        });
        
        const response = await fetch(`${ollamaEndpoint}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: formattedHistory,
                stream: false
            })
        });
        
        if (!response.ok) {
            updateModelStatus(model, 'error');
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update model status
        updateModelStatus(model, 'ready');
        
        return data.message.content;
    } catch (error) {
        console.error('Error sending message to Ollama:', error);
        updateModelStatus(model, 'error');
        showNotification(`Failed to communicate with Ollama: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Check if a specific model is available
 * @param {string} modelName - The name of the model to check
 * @returns {Promise<boolean>} True if the model is available
 */
export async function checkModelAvailability(modelName) {
    try {
        const models = await getOllamaModels();
        return models.some(model => model.name === modelName);
    } catch (error) {
        console.error('Error checking model availability:', error);
        return false;
    }
}

/**
 * Update the model status indicator
 * @param {string} model - The model name
 * @param {string} status - The status (loading, ready, error)
 */
function updateModelStatus(model, status) {
    modelLoadingStatus[model] = status;
    
    const statusIndicator = document.querySelector('.llm-model-status-indicator');
    const statusText = document.querySelector('.llm-model-status span');
    
    if (statusIndicator && statusText) {
        switch (status) {
            case 'loading':
                statusIndicator.className = 'llm-model-status-indicator loading';
                statusText.textContent = `Loading ${model}...`;
                break;
            case 'ready':
                statusIndicator.className = 'llm-model-status-indicator';
                statusText.textContent = `${model} ready`;
                break;
            case 'error':
                statusIndicator.className = 'llm-model-status-indicator error';
                statusText.textContent = `Error loading ${model}`;
                break;
        }
    }
    
    // Also update the model item in the list if it exists
    const modelItems = document.querySelectorAll('.llm-model-item');
    modelItems.forEach(item => {
        const nameElement = item.querySelector('.llm-model-name');
        if (nameElement && nameElement.textContent === model) {
            const statusDot = item.querySelector('.llm-model-status-dot');
            if (statusDot) {
                statusDot.className = `llm-model-status-dot ${status === 'loading' ? 'downloading' : status === 'error' ? 'error' : ''}`;
            }
        }
    });
}

/**
 * Check if Ollama is available
 * @returns {Promise<boolean>} True if Ollama is available
 */
export async function checkOllamaAvailability() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(`${ollamaEndpoint}/tags`, { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
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
    
    const modelList = modelContainer.querySelector('.llm-model-list');
    if (!modelList) return;
    
    try {
        // Check if Ollama is available
        const isAvailable = await checkOllamaAvailability();
        
        if (!isAvailable) {
            modelList.innerHTML = `
                <div class="llm-model-empty">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Could not connect to Ollama. Please make sure Ollama is running and try again.</p>
                    <div class="llm-model-empty-actions">
                        <button id="ollama-retry" class="fusion-button small">Retry</button>
                    </div>
                </div>
            `;
            
            // Add retry button event listener
            const retryButton = document.getElementById('ollama-retry');
            if (retryButton) {
                retryButton.addEventListener('click', initializeOllamaUI);
            }
            
            return;
        }
        
        // Show loading state
        modelList.innerHTML = `
            <div class="llm-model-loading">
                <div class="llm-model-loading-spinner"></div>
            </div>
        `;
        
        // Get available models
        const models = await getOllamaModels(true); // Force refresh
        
        if (models.length === 0) {
            modelList.innerHTML = `
                <div class="llm-model-empty">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No models found in Ollama. Please pull a model and try again.</p>
                    <div class="llm-model-empty-actions">
                        <button id="ollama-pull-now" class="fusion-button small">Pull Model</button>
                        <button id="ollama-retry-empty" class="fusion-button small secondary">Retry</button>
                    </div>
                </div>
            `;
            
            // Add pull button event listener
            const pullButton = document.getElementById('ollama-pull-now');
            if (pullButton) {
                pullButton.addEventListener('click', () => {
                    promptPullModel();
                });
            }
            
            // Add retry button event listener
            const retryButton = document.getElementById('ollama-retry-empty');
            if (retryButton) {
                retryButton.addEventListener('click', initializeOllamaUI);
            }
            
            return;
        }
        
        // Create model selection UI
        let modelHTML = '';
        
        models.forEach((model, index) => {
            const statusClass = modelLoadingStatus[model.name] === 'loading' ? 'downloading' : 
                               modelLoadingStatus[model.name] === 'error' ? 'error' : '';
            
            modelHTML += `
                <div class="llm-model-item ${index === 0 ? 'selected' : ''}">
                    <input type="radio" id="ollama-model-${index}" name="ollama-model" value="${model.name}" class="llm-model-radio" ${index === 0 ? 'checked' : ''}>
                    <div class="llm-model-info">
                        <label for="ollama-model-${index}" class="llm-model-name">${model.name}</label>
                        <div class="llm-model-description">${model.description}</div>
                    </div>
                    <div class="llm-model-details">
                        ${model.parameters ? `<div class="llm-model-size">${model.parameters}</div>` : ''}
                        <div class="llm-model-status-dot ${statusClass}"></div>
                    </div>
                </div>
            `;
        });
        
        modelList.innerHTML = modelHTML;
        
        // Add event listeners to model items
        const modelItems = modelList.querySelectorAll('.llm-model-item');
        modelItems.forEach(item => {
            item.addEventListener('click', () => {
                // Find the radio input and check it
                const radio = item.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    
                    // Update selected class
                    modelItems.forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    
                    // Update model status display
                    const modelName = radio.value;
                    const status = modelLoadingStatus[modelName] || 'ready';
                    updateModelStatus(modelName, status);
                }
            });
        });
        
        // Set up model search
        setupModelSearch();
        
        // Set up refresh button
        const refreshButton = document.getElementById('ollama-refresh-button');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                // Add a subtle animation to indicate refresh
                refreshButton.classList.add('refreshing');
                setTimeout(() => refreshButton.classList.remove('refreshing'), 1000);
                
                initializeOllamaUI();
            });
        }
        
        // Set up pull button
        const pullButton = document.getElementById('ollama-pull-button');
        if (pullButton) {
            pullButton.addEventListener('click', promptPullModel);
        }
        
        showNotification('Connected to Ollama successfully', 'success');
    } catch (error) {
        console.error('Error initializing Ollama UI:', error);
        
        modelList.innerHTML = `
            <div class="llm-model-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error connecting to Ollama: ${error.message}</p>
                <div class="llm-model-empty-actions">
                    <button id="ollama-retry-error" class="fusion-button small">Retry</button>
                </div>
            </div>
        `;
        
        // Add retry button event listener
        const retryButton = document.getElementById('ollama-retry-error');
        if (retryButton) {
            retryButton.addEventListener('click', initializeOllamaUI);
        }
    }
}

/**
 * Set up model search functionality
 */
function setupModelSearch() {
    const searchInput = document.querySelector('#ollama-model-container .llm-model-search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const modelItems = document.querySelectorAll('#ollama-model-container .llm-model-item');
        
        modelItems.forEach(item => {
            const modelName = item.querySelector('.llm-model-name').textContent.toLowerCase();
            const modelDesc = item.querySelector('.llm-model-description').textContent.toLowerCase();
            
            if (modelName.includes(query) || modelDesc.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });
    
    // Clear search when clicking the X button
    const searchClear = document.querySelector('#ollama-model-container .llm-model-search-clear');
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.focus();
        });
    }
}

/**
 * Prompt user to pull a model from Ollama
 */
function promptPullModel() {
    // Create a modal dialog instead of using prompt()
    const modal = document.createElement('div');
    modal.className = 'fusion-modal';
    modal.innerHTML = `
        <div class="fusion-modal-content">
            <div class="fusion-modal-header">
                <h3>Pull Ollama Model</h3>
                <button class="fusion-modal-close">&times;</button>
            </div>
            <div class="fusion-modal-body">
                <div class="fusion-form-group">
                    <label for="model-name">Model Name</label>
                    <input type="text" id="model-name" class="fusion-input" placeholder="e.g., llama3, mistral, phi3">
                </div>
                <div class="fusion-model-suggestions">
                    <div class="fusion-model-suggestion" data-model="llama3">llama3</div>
                    <div class="fusion-model-suggestion" data-model="mistral">mistral</div>
                    <div class="fusion-model-suggestion" data-model="phi3">phi3</div>
                    <div class="fusion-model-suggestion" data-model="gemma:7b">gemma:7b</div>
                </div>
            </div>
            <div class="fusion-modal-footer">
                <button class="fusion-button fusion-button-secondary" id="cancel-pull">Cancel</button>
                <button class="fusion-button fusion-button-primary" id="confirm-pull">Pull Model</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus the input
    setTimeout(() => {
        document.getElementById('model-name').focus();
    }, 100);
    
    // Close button
    const closeButton = modal.querySelector('.fusion-modal-close');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Cancel button
    const cancelButton = document.getElementById('cancel-pull');
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Confirm button
    const confirmButton = document.getElementById('confirm-pull');
    confirmButton.addEventListener('click', () => {
        const modelName = document.getElementById('model-name').value;
        if (modelName) {
            pullOllamaModel(modelName);
            document.body.removeChild(modal);
        } else {
            // Show validation error
            document.getElementById('model-name').classList.add('fusion-input-error');
        }
    });
    
    // Model suggestions
    const suggestions = document.querySelectorAll('.fusion-model-suggestion');
    suggestions.forEach(suggestion => {
        suggestion.addEventListener('click', () => {
            const modelName = suggestion.dataset.model;
            document.getElementById('model-name').value = modelName;
            document.getElementById('model-name').classList.remove('fusion-input-error');
        });
    });
    
    // Enter key in input
    const nameInput = document.getElementById('model-name');
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            confirmButton.click();
        }
    });
    
    // Remove error class on input
    nameInput.addEventListener('input', () => {
        nameInput.classList.remove('fusion-input-error');
    });
    
    // Close on escape key
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', escHandler);
        }
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

/**
 * Pull a model from Ollama
 * @param {string} model - The model to pull
 * @returns {Promise<boolean>} True if successful
 */
export async function pullOllamaModel(model) {
    try {
        showNotification(`Pulling model: ${model}...`, 'info');
        
        // Update model status
        updateModelStatus(model, 'loading');
        
        // Create a progress modal
        const modal = document.createElement('div');
        modal.className = 'fusion-modal';
        modal.innerHTML = `
            <div class="fusion-modal-content">
                <div class="fusion-modal-header">
                    <h3>Pulling Model: ${model}</h3>
                </div>
                <div class="fusion-modal-body">
                    <div class="fusion-progress">
                        <div class="fusion-progress-bar" style="width: 0%"></div>
                    </div>
                    <div class="fusion-progress-status">Initializing...</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Start the pull process
        const response = await fetch(`${ollamaEndpoint}/pull`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: model })
        });
        
        if (!response.ok) {
            document.body.removeChild(modal);
            updateModelStatus(model, 'error');
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Process the stream to update progress
        const reader = response.body.getReader();
        let receivedLength = 0;
        let chunks = [];
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }
            
            chunks.push(value);
            receivedLength += value.length;
            
            // Try to parse the chunk as JSON
            try {
                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    const data = JSON.parse(line);
                    
                    if (data.status) {
                        const progressStatus = document.querySelector('.fusion-progress-status');
                        if (progressStatus) {
                            progressStatus.textContent = data.status;
                        }
                    }
                    
                    if (data.completed !== undefined && data.total !== undefined) {
                        const percent = Math.round((data.completed / data.total) * 100);
                        const progressBar = document.querySelector('.fusion-progress-bar');
                        if (progressBar) {
                            progressBar.style.width = `${percent}%`;
                        }
                    }
                }
            } catch (e) {
                // Ignore parsing errors for partial chunks
            }
        }
        
        // Remove the progress modal
        document.body.removeChild(modal);
        
        showNotification(`Successfully pulled model: ${model}`, 'success');
        
        // Refresh the model list
        initializeOllamaUI();
        
        return true;
    } catch (error) {
        console.error('Error pulling Ollama model:', error);
        showNotification(`Error pulling model: ${error.message}`, 'error');
        updateModelStatus(model, 'error');
        
        // Remove any progress modal if it exists
        const modal = document.querySelector('.fusion-modal');
        if (modal) {
            document.body.removeChild(modal);
        }
        
        return false;
    }
}

/**
 * Get the currently selected model
 * @returns {string} The selected model name
 */
export function getSelectedModel() {
    const selectedRadio = document.querySelector('input[name="ollama-model"]:checked');
    return selectedRadio ? selectedRadio.value : 'llama3';
}

/**
 * Get model status
 * @param {string} model - The model name
 * @returns {string} The model status (loading, ready, error)
 */
export function getModelStatus(model) {
    return modelLoadingStatus[model] || 'ready';
}
