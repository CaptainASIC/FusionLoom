// FusionLoom v0.3 - LLM UI Module
// Handles UI components and interactions for the LLM page

import { initializeChat, setProvider } from './chat.js';
import { showNotification } from '../../modules/notifications.js';

// Current active provider
let activeProvider = null;
let systemTheme = 'dark'; // Default theme

/**
 * Initialize the LLM UI
 */
export function initializeLLMUI() {
    detectSystemTheme();
    setupServiceTabs();
    setupLocalServicesTabs();
    setupSidebarToggles();
    setupWelcomeSuggestions();
    setupKeyboardShortcuts();
    setupAnimationPreferences();
    
    // Default to Ollama provider
    switchProvider('ollama');
}

/**
 * Detect system theme preference
 */
function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        systemTheme = 'light';
        document.body.classList.add('light-theme');
    } else {
        systemTheme = 'dark';
        document.body.classList.add('dark-theme');
    }
    
    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
        if (e.matches) {
            systemTheme = 'light';
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        } else {
            systemTheme = 'dark';
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
        }
    });
}

/**
 * Set up service tabs
 */
function setupServiceTabs() {
    const serviceTabs = document.querySelectorAll('.llm-service-tab');
    
    serviceTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Add subtle feedback animation
            tab.classList.add('tab-click-effect');
            setTimeout(() => tab.classList.remove('tab-click-effect'), 300);
            
            // Remove active class from all tabs
            serviceTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Get provider from data attribute
            const provider = tab.dataset.provider;
            
            // Switch to the selected provider
            switchProvider(provider);
            
            // Update dropdown items
            updateDropdownItems();
        });
    });
    
    // Set up tab navigation arrows
    const leftNav = document.querySelector('.llm-service-tabs-nav.left');
    const rightNav = document.querySelector('.llm-service-tabs-nav.right');
    const tabsContainer = document.querySelector('.llm-service-tabs');
    
    if (leftNav && tabsContainer) {
        leftNav.addEventListener('click', () => {
            tabsContainer.scrollBy({ left: -200, behavior: 'smooth' });
        });
    }
    
    if (rightNav && tabsContainer) {
        rightNav.addEventListener('click', () => {
            tabsContainer.scrollBy({ left: 200, behavior: 'smooth' });
        });
    }
    
    // Set up more button and dropdown
    const moreButton = document.getElementById('llm-service-more');
    const dropdown = document.getElementById('llm-service-dropdown');
    
    if (moreButton && dropdown) {
        moreButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            updateDropdownItems();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
        
        // Prevent dropdown from closing when clicking inside
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Set up dropdown items
        const dropdownItems = document.querySelectorAll('.llm-service-dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', () => {
                const provider = item.dataset.provider;
                
                // Update service tabs
                serviceTabs.forEach(tab => {
                    if (tab.dataset.provider === provider) {
                        tab.click();
                    }
                });
                
                // Hide dropdown
                dropdown.classList.remove('show');
            });
        });
    }
    
    // Update tab status indicators
    updateServiceTabStatus();
}

/**
 * Update dropdown items to reflect active provider
 */
function updateDropdownItems() {
    const dropdownItems = document.querySelectorAll('.llm-service-dropdown-item');
    
    dropdownItems.forEach(item => {
        if (item.dataset.provider === activeProvider) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * Update service tab status indicators
 */
function updateServiceTabStatus() {
    // This would typically check the status of each service
    // For now, we'll just set Ollama to online and others to offline
    
    // Check Ollama status
    fetch('http://localhost:11434/api/tags', { 
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        const ollamaStatus = document.querySelector('.llm-service-tab[data-provider="ollama"] .llm-service-tab-status');
        if (ollamaStatus) {
            if (response.ok) {
                ollamaStatus.className = 'llm-service-tab-status online';
            } else {
                ollamaStatus.className = 'llm-service-tab-status offline';
            }
        }
    })
    .catch(() => {
        const ollamaStatus = document.querySelector('.llm-service-tab[data-provider="ollama"] .llm-service-tab-status');
        if (ollamaStatus) {
            ollamaStatus.className = 'llm-service-tab-status offline';
        }
    });
    
    // Check other services based on API keys
    const anthropicKey = localStorage.getItem('anthropic_key');
    const claudeStatus = document.querySelector('.llm-service-tab[data-provider="claude"] .llm-service-tab-status');
    if (claudeStatus) {
        claudeStatus.className = anthropicKey ? 'llm-service-tab-status online' : 'llm-service-tab-status offline';
    }
    
    const openaiKey = localStorage.getItem('openai_key');
    const chatgptStatus = document.querySelector('.llm-service-tab[data-provider="chatgpt"] .llm-service-tab-status');
    if (chatgptStatus) {
        chatgptStatus.className = openaiKey ? 'llm-service-tab-status online' : 'llm-service-tab-status offline';
    }
    
    const geminiKey = localStorage.getItem('gemini_key');
    const geminiStatus = document.querySelector('.llm-service-tab[data-provider="gemini"] .llm-service-tab-status');
    if (geminiStatus) {
        geminiStatus.className = geminiKey ? 'llm-service-tab-status online' : 'llm-service-tab-status offline';
    }
}

/**
 * Set up local services tabs
 */
function setupLocalServicesTabs() {
    const localServicesContainer = document.getElementById('local-services-container');
    if (!localServicesContainer) return;
    
    // Add tab button
    const addTabButton = document.getElementById('add-local-service-tab');
    if (addTabButton) {
        addTabButton.addEventListener('click', () => {
            promptAddLocalService();
        });
    }
    
    // Close tab buttons
    const closeButtons = document.querySelectorAll('.local-service-tab-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const tabId = button.closest('.local-service-tab').dataset.tabId;
            removeLocalServiceTab(tabId);
        });
    });
    
    // Tab clicks
    const tabs = document.querySelectorAll('.local-service-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tabId;
            activateLocalServiceTab(tabId);
        });
    });
    
    // Load saved tabs
    loadLocalServiceTabs();
}

