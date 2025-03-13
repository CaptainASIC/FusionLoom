// FusionLoom v0.4 - LLM UI Module
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
export function updateServiceTabStatus() {
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
    
    // Check other services based on API keys from settings
    // First try to get settings from localStorage
    let settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
    
    // Then try to get settings from config.ini via API
    fetch('http://localhost:5052/api/settings')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load settings from config.ini');
            }
            return response.json();
        })
        .then(configSettings => {
            console.log('Loaded settings from config.ini:', configSettings);
            
            // Merge settings, with config.ini taking precedence
            settings = { ...settings, ...configSettings };
            
            // Update status indicators with merged settings
            updateStatusIndicators(settings);
            
            // Update provider modules with API keys
            updateProviderModules(settings);
        })
        .catch(error => {
            console.error('Error loading settings from config.ini:', error);
            console.log('Using settings from localStorage only');
            
            // Update status indicators with localStorage settings
            updateStatusIndicators(settings);
            
            // Update provider modules with API keys
            updateProviderModules(settings);
        });
    
    // Update status indicators with the given settings
    updateStatusIndicators(settings);
    
    // Update provider modules with API keys if they're set in settings
    const updateProviderModules = async () => {
        if (settings.anthropic_key) {
            try {
                const claudeModule = await import('./claude.js');
                claudeModule.setClaudeApiKey(settings.anthropic_key);
                if (settings.anthropic_api) {
                    claudeModule.setClaudeEndpoint(settings.anthropic_api + '/messages');
                }
            } catch (error) {
                console.error('Error updating Claude API key:', error);
            }
        }
        
        if (settings.openai_key) {
            try {
                const chatgptModule = await import('./chatgpt.js');
                chatgptModule.setOpenAIApiKey(settings.openai_key);
                if (settings.openai_api) {
                    chatgptModule.setOpenAIEndpoint(settings.openai_api + '/chat/completions');
                }
            } catch (error) {
                console.error('Error updating OpenAI API key:', error);
            }
        }
        
        if (settings.gemini_key) {
            try {
                const geminiModule = await import('./gemini.js');
                geminiModule.setGeminiApiKey(settings.gemini_key);
                if (settings.gemini_api) {
                    geminiModule.setGeminiEndpoint(settings.gemini_api);
                }
            } catch (error) {
                console.error('Error updating Gemini API key:', error);
            }
        }
    };
    
    // Update provider modules
    updateProviderModules();
}

/**
 * Update status indicators with the given settings
 * @param {Object} settings - The settings object containing API keys
 */
