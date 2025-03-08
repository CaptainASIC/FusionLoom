// FusionLoom v0.3 - LLM Chat Module
// Core chat functionality for all LLM providers

import { showNotification } from '../../modules/notifications.js';
import { saveChat, loadChat, createNewChat, getChatHistory } from './history.js';

// Chat state
let currentChatId = null;
let currentChat = [];
let currentProvider = null;
let currentModel = null;

/**
 * Initialize the chat module
 * @param {string} provider - The LLM provider (ollama, claude, chatgpt, gemini)
 */
export function initializeChat(provider) {
    currentProvider = provider;
    setupEventListeners();
    loadChatHistory();
}

/**
 * Set up event listeners for the chat interface
 */
function setupEventListeners() {
    // Message input
    const messageInput = document.getElementById('llm-message-input');
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Send button
    const sendButton = document.getElementById('llm-send-button');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // New chat button
    const newChatButton = document.getElementById('llm-new-chat');
    if (newChatButton) {
        newChatButton.addEventListener('click', () => {
            promptNewChat();
        });
    }

    // Attach file button
    const attachButton = document.getElementById('llm-attach-button');
    if (attachButton) {
        attachButton.addEventListener('click', attachFile);
    }
}

/**
 * Load chat history for the current provider
 */
export function loadChatHistory() {
    const historyList = document.getElementById('llm-history-list');
    if (!historyList) return;

    // Clear existing items
    historyList.innerHTML = '';

    // Get chat history for current provider
    const history = getChatHistory(currentProvider);
    
    // Add each chat to the list
    for (const chatId in history) {
        const chat = history[chatId];
        const item = document.createElement('div');
        item.className = 'llm-history-item';
        item.dataset.chatId = chatId;
        item.textContent = chat.name;
        item.addEventListener('click', () => loadChatSession(chatId));
        historyList.appendChild(item);
    }
}

/**
 * Prompt user to create a new chat
 */
function promptNewChat() {
    const chatName = prompt('Enter a name for the new chat:');
    if (chatName) {
        createChatSession(chatName);
    }
}

/**
 * Create a new chat session
 * @param {string} name - The name of the chat session
 */
export function createChatSession(name) {
    currentChatId = createNewChat(currentProvider, name);
    currentChat = [];
    updateChatDisplay();
    loadChatHistory();
    
    // Highlight the current chat in the history list
    highlightCurrentChat();
}

/**
 * Load an existing chat session
 * @param {string} chatId - The ID of the chat to load
 */
export function loadChatSession(chatId) {
    const chat = loadChat(currentProvider, chatId);
    if (chat) {
        currentChatId = chatId;
        currentChat = chat.messages;
        updateChatDisplay();
        
        // Highlight the current chat in the history list
        highlightCurrentChat();
    }
}

/**
 * Highlight the current chat in the history list
 */
function highlightCurrentChat() {
    const historyItems = document.querySelectorAll('.llm-history-item');
    historyItems.forEach(item => {
        if (item.dataset.chatId === currentChatId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * Send a message to the LLM
 */
export async function sendMessage() {
    const messageInput = document.getElementById('llm-message-input');
    if (!messageInput) return;

    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    // Create a new chat if none exists
    if (!currentChatId) {
        createChatSession('New Chat');
    }

    // Add user message to chat
    addMessage('user', userMessage);
    messageInput.value = '';

    try {
        // Get the selected model
        const modelSelector = document.querySelector(`input[name="${currentProvider}-model"]:checked`);
        if (modelSelector) {
            currentModel = modelSelector.value;
        }

        // Get the appropriate send function based on the provider
        let sendFunction;
        switch (currentProvider) {
            case 'ollama':
                sendFunction = (await import('./ollama.js')).sendOllamaMessage;
                break;
            case 'claude':
                sendFunction = (await import('./claude.js')).sendClaudeMessage;
                break;
            case 'chatgpt':
                sendFunction = (await import('./chatgpt.js')).sendChatGPTMessage;
                break;
            case 'gemini':
                sendFunction = (await import('./gemini.js')).sendGeminiMessage;
                break;
            default:
                throw new Error(`Unknown provider: ${currentProvider}`);
        }

        // Show typing indicator
        showTypingIndicator();

        // Send the message to the provider
        const response = await sendFunction(userMessage, currentModel);
        
        // Hide typing indicator
        hideTypingIndicator();

        // Add assistant message to chat
        addMessage('assistant', response);
    } catch (error) {
        hideTypingIndicator();
        showNotification(`Error: ${error.message}`, 'error');
        console.error('Error sending message:', error);
    }
}

/**
 * Add a message to the chat
 * @param {string} role - The role of the message sender (user or assistant)
 * @param {string} content - The content of the message
 */
export function addMessage(role, content) {
    // Add message to current chat
    currentChat.push({ role, content });
    
    // Update the chat display
    updateChatDisplay();
    
    // Save the chat
    saveChat(currentProvider, currentChatId, { 
        name: document.querySelector(`.llm-history-item[data-chat-id="${currentChatId}"]`)?.textContent || 'New Chat',
        messages: currentChat 
    });
}

/**
 * Update the chat display with current messages
 */
function updateChatDisplay() {
    const chatDisplay = document.getElementById('llm-chat-display');
    if (!chatDisplay) return;

    // Clear existing messages
    chatDisplay.innerHTML = '';

    // Add each message to the display
    currentChat.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = `llm-message ${message.role}`;
        
        const roleLabel = document.createElement('div');
        roleLabel.className = 'llm-message-role';
        roleLabel.textContent = message.role === 'user' ? 'You' : 'Assistant';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'llm-message-content';
        contentElement.textContent = message.content;
        
        messageElement.appendChild(roleLabel);
        messageElement.appendChild(contentElement);
        chatDisplay.appendChild(messageElement);
    });

    // Scroll to bottom
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

/**
 * Show typing indicator in the chat
 */
function showTypingIndicator() {
    const chatDisplay = document.getElementById('llm-chat-display');
    if (!chatDisplay) return;

    const indicator = document.createElement('div');
    indicator.className = 'llm-typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    
    const messageElement = document.createElement('div');
    messageElement.className = 'llm-message assistant typing';
    
    const roleLabel = document.createElement('div');
    roleLabel.className = 'llm-message-role';
    roleLabel.textContent = 'Assistant';
    
    messageElement.appendChild(roleLabel);
    messageElement.appendChild(indicator);
    chatDisplay.appendChild(messageElement);
    
    // Scroll to bottom
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

/**
 * Hide typing indicator in the chat
 */
function hideTypingIndicator() {
    const typingIndicator = document.querySelector('.llm-message.typing');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Attach a file to the message
 */
function attachFile() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    
    // Listen for file selection
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const messageInput = document.getElementById('llm-message-input');
            if (messageInput) {
                messageInput.value += `\n[Attached file: ${file.name}]`;
            }
            
            showNotification(`File attached: ${file.name}`, 'success');
        }
    });
    
    // Trigger file selection dialog
    fileInput.click();
}

/**
 * Set the current LLM provider
 * @param {string} provider - The LLM provider to set
 */
export function setProvider(provider) {
    currentProvider = provider;
    currentChatId = null;
    currentChat = [];
    loadChatHistory();
    updateChatDisplay();
}

/**
 * Get the current chat data
 * @returns {Object} The current chat data
 */
export function getCurrentChat() {
    return {
        id: currentChatId,
        messages: currentChat,
        provider: currentProvider,
        model: currentModel
    };
}