/**
 * Set up sidebar toggles
 */
function setupSidebarToggles() {
    const sidebarToggles = document.querySelectorAll('.llm-sidebar-toggle');
    
    sidebarToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const sidebar = toggle.closest('.llm-sidebar');
            if (sidebar) {
                sidebar.classList.toggle('llm-sidebar-collapsed');
                
                // Update toggle icon
                const icon = toggle.querySelector('i');
                if (icon) {
                    if (sidebar.classList.contains('llm-sidebar-collapsed')) {
                        icon.className = 'fas fa-chevron-right';
                    } else {
                        icon.className = 'fas fa-chevron-left';
                    }
                }
            }
        });
    });
}

/**
 * Set up welcome suggestions
 */
function setupWelcomeSuggestions() {
    const suggestions = document.querySelectorAll('.llm-welcome-suggestion');
    
    suggestions.forEach(suggestion => {
        suggestion.addEventListener('click', () => {
            const messageInput = document.getElementById('llm-message-input');
            const sendButton = document.getElementById('llm-send-button');
            
            if (messageInput && sendButton) {
                messageInput.value = suggestion.textContent;
                sendButton.click();
            }
        });
    });
}

/**
 * Set up keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Cmd/Ctrl+Enter to send message
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            const sendButton = document.getElementById('llm-send-button');
            if (sendButton) {
                sendButton.click();
                e.preventDefault();
            }
        }
        
        // Cmd/Ctrl+1-4 to switch providers
        if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '4') {
            const providerIndex = parseInt(e.key) - 1;
            const providers = ['ollama', 'claude', 'chatgpt', 'gemini'];
            
            if (providerIndex < providers.length) {
                const tab = document.querySelector(`.llm-service-tab[data-provider="${providers[providerIndex]}"]`);
                if (tab) {
                    tab.click();
                    e.preventDefault();
                }
            }
        }
        
        // Escape to close dropdowns
        if (e.key === 'Escape') {
            const dropdown = document.getElementById('llm-service-dropdown');
            if (dropdown && dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                e.preventDefault();
            }
        }
    });
}

/**
 * Setup animation preferences
 */
function setupAnimationPreferences() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
    }
    
    // Listen for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
        if (e.matches) {
            document.body.classList.add('reduced-motion');
        } else {
            document.body.classList.remove('reduced-motion');
        }
    });
}

/**
 * Switch to a different LLM provider
 * @param {string} provider - The provider to switch to
 */
function switchProvider(provider) {
    if (provider === activeProvider) return;
    
    // Hide all provider containers with a smooth transition
    const providerContainers = document.querySelectorAll('.llm-provider-container');
    providerContainers.forEach(container => {
        container.classList.add('container-fade-out');
        setTimeout(() => {
            container.style.display = 'none';
            container.classList.remove('container-fade-out');
        }, 150);
    });
    
    // Show the selected provider container with a fade-in effect
    setTimeout(() => {
        const selectedContainer = document.getElementById(`${provider}-container`);
        if (selectedContainer) {
            selectedContainer.style.display = 'flex';
            selectedContainer.classList.add('container-fade-in');
            setTimeout(() => {
                selectedContainer.classList.remove('container-fade-in');
            }, 150);
        }
    }, 150);
    
    // Special handling for local services
    if (provider === 'local-services') {
        document.getElementById('local-services-container').style.display = 'block';
        
        // Activate the first tab if available
        const firstTab = document.querySelector('.local-service-tab');
        if (firstTab) {
            activateLocalServiceTab(firstTab.dataset.tabId);
        }
    } else {
        // Initialize chat for the selected provider
        initializeChat(provider);
    }
    
    activeProvider = provider;
    setProvider(provider);
    
    // Update chat title
    updateChatTitle(provider);
}