function updateStatusIndicators(settings) {
    const claudeStatus = document.querySelector('.llm-service-tab[data-provider="claude"] .llm-service-tab-status');
    if (claudeStatus) {
        claudeStatus.className = settings.anthropic_key ? 'llm-service-tab-status online' : 'llm-service-tab-status offline';
    }
    
    const chatgptStatus = document.querySelector('.llm-service-tab[data-provider="chatgpt"] .llm-service-tab-status');
    if (chatgptStatus) {
        chatgptStatus.className = settings.openai_key ? 'llm-service-tab-status online' : 'llm-service-tab-status offline';
    }
    
    const geminiStatus = document.querySelector('.llm-service-tab[data-provider="gemini"] .llm-service-tab-status');
    if (geminiStatus) {
        geminiStatus.className = settings.gemini_key ? 'llm-service-tab-status online' : 'llm-service-tab-status offline';
    }
    
    const grokStatus = document.querySelector('.llm-service-tab[data-provider="grok"] .llm-service-tab-status');
    if (grokStatus) {
        grokStatus.className = settings.grok_key ? 'llm-service-tab-status online' : 'llm-service-tab-status offline';
    }
    
    const openrouterStatus = document.querySelector('.llm-service-tab[data-provider="openrouter"] .llm-service-tab-status');
    if (openrouterStatus) {
        openrouterStatus.className = settings.openrouter_key ? 'llm-service-tab-status online' : 'llm-service-tab-status offline';
    }
    
    // Check SillyTavern, TavernAI, and Oobabooga status
    // These services don't require API keys, so we'll check their endpoints directly
    
    // SillyTavern
    fetch(settings.sillytavern_api || 'http://localhost:8000', { 
        method: 'HEAD',
        mode: 'no-cors'
    })
    .then(() => {
        const sillyTavernStatus = document.querySelector('.llm-service-tab[data-provider="sillytavern"] .llm-service-tab-status');
        if (sillyTavernStatus) {
            sillyTavernStatus.className = 'llm-service-tab-status online';
        }
    })
    .catch(() => {
        const sillyTavernStatus = document.querySelector('.llm-service-tab[data-provider="sillytavern"] .llm-service-tab-status');
        if (sillyTavernStatus) {
            sillyTavernStatus.className = 'llm-service-tab-status offline';
        }
    });
    
    // TavernAI
    fetch(settings.tavernai_api || 'http://localhost:8001', { 
        method: 'HEAD',
        mode: 'no-cors'
    })
    .then(() => {
        const tavernAIStatus = document.querySelector('.llm-service-tab[data-provider="tavernai"] .llm-service-tab-status');
        if (tavernAIStatus) {
            tavernAIStatus.className = 'llm-service-tab-status online';
        }
    })
    .catch(() => {
        const tavernAIStatus = document.querySelector('.llm-service-tab[data-provider="tavernai"] .llm-service-tab-status');
        if (tavernAIStatus) {
            tavernAIStatus.className = 'llm-service-tab-status offline';
        }
    });
    
    // Oobabooga
    fetch(settings.oobabooga_api || 'http://localhost:5000', { 
        method: 'HEAD',
        mode: 'no-cors'
    })
    .then(() => {
        const oobaboogaStatus = document.querySelector('.llm-service-tab[data-provider="oobabooga"] .llm-service-tab-status');
        if (oobaboogaStatus) {
            oobaboogaStatus.className = 'llm-service-tab-status online';
        }
    })
    .catch(() => {
        const oobaboogaStatus = document.querySelector('.llm-service-tab[data-provider="oobabooga"] .llm-service-tab-status');
        if (oobaboogaStatus) {
            oobaboogaStatus.className = 'llm-service-tab-status offline';
        }
    });
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
    
    console.log(`Switching provider from ${activeProvider} to ${provider}`);
    
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
        
        // Load API keys from settings and update provider modules
        const settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || {};
        console.log(`Loaded settings for ${provider}:`, settings);
        
        if (provider === 'claude') {
            console.log('Initializing Claude with settings:', {
                api_key: settings.anthropic_key ? 'Set (hidden)' : 'Not set',
                api_endpoint: settings.anthropic_api
            });
            
            import('./claude.js').then(module => {
                if (settings.anthropic_key) {
                    console.log('Setting Claude API key from switchProvider');
                    module.setClaudeApiKey(settings.anthropic_key);
                }
                if (settings.anthropic_api) {
                    console.log('Setting Claude endpoint to:', settings.anthropic_api + '/messages');
                    module.setClaudeEndpoint(settings.anthropic_api + '/messages');
                }
                console.log('Initializing Claude UI');
                module.initializeClaudeUI();
            }).catch(error => {
                console.error('Error initializing Claude:', error);
            });
        } else if (provider === 'chatgpt') {
            console.log('Initializing ChatGPT with settings:', {
                api_key: settings.openai_key ? 'Set (hidden)' : 'Not set',
                api_endpoint: settings.openai_api
            });
            
            import('./chatgpt.js').then(module => {
                if (settings.openai_key) {
                    console.log('Setting OpenAI API key from switchProvider');
                    module.setOpenAIApiKey(settings.openai_key);
                }
                if (settings.openai_api) {
                    console.log('Setting OpenAI endpoint to:', settings.openai_api + '/chat/completions');
                    module.setOpenAIEndpoint(settings.openai_api + '/chat/completions');
                }
                console.log('Initializing ChatGPT UI');
                module.initializeChatGPTUI();
            }).catch(error => {
                console.error('Error initializing ChatGPT:', error);
            });
        } else if (provider === 'gemini') {
            console.log('Initializing Gemini with settings:', {
                api_key: settings.gemini_key ? 'Set (hidden)' : 'Not set',
                api_endpoint: settings.gemini_api
            });
            
            import('./gemini.js').then(module => {
                if (settings.gemini_key) {
                    console.log('Setting Gemini API key from switchProvider');
                    module.setGeminiApiKey(settings.gemini_key);
                }
                if (settings.gemini_api) {
                    console.log('Setting Gemini endpoint to:', settings.gemini_api);
                    module.setGeminiEndpoint(settings.gemini_api);
                }
                console.log('Initializing Gemini UI');
                module.initializeGeminiUI();
            }).catch(error => {
                console.error('Error initializing Gemini:', error);
            });
        } else if (provider === 'openrouter') {
            console.log('Initializing OpenRouter with settings:', {
                api_key: settings.openrouter_key ? 'Set (hidden)' : 'Not set',
                api_endpoint: settings.openrouter_api
            });
            
            import('./openrouter.js').then(module => {
                if (settings.openrouter_key) {
                    console.log('Setting OpenRouter API key from switchProvider');
                    module.setOpenRouterApiKey(settings.openrouter_key);
                }
                if (settings.openrouter_api) {
                    console.log('Setting OpenRouter endpoint to:', settings.openrouter_api);
                    module.setOpenRouterEndpoint(settings.openrouter_api);
                }
                console.log('Initializing OpenRouter UI');
                module.initializeOpenRouterUI();
            }).catch(error => {
                console.error('Error initializing OpenRouter:', error);
            });
        } else if (provider === 'sillytavern') {
            console.log('Initializing SillyTavern with settings:', {
                api_endpoint: settings.sillytavern_api || 'http://localhost:8000'
            });
            
            import('./sillytavern.js').then(module => {
                if (settings.sillytavern_api) {
                    console.log('Setting SillyTavern endpoint to:', settings.sillytavern_api);
                    module.setSillyTavernEndpoint(settings.sillytavern_api);
                }
                console.log('Initializing SillyTavern UI');
                module.initializeSillyTavernUI();
            }).catch(error => {
                console.error('Error initializing SillyTavern:', error);
            });
        } else if (provider === 'tavernai') {
            console.log('Initializing TavernAI with settings:', {
                api_endpoint: settings.tavernai_api || 'http://localhost:8001'
            });
            
            import('./tavernai.js').then(module => {
                if (settings.tavernai_api) {
                    console.log('Setting TavernAI endpoint to:', settings.tavernai_api);
                    module.setTavernAIEndpoint(settings.tavernai_api);
                }
                console.log('Initializing TavernAI UI');
                module.initializeTavernAIUI();
            }).catch(error => {
                console.error('Error initializing TavernAI:', error);
            });
        } else if (provider === 'oobabooga') {
            console.log('Initializing Oobabooga with settings:', {
                api_endpoint: settings.oobabooga_api || 'http://localhost:5000'
            });
            
            import('./oobabooga.js').then(module => {
                if (settings.oobabooga_api) {
                    console.log('Setting Oobabooga endpoint to:', settings.oobabooga_api);
                    module.setOobaboogaEndpoint(settings.oobabooga_api);
                }
                console.log('Initializing Oobabooga UI');
                module.initializeOobaboogaUI();
            }).catch(error => {
                console.error('Error initializing Oobabooga:', error);
            });
        }
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
        'gemini': 'Gemini',
        'sillytavern': 'SillyTavern',
        'tavernai': 'TavernAI',
        'oobabooga': 'Oobabooga'
    };
    
    const iconMap = {
        'ollama': 'fas fa-brain',
        'claude': 'fas fa-comment-dots',
        'chatgpt': 'fas fa-robot',
        'gemini': 'fas fa-star',
        'sillytavern': 'fas fa-theater-masks',
        'tavernai': 'fas fa-dungeon',
        'oobabooga': 'fas fa-terminal'
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
        try {
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
        } catch (error) {
            console.error('Error loading local service tabs:', error);
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
