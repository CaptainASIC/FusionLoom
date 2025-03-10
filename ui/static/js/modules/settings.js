// FusionLoom v0.4 - Settings Module

import { applyTheme } from './theme.js';
import { updateConnectionStatus } from './endpoints.js';
import { showNotification } from './notifications.js';

/**
 * Load settings from localStorage and config.ini
 */
export function loadSettings() {
    // First load settings from localStorage
    let settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || getDefaultSettings();
    
    console.log('Loaded settings from localStorage:', settings);
    
    // Then try to load settings from config.ini via API
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
            
            // Save merged settings to localStorage
            localStorage.setItem('fusionloom_settings', JSON.stringify(settings));
            
            // Apply merged settings to form elements
            applySettingsToForm(settings);
            
            // Initialize LLM providers with API keys
            initializeLLMProviders(settings);
        })
        .catch(error => {
            console.error('Error loading settings from config.ini:', error);
            console.log('Using settings from localStorage only');
            
            // Apply settings from localStorage to form elements
            applySettingsToForm(settings);
            
            // Initialize LLM providers with API keys
            initializeLLMProviders(settings);
        });
}

/**
 * Apply settings to form elements
 * @param {Object} settings - The settings to apply
 */
function applySettingsToForm(settings) {
    // Apply settings to form elements
    Object.entries(settings).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
        }
    });
    
    // Apply theme immediately
    applyTheme(settings.theme);
    
    // Update connection status indicators
    updateConnectionStatus();
}

/**
 * Initialize LLM providers with API keys
 * @param {Object} settings - The settings containing API keys
 */
function initializeLLMProviders(settings) {
    // If we're on the LLM page, update the LLM provider modules with the API keys
    if (document.querySelector('.llm-page')) {
        console.log('On LLM page during loadSettings, updating provider API keys');
        
        // Update Claude API key
        if (settings.anthropic_key) {
            console.log('Setting Claude API key from loadSettings');
            import('./llm/claude.js').then(module => {
                module.setClaudeApiKey(settings.anthropic_key);
                if (settings.anthropic_api) {
                    module.setClaudeEndpoint(settings.anthropic_api + '/messages');
                }
                // Initialize Claude UI
                module.initializeClaudeUI();
            }).catch(error => {
                console.error('Error setting Claude API key:', error);
            });
        }
        
        // Update OpenAI API key
        if (settings.openai_key) {
            console.log('Setting OpenAI API key from loadSettings');
            import('./llm/chatgpt.js').then(module => {
                module.setOpenAIApiKey(settings.openai_key);
                if (settings.openai_api) {
                    module.setOpenAIEndpoint(settings.openai_api + '/chat/completions');
                }
                // Initialize ChatGPT UI
                module.initializeChatGPTUI();
            }).catch(error => {
                console.error('Error setting OpenAI API key:', error);
            });
        }
        
        // Update Gemini API key
        if (settings.gemini_key) {
            console.log('Setting Gemini API key from loadSettings');
            import('./llm/gemini.js').then(module => {
                module.setGeminiApiKey(settings.gemini_key);
                if (settings.gemini_api) {
                    module.setGeminiEndpoint(settings.gemini_api);
                }
                // Initialize Gemini UI
                module.initializeGeminiUI();
            }).catch(error => {
                console.error('Error setting Gemini API key:', error);
            });
        }
    }
}

/**
 * Get default settings
 * @returns {Object} Default settings object
 */
export function getDefaultSettings() {
    return {
        theme: 'dark',
        save_sessions: true,
        gpu_vendor: 'auto',
        platform: 'auto',
        gpu_memory: '8G',
        power_mode: 'balanced',
        acceleration: true,
        container_engine: 'podman',
        auto_start: true,
        
        // LLM services
        ollama_api: 'http://localhost:11434/api',
        ollama_key: '',
        anthropic_api: 'https://api.anthropic.com/v1',
        anthropic_key: '',
        openai_api: 'https://api.openai.com/v1',
        openai_key: '',
        gemini_api: 'https://generativelanguage.googleapis.com/v1',
        gemini_key: '',
        grok_api: 'https://api.grok.x/v1',
        grok_key: '',
        default_llm: 'llama3',
        
        // Image generation services
        sd_api: 'http://localhost:7860',
        sd_key: '',
        dalle_api: 'https://api.openai.com/v1/images',
        dalle_key: '',
        midjourney_api: 'http://localhost:7861',
        midjourney_key: '',
        default_img: 'sdxl',
        
        // Speech services
        tts_api: 'http://localhost:5500/api/tts',
        tts_key: '',
        stt_api: 'http://localhost:5501/api/stt',
        stt_key: '',
        openai_audio_api: 'https://api.openai.com/v1/audio',
        openai_audio_key: '',
        default_tts: 'whisper-large',
        default_voice: 'onyx'
    };
}

