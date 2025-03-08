// FusionLoom v0.3 - LLM Chat Module
// Core chat functionality for all LLM providers

import { showNotification } from '../../modules/notifications.js';
import { saveChat, loadChat, createNewChat, getChatHistory, deleteChat, renameChat } from './history.js';
import { getSelectedModel } from './ollama.js';

// Chat state
let currentChatId = null;
let currentChat = [];
let currentProvider = null;
let currentModel = null;

// Markdown parser (simple implementation)
const markdownParser = {
    parse: function(text) {
        if (!text) return '';
        
        // Code blocks (```code```)
        text = text.replace(/```(\w*)([\s\S]*?)```/g, function(match, language, code) {
            language = language.trim();
            code = code.trim();
            
            const languageLabel = language ? language : 'text';
            
            return `<div class="code-header"><span class="code-language">${languageLabel}</span><button class="code-copy" onclick="copyToClipboard(this.parentNode.nextSibling.textContent)"><i class="fas fa-copy"></i></button></div><pre><code class="language-${language}">${code}</code></pre>`;
        });
        
        // Inline code (`code`)
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Headers (# Header)
        text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Bold (**text**)
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic (*text*)
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Lists
        text = text.replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>');
        text = text.replace(/^\s*\*\s+(.*$)/gm, '<li>$1</li>');
        text = text.replace(/^\s*-\s+(.*$)/gm, '<li>$1</li>');
        text = text.replace(/<\/li>\n<li>/g, '</li><li>');
        text = text.replace(/<\/li>\n/g, '</li>');
        text = text.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
        
        // Links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Paragraphs
        text = text.replace(/\n\s*\n/g, '</p><p>');
        text = '<p>' + text + '</p>';
        text = text.replace(/<p><\/p>/g, '');
        
        // Tables (simplified)
        if (text.includes('|')) {
            const lines = text.split('\n');
            let inTable = false;
            let tableHTML = '<table>';
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line.startsWith('|') && line.endsWith('|')) {
                    if (!inTable) {
                        inTable = true;
                        tableHTML += '<thead><tr>';
                        
                        // Header row
                        const headerCells = line.split('|').filter(cell => cell.trim() !== '');
                        headerCells.forEach(cell => {
                            tableHTML += `<th>${cell.trim()}</th>`;
                        });
                        
                        tableHTML += '</tr></thead><tbody>';
                        
                        // Skip separator row
                        i++;
                    } else {
                        // Data row
                        tableHTML += '<tr>';
                        const cells = line.split('|').filter(cell => cell.trim() !== '');
                        cells.forEach(cell => {
                            tableHTML += `<td>${cell.trim()}</td>`;
                        });
                        tableHTML += '</tr>';
                    }
                } else if (inTable) {
                    inTable = false;
                    tableHTML += '</tbody></table>';
                    text = text.replace(/<p>.*?<\/p>/, tableHTML);
                }
            }
            
            if (inTable) {
                tableHTML += '</tbody></table>';
                text = text.replace(/<p>.*?<\/p>/, tableHTML);
            }
        }
        
        return text;
    }
};

/**
 * Initialize the chat module
 * @param {string} provider - The LLM provider (ollama, claude, chatgpt, gemini)
 */
export function initializeChat(provider) {
    currentProvider = provider;
    setupEventListeners();
    loadChatHistory();
    
    // Add copy to clipboard function to window
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard', 'success');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showNotification('Failed to copy to clipboard', 'error');
        });
    };
}

/**
 * Set up event listeners for the chat interface
 */
function setupEventListeners() {
    // Message input
    const messageInput = document.getElementById(`${currentProvider}-message-input`) || document.getElementById('llm-message-input');
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = (messageInput.scrollHeight) + 'px';
        });
    }

    // Send button
    const sendButton = document.getElementById(`${currentProvider}-send-button`) || document.getElementById('llm-send-button');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // New chat button
    const newChatButton = document.getElementById(`${currentProvider}-new-chat`) || document.getElementById('llm-new-chat');
    if (newChatButton) {
        newChatButton.addEventListener('click', () => {
            promptNewChat();
        });
    }

    // Attach file button
    const attachButton = document.getElementById(`${currentProvider}-attach-button`) || document.getElementById('llm-attach-button');
    if (attachButton) {
        attachButton.addEventListener('click', attachFile);
    }
    
    // Clear chat button
    const clearButton = document.querySelector(`#${currentProvider}-container .llm-chat-action-button[title="Clear Chat"]`);
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear this chat?')) {
                clearChat();
            }
        });
    }
    
    // Export chat button
    const exportButton = document.querySelector(`#${currentProvider}-container .llm-chat-action-button[title="Export Chat"]`);
    if (exportButton) {
        exportButton.addEventListener('click', exportChat);
    }
}

