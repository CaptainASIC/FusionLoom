// FusionLoom v0.2 - Modals Module

import { showNotification } from './notifications.js';
import { updateConnectionStatus } from './endpoints.js';
import { checkEndpointReachability } from './endpoints.js';

/**
 * Show the about modal
 */
export function showAboutModal() {
    const modal = document.querySelector('.fusion-modal');
    if (modal) {
        // Ensure the modal inherits the current theme before displaying
        const currentTheme = document.documentElement.className.match(/theme-([a-z]+)/);
        if (currentTheme && currentTheme[1]) {
            console.log('Modal using theme:', currentTheme[1]);
        }
        modal.style.display = 'flex';
    }
}

/**
 * Hide the about modal
 */
export function hideAboutModal() {
    const modal = document.querySelector('.fusion-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Show the add endpoint modal
 */
export function showAddEndpointModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('add-endpoint-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'add-endpoint-modal';
        modal.className = 'fusion-modal';
        
        modal.innerHTML = `
            <div class="fusion-modal-content">
                <div class="fusion-modal-header">
                    <h2 class="fusion-modal-title">Add New Endpoint</h2>
                    <button class="fusion-modal-close" onclick="hideAddEndpointModal()">&times;</button>
                </div>
                <div class="fusion-modal-body">
                    <div class="fusion-setting-item">
                        <label for="endpoint-type">Endpoint Type</label>
                        <select id="endpoint-type" name="endpoint-type" onchange="updateEndpointForm()">
                            <option value="llm">LLM Service</option>
                            <option value="image">Image Generation</option>
                            <option value="speech">Speech Service</option>
                        </select>
                    </div>
                    <div class="fusion-setting-item">
                        <label for="endpoint-subtype" id="endpoint-subtype-label">LLM Type</label>
                        <select id="endpoint-subtype" name="endpoint-subtype">
                            <option value="custom">Custom LLM</option>
                            <option value="openai">OpenAI Compatible</option>
                            <option value="anthropic">Anthropic Compatible</option>
                            <option value="google">Google AI</option>
                            <option value="ollama">Ollama</option>
                        </select>
                    </div>
                    <div class="fusion-setting-item">
                        <label for="endpoint-name">Service Name</label>
                        <input type="text" id="endpoint-name" placeholder="Enter service name" value="Custom LLM">
                    </div>
                    <div class="fusion-setting-item">
                        <label for="endpoint-url">Endpoint URL</label>
                        <input type="text" id="endpoint-url" placeholder="Enter endpoint URL" value="http://localhost:8000/v1">
                    </div>
                    <div class="fusion-setting-item">
                        <label for="endpoint-key">API Key (Optional)</label>
                        <input type="password" id="endpoint-key" placeholder="Enter API key if required">
                    </div>
                </div>
                <div class="fusion-modal-footer">
                    <button class="fusion-button" onclick="addEndpoint()">Add Endpoint</button>
                    <button class="fusion-button secondary" onclick="hideAddEndpointModal()">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Initialize the form based on the default type
    updateEndpointForm();
}

/**
 * Hide the add endpoint modal
 */
export function hideAddEndpointModal() {
    const modal = document.getElementById('add-endpoint-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Update the endpoint form based on the selected type
 */
export function updateEndpointForm() {
    const type = document.getElementById('endpoint-type').value;
    const subtypeLabel = document.getElementById('endpoint-subtype-label');
    const subtypeSelect = document.getElementById('endpoint-subtype');
    const nameInput = document.getElementById('endpoint-name');
    
    // Clear existing options
    subtypeSelect.innerHTML = '';
    
    // Update subtype options based on type
    switch (type) {
        case 'llm':
            subtypeLabel.textContent = 'LLM Type';
            
            // Add LLM-specific options
            const llmOptions = [
                { value: 'custom', text: 'Custom LLM' },
                { value: 'openai', text: 'OpenAI Compatible' },
                { value: 'anthropic', text: 'Anthropic Compatible' },
                { value: 'google', text: 'Google AI' },
                { value: 'ollama', text: 'Ollama' }
            ];
            
            llmOptions.forEach(option => {
                const optElement = document.createElement('option');
                optElement.value = option.value;
                optElement.textContent = option.text;
                subtypeSelect.appendChild(optElement);
            });
            
            nameInput.value = 'Custom LLM';
            break;
            
        case 'image':
            subtypeLabel.textContent = 'Image Generation Type';
            
            // Add image generation options
            const imageOptions = [
                { value: 'custom', text: 'Custom Image Generator' },
                { value: 'sd', text: 'Stable Diffusion' },
                { value: 'dalle', text: 'DALL-E Compatible' },
                { value: 'midjourney', text: 'Midjourney' }
            ];
            
            imageOptions.forEach(option => {
                const optElement = document.createElement('option');
                optElement.value = option.value;
                optElement.textContent = option.text;
                subtypeSelect.appendChild(optElement);
            });
            
            nameInput.value = 'Custom Image Generator';
            break;
            
        case 'speech':
            subtypeLabel.textContent = 'Speech Service Type';
            
            // Add speech service options
            const speechOptions = [
                { value: 'custom', text: 'Custom Speech Service' },
                { value: 'tts', text: 'Text-to-Speech' },
                { value: 'stt', text: 'Speech-to-Text' },
                { value: 'openai', text: 'OpenAI Audio' }
            ];
            
            speechOptions.forEach(option => {
                const optElement = document.createElement('option');
                optElement.value = option.value;
                optElement.textContent = option.text;
                subtypeSelect.appendChild(optElement);
            });
            
            nameInput.value = 'Custom Speech Service';
            break;
    }
    
    // Add event listener to update name when subtype changes
    subtypeSelect.addEventListener('change', function() {
        const subtype = this.value;
        if (subtype === 'custom') {
            switch (type) {
                case 'llm':
                    nameInput.value = 'Custom LLM';
                    break;
                case 'image':
                    nameInput.value = 'Custom Image Generator';
                    break;
                case 'speech':
                    nameInput.value = 'Custom Speech Service';
                    break;
            }
        } else {
            // Find the selected option text
            const selectedOption = Array.from(this.options).find(opt => opt.value === subtype);
            if (selectedOption) {
                nameInput.value = selectedOption.textContent;
            }
        }
    });
}

/**
 * Add a new endpoint
 */
export function addEndpoint() {
    // Get values from the modal
    const type = document.getElementById('endpoint-type').value;
    const subtype = document.getElementById('endpoint-subtype').value;
    const name = document.getElementById('endpoint-name').value;
    const url = document.getElementById('endpoint-url').value;
    const key = document.getElementById('endpoint-key').value;
    
    // Validate inputs
    if (!name || !url) {
        showNotification('Service name and URL are required', 'error');
        return;
    }
    
    // Find the appropriate section based on type
    let sectionIcon, sectionName;
    
    switch (type) {
        case 'llm':
            sectionIcon = 'fa-robot';
            sectionName = 'LLM Services';
            break;
        case 'image':
            sectionIcon = 'fa-image';
            sectionName = 'Image Generation';
            break;
        case 'speech':
            sectionIcon = 'fa-headphones';
            sectionName = 'Speech Services';
            break;
        default:
            showNotification('Invalid endpoint type', 'error');
            return;
    }
    
    // Find the section header
    const sectionHeader = Array.from(document.querySelectorAll('.section-header')).find(
        header => header.textContent.includes(sectionName)
    );
    
    if (!sectionHeader) {
        showNotification(`Could not find ${sectionName} section`, 'error');
        return;
    }
    
    const sectionRow = sectionHeader.closest('tr');
    if (!sectionRow) {
        showNotification(`Could not find ${sectionName} section row`, 'error');
        return;
    }
    
    // Generate a unique ID for the endpoint
    const timestamp = Date.now();
    const endpointId = `${type}_${timestamp}`;
    
    // Create a new row
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" value="${name}" class="name-input" readonly></td>
        <td><input type="text" id="${endpointId}_api" value="${url}" class="endpoint-input" readonly></td>
        <td><input type="password" id="${endpointId}_key" value="${key}" placeholder="Optional" class="key-input" readonly></td>
        <td><span class="status-indicator offline" onclick="toggleEndpointStatus(this)"></span></td>
        <td class="endpoint-actions">
            <button class="endpoint-action-btn edit" title="Edit" onclick="toggleEditMode(this)">
                <i class="fas fa-edit"></i>
            </button>
            <button class="endpoint-action-btn save" title="Save" onclick="saveEndpointChanges(this)" style="display: none;">
                <i class="fas fa-save"></i>
            </button>
            <button class="endpoint-action-btn cancel" title="Cancel" onclick="cancelEndpointEdit(this)" style="display: none;">
                <i class="fas fa-times"></i>
            </button>
            <button class="endpoint-action-btn delete" title="Delete" onclick="confirmDeleteEndpoint(this, '${name}')">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;
    
    // Insert after the section header
    sectionRow.parentNode.insertBefore(newRow, sectionRow.nextSibling);
    
    // Update connection status
    updateConnectionStatus();
    
    // Hide the modal
    hideAddEndpointModal();
    
    // Show success message
    showNotification(`New ${sectionName.slice(0, -1)} endpoint added`, 'success');
}

/**
 * Confirm deletion of an endpoint
 * @param {HTMLElement} button - The delete button
 * @param {string} serviceName - The name of the service to delete
 */
export function confirmDeleteEndpoint(button, serviceName) {
    // Create a modal for delete confirmation
    let modal = document.createElement('div');
    modal.className = 'fusion-modal';
    
    modal.innerHTML = `
        <div class="fusion-modal-content">
            <div class="fusion-modal-header">
                <h2 class="fusion-modal-title">Confirm Deletion</h2>
                <button class="fusion-modal-close" onclick="this.closest('.fusion-modal').remove()">&times;</button>
            </div>
            <div class="fusion-modal-body">
                <p>Are you sure you want to delete the entry '${serviceName}'?</p>
            </div>
            <div class="fusion-modal-footer">
                <button class="fusion-button" id="confirm-delete-btn">Delete</button>
                <button class="fusion-button secondary" onclick="this.closest('.fusion-modal').remove()">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Set up event listener for the confirm button
    const confirmBtn = document.getElementById('confirm-delete-btn');
    if (confirmBtn) {
        confirmBtn.onclick = function() {
            // Get the row and remove it
            const row = button.closest('tr');
            if (row) {
                row.remove();
                showNotification(`Endpoint '${serviceName}' deleted`, 'success');
            }
            
            // Remove the modal
            modal.remove();
        };
    }
}

/**
 * Toggle endpoint status (enable/disable)
 * @param {HTMLElement} statusIndicator - The status indicator element
 */
export function toggleEndpointStatus(statusIndicator) {
    // Get the service name
    const row = statusIndicator.closest('tr');
    const nameInput = row.querySelector('.name-input');
    const serviceName = nameInput ? nameInput.value : 'this service';
    
    // Create status toggle modal if it doesn't exist
    let modal = document.getElementById('status-toggle-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'status-toggle-modal';
        modal.className = 'fusion-modal';
        
        modal.innerHTML = `
            <div class="fusion-modal-content">
                <div class="fusion-modal-header">
                    <h2 class="fusion-modal-title">Endpoint Status</h2>
                    <button class="fusion-modal-close" onclick="hideStatusToggleModal()">&times;</button>
                </div>
                <div class="fusion-modal-body">
                    <p id="status-toggle-message">Do you want to enable or disable this endpoint?</p>
                    <div class="fusion-button-group">
                        <button class="fusion-button" id="enable-endpoint-btn">Enable</button>
                        <button class="fusion-button secondary" id="disable-endpoint-btn">Disable</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Update the message
    const message = document.getElementById('status-toggle-message');
    if (message) {
        message.textContent = `Do you want to enable or disable '${serviceName}'?`;
    }
    
    // Set up event listeners for the buttons
    const enableBtn = document.getElementById('enable-endpoint-btn');
    const disableBtn = document.getElementById('disable-endpoint-btn');
    
    if (enableBtn) {
        enableBtn.onclick = function() {
            // Enable the endpoint
            statusIndicator.classList.remove('disabled');
            
            // Set to offline initially until reachability is checked
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
            
            // Check if the endpoint is reachable
            const endpointInput = row.querySelector('input.endpoint-input');
            if (endpointInput) {
                // Create a single endpoint object for reachability checking
                const endpoint = {};
                endpoint[serviceName] = {
                    indicator: statusIndicator,
                    urlInput: endpointInput
                };
                
                // Check reachability
                checkEndpointReachability(endpoint);
            }
            
            // Hide the modal
            hideStatusToggleModal();
            
            // Show success message
            showNotification(`Endpoint '${serviceName}' enabled`, 'success');
        };
    }
    
    if (disableBtn) {
        disableBtn.onclick = function() {
            // Disable the endpoint
            statusIndicator.classList.remove('online', 'offline');
            statusIndicator.classList.add('disabled');
            
            // Hide the modal
            hideStatusToggleModal();
            
            // Show success message
            showNotification(`Endpoint '${serviceName}' disabled`, 'info');
        };
    }
    
    // Show the modal
    modal.style.display = 'flex';
}

/**
 * Hide the status toggle modal
 */
export function hideStatusToggleModal() {
    const modal = document.getElementById('status-toggle-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Toggle edit mode for an endpoint
 * @param {HTMLElement} button - The edit button
 */
export function toggleEditMode(button) {
    const row = button.closest('tr');
    if (!row) return;
    
    // Get the inputs
    const nameInput = row.querySelector('.name-input');
    const endpointInput = row.querySelector('.endpoint-input');
    const keyInput = row.querySelector('.key-input');
    
    // Toggle readonly attribute
    nameInput.readOnly = !nameInput.readOnly;
    endpointInput.readOnly = !endpointInput.readOnly;
    keyInput.readOnly = !keyInput.readOnly;
    
    // Toggle edit/save/cancel buttons
    const editBtn = row.querySelector('.edit');
    const saveBtn = row.querySelector('.save');
    const cancelBtn = row.querySelector('.cancel');
    
    if (editBtn) editBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'inline-block';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    
    // Store original values for cancel
    if (!nameInput.dataset.original) {
        nameInput.dataset.original = nameInput.value;
        endpointInput.dataset.original = endpointInput.value;
        keyInput.dataset.original = keyInput.value;
    }
    
    // Focus on the name input
    nameInput.focus();
}

/**
 * Save endpoint changes
 * @param {HTMLElement} button - The save button
 */
export function saveEndpointChanges(button) {
    const row = button.closest('tr');
    if (!row) return;
    
    // Get the inputs
    const nameInput = row.querySelector('.name-input');
    const endpointInput = row.querySelector('.endpoint-input');
    const keyInput = row.querySelector('.key-input');
    
    // Make inputs readonly again
    nameInput.readOnly = true;
    endpointInput.readOnly = true;
    keyInput.readOnly = true;
    
    // Toggle edit/save/cancel buttons
    const editBtn = row.querySelector('.edit');
    const saveBtn = row.querySelector('.save');
    const cancelBtn = row.querySelector('.cancel');
    
    if (editBtn) editBtn.style.display = 'inline-block';
    if (saveBtn) saveBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    // Clear original values
    delete nameInput.dataset.original;
    delete endpointInput.dataset.original;
    delete keyInput.dataset.original;
    
    // Update delete button onclick to use the new name
    const deleteBtn = row.querySelector('.delete');
    if (deleteBtn) {
        deleteBtn.setAttribute('onclick', `confirmDeleteEndpoint(this, '${nameInput.value}')`);
    }
    
    // Show success message
    showNotification(`Endpoint '${nameInput.value}' updated`, 'success');
}

/**
 * Cancel endpoint edit
 * @param {HTMLElement} button - The cancel button
 */
export function cancelEndpointEdit(button) {
    const row = button.closest('tr');
    if (!row) return;
    
    // Get the inputs
    const nameInput = row.querySelector('.name-input');
    const endpointInput = row.querySelector('.endpoint-input');
    const keyInput = row.querySelector('.key-input');
    
    // Restore original values
    if (nameInput.dataset.original) {
        nameInput.value = nameInput.dataset.original;
        endpointInput.value = endpointInput.dataset.original;
        keyInput.value = keyInput.dataset.original;
        
        // Clear original values
        delete nameInput.dataset.original;
        delete endpointInput.dataset.original;
        delete keyInput.dataset.original;
    }
    
    // Make inputs readonly again
    nameInput.readOnly = true;
    endpointInput.readOnly = true;
    keyInput.readOnly = true;
    
    // Toggle edit/save/cancel buttons
    const editBtn = row.querySelector('.edit');
    const saveBtn = row.querySelector('.save');
    const cancelBtn = row.querySelector('.cancel');
    
    if (editBtn) editBtn.style.display = 'inline-block';
    if (saveBtn) saveBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
}