/**
 * Save settings to localStorage and config.ini
 */
export function saveSettings() {
    const settings = {};
    
    // Collect all settings from form elements (both grid and table based)
    document.querySelectorAll('.fusion-setting-item select, .fusion-setting-item input, .fusion-table input, .fusion-table select').forEach(element => {
        settings[element.id] = element.type === 'checkbox' ? element.checked : element.value;
    });
    
    // Log settings being saved
    console.log('Saving settings:', settings);
    
    // Save to localStorage
    localStorage.setItem('fusionloom_settings', JSON.stringify(settings));
    
    // Apply theme immediately
    applyTheme(settings.theme);
    
    // Update LLM provider API keys if on LLM page
    if (document.querySelector('.llm-page')) {
        console.log('On LLM page, updating provider API keys');
        
        // Update Claude API key
        if (settings.anthropic_key) {
            console.log('Updating Claude API key:', settings.anthropic_key);
            import('./llm/claude.js').then(module => {
                module.setClaudeApiKey(settings.anthropic_key);
                console.log('Claude API key set in module');
                
                if (settings.anthropic_api) {
                    module.setClaudeEndpoint(settings.anthropic_api + '/messages');
                    console.log('Claude endpoint set to:', settings.anthropic_api + '/messages');
                }
                
                // Reinitialize UI if Claude is the active provider
                if (document.querySelector('.llm-service-tab[data-provider="claude"].active')) {
                    console.log('Claude is active provider, reinitializing UI');
                    module.initializeClaudeUI();
                }
            }).catch(error => {
                console.error('Error updating Claude settings:', error);
            });
        }
        
        // Update OpenAI API key
        if (settings.openai_key) {
            console.log('Updating OpenAI API key');
            import('./llm/chatgpt.js').then(module => {
                module.setOpenAIApiKey(settings.openai_key);
                if (settings.openai_api) {
                    module.setOpenAIEndpoint(settings.openai_api + '/chat/completions');
                }
                // Reinitialize UI if ChatGPT is the active provider
                if (document.querySelector('.llm-service-tab[data-provider="chatgpt"].active')) {
                    module.initializeChatGPTUI();
                }
            }).catch(error => {
                console.error('Error updating OpenAI settings:', error);
            });
        }
        
        // Update Gemini API key
        if (settings.gemini_key) {
            console.log('Updating Gemini API key');
            import('./llm/gemini.js').then(module => {
                module.setGeminiApiKey(settings.gemini_key);
                if (settings.gemini_api) {
                    module.setGeminiEndpoint(settings.gemini_api);
                }
                // Reinitialize UI if Gemini is the active provider
                if (document.querySelector('.llm-service-tab[data-provider="gemini"].active')) {
                    module.initializeGeminiUI();
                }
            }).catch(error => {
                console.error('Error updating Gemini settings:', error);
            });
        }
        
        // Update service tab status indicators
        import('./llm/ui.js').then(module => {
            if (typeof module.updateServiceTabStatus === 'function') {
                console.log('Updating service tab status indicators');
                module.updateServiceTabStatus();
            }
        }).catch(error => {
            console.error('Error updating service tab status:', error);
        });
    }
    
    // Save settings to config.ini via API
    fetch('http://localhost:5052/api/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save settings to config.ini');
        }
        return response.json();
    })
    .then(data => {
        console.log('Settings saved to config.ini:', data);
        showNotification('Settings saved successfully', 'success');
    })
    .catch(error => {
        console.error('Error saving settings to config.ini:', error);
        showNotification('Settings saved to browser but failed to save to config.ini', 'warning');
    });
}

/**
 * Reset settings to defaults
 */
export function resetSettings() {
    // Reset to default settings
    const defaultSettings = getDefaultSettings();
    
    // Apply default settings to form elements
    Object.entries(defaultSettings).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
        }
    });
    
    // Save default settings
    localStorage.setItem('fusionloom_settings', JSON.stringify(defaultSettings));
    
    // Apply theme immediately
    applyTheme(defaultSettings.theme);
    
    // Show success message
    showNotification('Settings reset to defaults', 'info');
}