/**
 * Load chat history for the current provider
 */
export function loadChatHistory() {
    const historyList = document.getElementById(`${currentProvider}-history-list`) || document.getElementById('llm-history-list');
    if (!historyList) return;

    // Clear existing items
    historyList.innerHTML = '';

    // Get chat history for current provider
    const history = getChatHistory(currentProvider);
    
    // Add each chat to the list
    for (const chatId in history) {
        const chat = history[chatId];
        addChatToHistory(chatId, chat.name);
    }
    
    // Create a new chat if none exists
    if (Object.keys(history).length === 0) {
        createChatSession('New Chat');
    } else {
        // Load the most recent chat
        const mostRecentChatId = Object.keys(history).sort((a, b) => {
            const dateA = new Date(history[a].updated || history[a].created);
            const dateB = new Date(history[b].updated || history[b].created);
            return dateB - dateA;
        })[0];
        
        loadChatSession(mostRecentChatId);
    }
}

/**
 * Add a chat to the history list
 * @param {string} chatId - The ID of the chat
 * @param {string} name - The name of the chat
 */
function addChatToHistory(chatId, name) {
    const historyList = document.getElementById(`${currentProvider}-history-list`) || document.getElementById('llm-history-list');
    if (!historyList) return;
    
    const item = document.createElement('div');
    item.className = 'llm-history-item';
    item.dataset.chatId = chatId;
    
    item.innerHTML = `
        <i class="fas fa-comment"></i>
        <span>${name}</span>
        <div class="llm-history-item-actions">
            <button class="llm-history-item-action rename" title="Rename">
                <i class="fas fa-edit"></i>
            </button>
            <button class="llm-history-item-action delete" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add click event to load chat
    item.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if (e.target.closest('.llm-history-item-action')) return;
        
        loadChatSession(chatId);
    });
    
    // Add rename button event
    const renameButton = item.querySelector('.llm-history-item-action.rename');
    if (renameButton) {
        renameButton.addEventListener('click', (e) => {
            e.stopPropagation();
            promptRenameChat(chatId);
        });
    }
    
    // Add delete button event
    const deleteButton = item.querySelector('.llm-history-item-action.delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            promptDeleteChat(chatId);
        });
    }
    
    historyList.appendChild(item);
}

/**
 * Prompt user to create a new chat
 */
function promptNewChat() {
    const chatName = prompt('Enter a name for the new chat:', 'New Chat');
    if (chatName) {
        createChatSession(chatName);
    }
}

/**
 * Prompt user to rename a chat
 * @param {string} chatId - The ID of the chat to rename
 */
function promptRenameChat(chatId) {
    const history = getChatHistory(currentProvider);
    const chat = history[chatId];
    
    if (chat) {
        const newName = prompt('Enter a new name for the chat:', chat.name);
        if (newName && newName !== chat.name) {
            renameChat(currentProvider, chatId, newName);
            
            // Update the chat name in the history list
            const historyItem = document.querySelector(`.llm-history-item[data-chat-id="${chatId}"] span`);
            if (historyItem) {
                historyItem.textContent = newName;
            }
            
            // Update the chat title if this is the current chat
            if (chatId === currentChatId) {
                const chatTitle = document.querySelector(`#${currentProvider}-container .llm-chat-title span`);
                if (chatTitle) {
                    chatTitle.textContent = `${currentProvider.charAt(0).toUpperCase() + currentProvider.slice(1)} - ${newName}`;
                }
            }
            
            showNotification(`Chat renamed to "${newName}"`, 'success');
        }
    }
}

/**
 * Prompt user to delete a chat
 * @param {string} chatId - The ID of the chat to delete
 */
