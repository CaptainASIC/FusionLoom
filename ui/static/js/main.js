// FusionLoom v0.3 - Main JavaScript Entry Point

// Import modules
import { initializeUI, navigateToPage } from './modules/ui.js';
import { initializeLLMUI } from './modules/llm/ui.js';
import { initializeOllamaUI } from './modules/llm/ollama.js';
import { initializeClaudeUI } from './modules/llm/claude.js';
import { initializeChatGPTUI } from './modules/llm/chatgpt.js';
import { initializeGeminiUI } from './modules/llm/gemini.js';
import { applyTheme, initializeThemePreview } from './modules/theme.js';
import { loadSettings, saveSettings, resetSettings, getDefaultSettings } from './modules/settings.js';
import { updateConnectionStatus, testConnections, checkEndpointReachability } from './modules/endpoints.js';
import { checkContainerStatus, toggleContainerStatus, manuallyAddContainer, addManualContainer } from './modules/containers.js';
import { updatePerformanceGauges, updateGauge, updateSystemInfo } from './modules/performance.js';
import { showNotification } from './modules/notifications.js';
import { 
    showAboutModal, 
    hideAboutModal, 
    showAddEndpointModal, 
    hideAddEndpointModal, 
    updateEndpointForm, 
    addEndpoint,
    confirmDeleteEndpoint,
    toggleEndpointStatus,
    hideStatusToggleModal,
    toggleEditMode,
    saveEndpointChanges,
    cancelEndpointEdit
} from './modules/modals.js';

// Make functions globally available
window.navigateToPage = navigateToPage;
window.initializeOllamaUI = initializeOllamaUI;
window.initializeClaudeUI = initializeClaudeUI;
window.initializeChatGPTUI = initializeChatGPTUI;
window.initializeGeminiUI = initializeGeminiUI;
window.applyTheme = applyTheme;
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.testConnections = testConnections;
window.toggleContainerStatus = toggleContainerStatus;
window.manuallyAddContainer = manuallyAddContainer;
window.addManualContainer = addManualContainer;
window.showNotification = showNotification;
window.showAboutModal = showAboutModal;
window.hideAboutModal = hideAboutModal;
window.showAddEndpointModal = showAddEndpointModal;
window.hideAddEndpointModal = hideAddEndpointModal;
window.updateEndpointForm = updateEndpointForm;
window.addEndpoint = addEndpoint;
window.confirmDeleteEndpoint = confirmDeleteEndpoint;
window.toggleEndpointStatus = toggleEndpointStatus;
window.hideStatusToggleModal = hideStatusToggleModal;
window.toggleEditMode = toggleEditMode;
window.saveEndpointChanges = saveEndpointChanges;
window.cancelEndpointEdit = cancelEndpointEdit;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the UI
    initializeUI();
    
    // Load saved settings
    loadSettings();
    
    // Initialize LLM UI when navigating to LLM page
    document.addEventListener('pageChanged', function(e) {
        if (e.detail.page === 'llm') {
            initializeLLMUI();
        }
    });
    
    // Update performance gauges periodically
    setInterval(updatePerformanceGauges, 2000);
    
    // Update container status periodically
    setInterval(checkContainerStatus, 5000);
    
    // Update system info
    updateSystemInfo();
    
    // Make logo clickable to show about modal
    const logo = document.querySelector('.fusion-logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', showAboutModal);
    }
});
