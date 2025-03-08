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
        created: new Date().toISOString(),
        updated: new Date().toISOString()
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
    
    // If chat doesn't exist, create it
    if (!history[chatId]) {
        history[chatId] = {
            name: chatData.name || 'New Chat',
            messages: [],
            created: new Date().toISOString()
        };
    }
    
    // Update chat data
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
        history[chatId].updated = new Date().toISOString();
        saveChatHistory(provider, history);
        return true;
    }
    
    return false;
}

/**
 * Search chat history for a provider
 * @param {string} provider - The LLM provider
 * @param {string} query - The search query
 * @returns {Object} Matching chats
 */
export function searchChatHistory(provider, query) {
    const history = getChatHistory(provider);
    const results = {};
    
    if (!query) return history;
    
    const lowerQuery = query.toLowerCase();
    
    for (const chatId in history) {
        const chat = history[chatId];
        
        // Check chat name
        if (chat.name.toLowerCase().includes(lowerQuery)) {
            results[chatId] = chat;
            continue;
        }
        
        // Check messages
        if (chat.messages) {
            const hasMatch = chat.messages.some(message => 
                message.content.toLowerCase().includes(lowerQuery)
            );
            
            if (hasMatch) {
                results[chatId] = chat;
            }
        }
    }
    
    return results;
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
        
        // Validate the imported data
        if (typeof history !== 'object') {
            throw new Error('Invalid chat history format');
        }
        
        // Check each chat
        for (const chatId in history) {
            const chat = history[chatId];
            
            if (!chat.name || !Array.isArray(chat.messages)) {
                throw new Error(`Invalid chat format for chat ID: ${chatId}`);
            }
            
            // Ensure created and updated dates
            if (!chat.created) {
                chat.created = new Date().toISOString();
            }
            
            if (!chat.updated) {
                chat.updated = new Date().toISOString();
            }
        }
        
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

/**
 * Get the total number of chats for a provider
 * @param {string} provider - The LLM provider
 * @returns {number} The number of chats
 */
export function getChatCount(provider) {
    const history = getChatHistory(provider);
    return Object.keys(history).length;
}

/**
 * Get the total number of messages across all chats for a provider
 * @param {string} provider - The LLM provider
 * @returns {number} The number of messages
 */
export function getMessageCount(provider) {
    const history = getChatHistory(provider);
    let count = 0;
    
    for (const chatId in history) {
        count += history[chatId].messages?.length || 0;
    }
    
    return count;
}

/**
 * Get the most recent chat for a provider
 * @param {string} provider - The LLM provider
 * @returns {Object|null} The most recent chat or null if none
 */
export function getMostRecentChat(provider) {
    const history = getChatHistory(provider);
    
    if (Object.keys(history).length === 0) {
        return null;
    }
    
    // Sort chats by updated date
    const sortedChatIds = Object.keys(history).sort((a, b) => {
        const dateA = new Date(history[a].updated || history[a].created);
        const dateB = new Date(history[b].updated || history[b].created);
        return dateB - dateA;
    });
    
    const mostRecentChatId = sortedChatIds[0];
    return {
        id: mostRecentChatId,
        ...history[mostRecentChatId]
    };
}
