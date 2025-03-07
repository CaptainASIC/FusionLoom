// FusionLoom v0.2 - Settings Module

import { applyTheme } from './theme.js';
import { updateConnectionStatus } from './endpoints.js';
import { showNotification } from './notifications.js';

/**
 * Load settings from localStorage
 */
export function loadSettings() {
    // Load settings from localStorage
    const settings = JSON.parse(localStorage.getItem('fusionloom_settings')) || getDefaultSettings();
    
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
 * Save settings to localStorage
 */
export function saveSettings() {
    const settings = {};
    
    // Collect all settings from form elements (both grid and table based)
    document.querySelectorAll('.fusion-setting-item select, .fusion-setting-item input, .fusion-table input, .fusion-table select').forEach(element => {
        settings[element.id] = element.type === 'checkbox' ? element.checked : element.value;
    });
    
    // Save to localStorage
    localStorage.setItem('fusionloom_settings', JSON.stringify(settings));
    
    // Apply theme immediately
    applyTheme(settings.theme);
    
    // Show success message
    showNotification('Settings saved successfully', 'success');
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