/**
 * Update chat title based on provider
 * @param {string} provider - The provider
 */
function updateChatTitle(provider) {
    const titleMap = {
        'ollama': 'Ollama',
        'claude': 'Claude',
        'chatgpt': 'ChatGPT',
        'gemini': 'Gemini'
    };
    
    const iconMap = {
        'ollama': 'fas fa-brain',
        'claude': 'fas fa-comment-dots',
        'chatgpt': 'fas fa-robot',
        'gemini': 'fas fa-star'
    };
    
    const titleElement = document.querySelector(`#${provider}-container .llm-chat-title span`);
    const iconElement = document.querySelector(`#${provider}-container .llm-chat-title i`);
    
    if (titleElement && titleMap[provider]) {
        titleElement.textContent = titleMap[provider];
    }
    
    if (iconElement && iconMap[provider]) {
        iconElement.className = iconMap[provider];
    }
}

/**
 * Prompt user to add a new local service
 */
function promptAddLocalService() {
    // Create a modal dialog instead of using prompt()
    const modal = document.createElement('div');
    modal.className = 'fusion-modal';
    modal.innerHTML = `
        <div class="fusion-modal-content">
            <div class="fusion-modal-header">
                <h3>Add Local Service</h3>
                <button class="fusion-modal-close">&times;</button>
            </div>
            <div class="fusion-modal-body">
                <div class="fusion-form-group">
                    <label for="service-name">Service Name</label>
                    <input type="text" id="service-name" class="fusion-input" placeholder="Enter a name for the service">
                </div>
                <div class="fusion-form-group">
                    <label for="service-url">Service URL</label>
                    <input type="text" id="service-url" class="fusion-input" placeholder="Enter the URL for the service">
                </div>
            </div>
            <div class="fusion-modal-footer">
                <button class="fusion-button fusion-button-secondary" id="cancel-service">Cancel</button>
                <button class="fusion-button fusion-button-primary" id="add-service">Add Service</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus the first input
    setTimeout(() => {
        document.getElementById('service-name').focus();
    }, 100);
    
    // Close button
    const closeButton = modal.querySelector('.fusion-modal-close');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Cancel button
    const cancelButton = document.getElementById('cancel-service');
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Add button
    const addButton = document.getElementById('add-service');
    addButton.addEventListener('click', () => {
        const name = document.getElementById('service-name').value;
        const url = document.getElementById('service-url').value;
        
        if (name && url) {
            addLocalServiceTab(name, url);
            document.body.removeChild(modal);
        } else {
            // Show validation error
            if (!name) {
                document.getElementById('service-name').classList.add('fusion-input-error');
            }
            if (!url) {
                document.getElementById('service-url').classList.add('fusion-input-error');
            }
        }
    });
    
    // Enter key in inputs
    const nameInput = document.getElementById('service-name');
    const urlInput = document.getElementById('service-url');
    
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            urlInput.focus();
        }
    });
    
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addButton.click();
        }
    });
    
    // Remove error class on input
    nameInput.addEventListener('input', () => {
        nameInput.classList.remove('fusion-input-error');
    });
    
    urlInput.addEventListener('input', () => {
        urlInput.classList.remove('fusion-input-error');
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
 * Add a new local service tab
 * @param {string} name - The name of the service
 * @param {string} url - The URL of the service
 */
export function addLocalServiceTab(name, url) {
    const tabsContainer = document.getElementById('local-services-tabs');
    if (!tabsContainer) return;
    
    // Generate a unique ID for the tab
    const tabId = 'tab-' + Date.now().toString(36);
    
    // Create tab element
    const tab = document.createElement('div');
    tab.className = 'local-service-tab';
    tab.dataset.tabId = tabId;
    tab.dataset.url = url;
    
    tab.innerHTML = `
        <span class="local-service-tab-name">${name}</span>
        <button class="local-service-tab-close">&times;</button>
    `;
    
    // Add click event to tab
    tab.addEventListener('click', () => {
        activateLocalServiceTab(tabId);
    });
    
    // Add click event to close button
    const closeButton = tab.querySelector('.local-service-tab-close');
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        removeLocalServiceTab(tabId);
    });
    
    // Add tab to container
    tabsContainer.insertBefore(tab, document.getElementById('add-local-service-tab'));
    
    // Create iframe for the service
    const contentContainer = document.getElementById('local-services-content');
    if (contentContainer) {
        const iframe = document.createElement('iframe');
        iframe.className = 'local-service-iframe';
        iframe.id = `iframe-${tabId}`;
        iframe.src = url;
        iframe.style.display = 'none';
        contentContainer.appendChild(iframe);
    }
    
    // Activate the new tab
    activateLocalServiceTab(tabId);
    
    // Save the tab to localStorage
    saveLocalServiceTabs();
    
    showNotification(`Added service: ${name}`, 'success');
}

/**
 * Activate a local service tab
 * @param {string} tabId - The ID of the tab to activate
 */
function activateLocalServiceTab(tabId) {
    // Deactivate all tabs
    const tabs = document.querySelectorAll('.local-service-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hide all iframes
    const iframes = document.querySelectorAll('.local-service-iframe');
    iframes.forEach(iframe => {
        iframe.style.display = 'none';
    });
    
    // Activate the selected tab
    const selectedTab = document.querySelector(`.local-service-tab[data-tab-id="${tabId}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Show the selected iframe
    const selectedIframe = document.getElementById(`iframe-${tabId}`);
    if (selectedIframe) {
        selectedIframe.style.display = 'block';
    }
}

/**
 * Remove a local service tab
 * @param {string} tabId - The ID of the tab to remove
 */
function removeLocalServiceTab(tabId) {
    // Remove the tab
    const tab = document.querySelector(`.local-service-tab[data-tab-id="${tabId}"]`);
    if (tab) {
        const name = tab.querySelector('.local-service-tab-name').textContent;
        
        // Create a confirmation modal instead of using confirm()
        const modal = document.createElement('div');
        modal.className = 'fusion-modal';
        modal.innerHTML = `
            <div class="fusion-modal-content">
                <div class="fusion-modal-header">
                    <h3>Confirm Removal</h3>
                    <button class="fusion-modal-close">&times;</button>
                </div>
                <div class="fusion-modal-body">
                    <p>Are you sure you want to remove the "${name}" service?</p>
                </div>
                <div class="fusion-modal-footer">
                    <button class="fusion-button fusion-button-secondary" id="cancel-remove">Cancel</button>
                    <button class="fusion-button fusion-button-danger" id="confirm-remove">Remove</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close button
        const closeButton = modal.querySelector('.fusion-modal-close');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Cancel button
        const cancelButton = document.getElementById('cancel-remove');
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Confirm button
        const confirmButton = document.getElementById('confirm-remove');
        confirmButton.addEventListener('click', () => {
            tab.remove();
            
            // Remove the iframe
            const iframe = document.getElementById(`iframe-${tabId}`);
            if (iframe) {
                iframe.remove();
            }
            
            // Activate another tab if available
            const firstTab = document.querySelector('.local-service-tab');
            if (firstTab) {
                activateLocalServiceTab(firstTab.dataset.tabId);
            }
            
            // Save the updated tabs
            saveLocalServiceTabs();
            
            showNotification(`Removed service: ${name}`, 'info');
            
            document.body.removeChild(modal);
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
}

/**
 * Save local service tabs to localStorage
 */
function saveLocalServiceTabs() {
    const tabs = document.querySelectorAll('.local-service-tab');
    const tabData = [];
    
    tabs.forEach(tab => {
        if (!tab.id || tab.id !== 'add-local-service-tab') {
            tabData.push({
                id: tab.dataset.tabId,
                name: tab.querySelector('.local-service-tab-name').textContent,
                url: tab.dataset.url
            });
        }
    });
    
    localStorage.setItem('fusionloom_local_service_tabs', JSON.stringify(tabData));
}

/**
 * Load local service tabs from localStorage
 */
export function loadLocalServiceTabs() {
    const tabsData = localStorage.getItem('fusionloom_local_service_tabs');
    
    if (tabsData) {
        const tabs = JSON.parse(tabsData);
        
        // Clear existing tabs except the add button
        const tabsContainer = document.getElementById('local-services-tabs');
        const addButton = document.getElementById('add-local-service-tab');
        
        if (tabsContainer && addButton) {
            // Keep only the add button
            tabsContainer.innerHTML = '';
            tabsContainer.appendChild(addButton);
            
            // Clear existing iframes
            const contentContainer = document.getElementById('local-services-content');
            if (contentContainer) {
                contentContainer.innerHTML = '';
            }
            
            // Add saved tabs
            tabs.forEach(tab => {
                addLocalServiceTab(tab.name, tab.url);
            });
        }
    }
}

/**
 * Get the current active provider
 * @returns {string} The current active provider
 */
export function getActiveProvider() {
    return activeProvider;
}