function promptDeleteChat(chatId) {
    const history = getChatHistory(currentProvider);
    const chat = history[chatId];
    
    if (chat && confirm(`Are you sure you want to delete the chat "${chat.name}"?`)) {
        deleteChat(currentProvider, chatId);
        
        // Remove the chat from the history list
        const historyItem = document.querySelector(`.llm-history-item[data-chat-id="${chatId}"]`);
        if (historyItem) {
            historyItem.remove();
        }
        
        // If this was the current chat, create a new one
        if (chatId === currentChatId) {
            createChatSession('New Chat');
        }
        
        showNotification(`Chat "${chat.name}" deleted`, 'success');
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
    
    // Add to history list
    addChatToHistory(currentChatId, name);
    
    // Highlight the current chat in the history list
    highlightCurrentChat();
    
    // Update chat title
    const chatTitle = document.querySelector(`#${currentProvider}-container .llm-chat-title span`);
    if (chatTitle) {
        chatTitle.textContent = `${currentProvider.charAt(0).toUpperCase() + currentProvider.slice(1)} - ${name}`;
    }
}

/**
 * Load an existing chat session
 * @param {string} chatId - The ID of the chat to load
 */
export function loadChatSession(chatId) {
    const chat = loadChat(currentProvider, chatId);
    if (chat) {
        currentChatId = chatId;
        currentChat = chat.messages || [];
        updateChatDisplay();
        
        // Highlight the current chat in the history list
        highlightCurrentChat();
        
        // Update chat title
        const chatTitle = document.querySelector(`#${currentProvider}-container .llm-chat-title span`);
        if (chatTitle) {
            chatTitle.textContent = `${currentProvider.charAt(0).toUpperCase() + currentProvider.slice(1)} - ${chat.name}`;
        }
    }
}

/**
 * Clear the current chat
 */
function clearChat() {
    currentChat = [];
    updateChatDisplay();
    
    // Save the empty chat
    saveChat(currentProvider, currentChatId, { 
        name: document.querySelector(`.llm-history-item[data-chat-id="${currentChatId}"] span`)?.textContent || 'New Chat',
        messages: currentChat 
    });
    
    showNotification('Chat cleared', 'success');
}

/**
 * Export the current chat
 */
function exportChat() {
    if (!currentChatId || currentChat.length === 0) {
        showNotification('No chat to export', 'error');
        return;
    }
    
    const chat = loadChat(currentProvider, currentChatId);
    if (!chat) {
        showNotification('Failed to load chat for export', 'error');
        return;
    }
    
    // Format the chat as markdown
    let markdown = `# ${chat.name}\n\n`;
    markdown += `Provider: ${currentProvider}\n`;
    markdown += `Date: ${new Date().toLocaleString()}\n\n`;
    
    currentChat.forEach(message => {
        const role = message.role === 'user' ? 'You' : 'Assistant';
        markdown += `## ${role}\n\n${message.content}\n\n`;
    });
    
    // Create a blob and download link
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Chat exported successfully', 'success');
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
    const messageInput = document.getElementById(`${currentProvider}-message-input`) || document.getElementById('llm-message-input');
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
    messageInput.style.height = 'auto';

    try {
        // Get the selected model based on provider
        switch (currentProvider) {
            case 'ollama':
                currentModel = getSelectedModel();
                break;
            case 'claude':
                currentModel = document.querySelector('input[name="claude-model"]:checked')?.value || 'claude-3-opus-20240229';
                break;
            case 'chatgpt':
                currentModel = document.querySelector('input[name="chatgpt-model"]:checked')?.value || 'gpt-4o';
                break;
            case 'gemini':
                currentModel = document.querySelector('input[name="gemini-model"]:checked')?.value || 'gemini-1.5-pro';
                break;
            default:
                currentModel = null;
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
        
        // Add error message to chat
        addErrorMessage(error.message);
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
        name: document.querySelector(`.llm-history-item[data-chat-id="${currentChatId}"] span`)?.textContent || 'New Chat',
        messages: currentChat 
    });
}

/**
 * Add an error message to the chat
 * @param {string} errorMessage - The error message
 */
function addErrorMessage(errorMessage) {
    const chatDisplay = document.getElementById(`${currentProvider}-chat-display`) || document.getElementById('llm-chat-display');
    if (!chatDisplay) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'llm-message error';
    
    messageElement.innerHTML = `
        <div class="llm-message-role">Error</div>
        <div class="llm-message-content">
            <p>Failed to get response: ${errorMessage}</p>
            <p>Please try again or check your connection.</p>
        </div>
    `;
    
    chatDisplay.appendChild(messageElement);
    
    // Scroll to bottom
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

/**
 * Update the chat display with current messages
 */
function updateChatDisplay() {
    const chatDisplay = document.getElementById(`${currentProvider}-chat-display`) || document.getElementById('llm-chat-display');
    if (!chatDisplay) return;

    // Clear existing messages
    chatDisplay.innerHTML = '';
    
    // If no messages, show welcome message
    if (currentChat.length === 0) {
        chatDisplay.innerHTML = `
            <div class="llm-welcome-message">
                <h2>Welcome to FusionLoom LLM Chat</h2>
                <p>Start a conversation with ${currentProvider.charAt(0).toUpperCase() + currentProvider.slice(1)}'s language models. Select a model from the sidebar and start chatting.</p>
                <div class="llm-welcome-suggestions">
                    <div class="llm-welcome-suggestion">Explain quantum computing in simple terms</div>
                    <div class="llm-welcome-suggestion">Write a short story about a robot learning to paint</div>
                    <div class="llm-welcome-suggestion">What are the best practices for sustainable gardening?</div>
                    <div class="llm-welcome-suggestion">Help me debug a Python function that's not working</div>
                </div>
            </div>
        `;
        
        // Set up welcome suggestions
        const suggestions = chatDisplay.querySelectorAll('.llm-welcome-suggestion');
        suggestions.forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const messageInput = document.getElementById(`${currentProvider}-message-input`) || document.getElementById('llm-message-input');
                const sendButton = document.getElementById(`${currentProvider}-send-button`) || document.getElementById('llm-send-button');
                
                if (messageInput && sendButton) {
                    messageInput.value = suggestion.textContent;
                    sendButton.click();
                }
            });
        });
        
        return;
    }

    // Add each message to the display
    currentChat.forEach((message, index) => {
        const messageElement = document.createElement('div');
        messageElement.className = `llm-message ${message.role}`;
        
        const roleLabel = document.createElement('div');
        roleLabel.className = 'llm-message-role';
        roleLabel.textContent = message.role === 'user' ? 'You' : 'Assistant';
        
        const contentElement = document.createElement('div');
        contentElement.className = 'llm-message-content';
        
        // Parse markdown in assistant messages
        if (message.role === 'assistant') {
            contentElement.innerHTML = markdownParser.parse(message.content);
        } else {
            contentElement.textContent = message.content;
        }
        
        // Add message actions
        const actionsElement = document.createElement('div');
        actionsElement.className = 'llm-message-actions';
        
        // Copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'llm-message-action copy';
        copyButton.title = 'Copy';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(message.content).then(() => {
                showNotification('Message copied to clipboard', 'success');
            }).catch(err => {
                console.error('Failed to copy message: ', err);
                showNotification('Failed to copy message', 'error');
            });
        });
        
        actionsElement.appendChild(copyButton);
        
        // Regenerate button (only for last assistant message)
        if (message.role === 'assistant' && index === currentChat.length - 1) {
            const regenerateButton = document.createElement('button');
            regenerateButton.className = 'llm-message-action regenerate';
            regenerateButton.title = 'Regenerate';
            regenerateButton.innerHTML = '<i class="fas fa-redo-alt"></i>';
            regenerateButton.addEventListener('click', () => {
                // Remove the last two messages (user and assistant)
                currentChat.splice(-2);
                updateChatDisplay();
                
                // Re-send the user message
                const userMessage = currentChat[currentChat.length - 1]?.content;
                if (userMessage) {
                    const messageInput = document.getElementById(`${currentProvider}-message-input`) || document.getElementById('llm-message-input');
                    if (messageInput) {
                        messageInput.value = userMessage;
                        sendMessage();
                    }
                }
            });
            
            actionsElement.appendChild(regenerateButton);
        }
        
        messageElement.appendChild(roleLabel);
        messageElement.appendChild(contentElement);
        messageElement.appendChild(actionsElement);
        
        chatDisplay.appendChild(messageElement);
    });

    // Scroll to bottom
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

/**
 * Show typing indicator in the chat
 */
function showTypingIndicator() {
    const chatDisplay = document.getElementById(`${currentProvider}-chat-display`) || document.getElementById('llm-chat-display');
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
            const messageInput = document.getElementById(`${currentProvider}-message-input`) || document.getElementById('llm-message-input');
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
