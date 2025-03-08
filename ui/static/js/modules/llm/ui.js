// FusionLoom v0.3 - LLM UI Module
// Handles UI components and interactions for the LLM page

import { initializeChat, setProvider } from './chat.js';
import { showNotification } from '../../modules/notifications.js';

// Current active provider
let activeProvider = null;

/**
 * Initialize the LLM UI
 */
export function initializeLLMUI() {
    setupServiceTabs();
    setupLocalServicesTabs();
    
    // Default to Ollama provider
    switchProvider('ollama');
}

/**
 * Set up service tabs
 */
function setupServiceTabs() {
    const serviceTabs = document.querySelectorAll('.llm-service-tab');
    
    serviceTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            serviceTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Get provider from data attribute
            const provider = tab.dataset.provider;
            
            // Switch to the selected provider
            switchProvider(provider);
        });
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
}

/**
 * Switch to a different LLM provider
 * @param {string} provider - The provider to switch to
 */
function switchProvider(provider) {
    if (provider === activeProvider) return;
    
    // Hide all provider containers
    const providerContainers = document.querySelectorAll('.llm-provider-container');
    providerContainers.forEach(container => {
        container.style.display = 'none';
    });
    
    // Show the selected provider container
    const selectedContainer = document.getElementById(`${provider}-container`);
    if (selectedContainer) {
        selectedContainer.style.display = 'flex';
    }
    
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
}

/**
 * Prompt user to add a new local service
 */
function promptAddLocalService() {
    const name = prompt('Enter a name for the service:');
    if (!name) return;
    
    const url = prompt('Enter the URL for the service:');
    if (!url) return;
    
    addLocalServiceTab(name, url);
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
        
        if (confirm(`Are you sure you want to remove the "${name}" service?`)) {
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
        }
    }
}

/**
 * Save local service tabs to localStorage
 */
function saveLocalServiceTabs() {
    const tabs = document.querySelectorAll('.local-service-tab');
    const tabData = [];
    
    tabs.forEach(tab => {
        if (tab.id !== 'add-local-service-tab') {
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
