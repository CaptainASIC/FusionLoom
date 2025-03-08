// FusionLoom v0.3 - LLM Chat History Module
// Manages chat history for all LLM providers

/**
 * Generate a unique ID for a new chat
 * @returns {string} A unique ID
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Get the storage key for a provider
 * @param {string} provider - The LLM provider
 * @returns {string} The storage key
 */
function getStorageKey(provider) {
    return `fusionloom_${provider}_chat_history`;
}

/**
 * Get chat history for a provider
 * @param {string} provider - The LLM provider
 * @returns {Object} The chat history
 */
export function getChatHistory(provider) {
    const storageKey = getStorageKey(provider);
    const storedHistory = localStorage.getItem(storageKey);
    return storedHistory ? JSON.parse(storedHistory) : {};
}

/**
 * Save chat history for a provider
 * @param {string} provider - The LLM provider
 * @param {Object} history - The chat history to save
 */
function saveChatHistory(provider, history) {
    const storageKey = getStorageKey(provider);
    localStorage.setItem(storageKey, JSON.stringify(history));
}

/**
 * Create a new chat
 * @param {string} provider - The LLM provider
 * @param {string} name - The name of the chat
 * @returns {string} The ID of the new chat
 */
export function createNewChat(provider, name) {
    const chatId = generateUniqueId();
    const history = getChatHistory(provider);
    
    history[chatId] = {
        name: name || 'New Chat',
        messages: [],
        created: new Date().toISOString()
    };
    
    saveChatHistory(provider, history);
    return chatId;
}

/**
 * Save a chat
 * @param {string} provider - The LLM provider
 * @param {string} chatId - The ID of the chat
 * @param {Object} chatData - The chat data to save
 */
export function saveChat(provider, chatId, chatData) {
    if (!chatId) return;
    
    const history = getChatHistory(provider);
    history[chatId] = {
        ...history[chatId],
        ...chatData,
        updated: new Date().toISOString()
    };
    
    saveChatHistory(provider, history);
}

/**
 * Load a chat
 * @param {string} provider - The LLM provider
 * @param {string} chatId - The ID of the chat
 * @returns {Object|null} The chat data or null if not found
 */
export function loadChat(provider, chatId) {
    const history = getChatHistory(provider);
    return history[chatId] || null;
}

/**
 * Delete a chat
 * @param {string} provider - The LLM provider
 * @param {string} chatId - The ID of the chat
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteChat(provider, chatId) {
    const history = getChatHistory(provider);
    
    if (history[chatId]) {
        delete history[chatId];
        saveChatHistory(provider, history);
        return true;
    }
    
    return false;
}

/**
 * Rename a chat
 * @param {string} provider - The LLM provider
 * @param {string} chatId - The ID of the chat
 * @param {string} newName - The new name for the chat
 * @returns {boolean} True if renamed, false if not found
 */
export function renameChat(provider, chatId, newName) {
    const history = getChatHistory(provider);
    
    if (history[chatId]) {
        history[chatId].name = newName;
        saveChatHistory(provider, history);
        return true;
    }
    
    return false;
}

/**
 * Export chat history for a provider
 * @param {string} provider - The LLM provider
 * @returns {string} JSON string of the chat history
 */
export function exportChatHistory(provider) {
    const history = getChatHistory(provider);
    return JSON.stringify(history, null, 2);
}

/**
 * Import chat history for a provider
 * @param {string} provider - The LLM provider
 * @param {string} jsonData - JSON string of the chat history
 * @returns {boolean} True if imported successfully
 */
export function importChatHistory(provider, jsonData) {
    try {
        const history = JSON.parse(jsonData);
        saveChatHistory(provider, history);
        return true;
    } catch (error) {
        console.error('Error importing chat history:', error);
        return false;
    }
}

/**
 * Clear all chat history for a provider
 * @param {string} provider - The LLM provider
 */
export function clearChatHistory(provider) {
    saveChatHistory(provider, {});
}
