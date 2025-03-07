// FusionLoom v0.2 - Notifications Module

/**
 * Show a notification to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (info, success, warning, error)
 */
export function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fusion-notification ${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
