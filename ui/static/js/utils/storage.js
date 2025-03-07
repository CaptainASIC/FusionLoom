// FusionLoom v0.2 - Storage Utilities

/**
 * Save data to localStorage
 * @param {string} key - The key to save under
 * @param {any} data - The data to save
 */
export function saveToLocalStorage(key, data) {
    try {
        const serializedData = JSON.stringify(data);
        localStorage.setItem(key, serializedData);
        return true;
    } catch (error) {
        console.error(`Error saving to localStorage (${key}):`, error);
        return false;
    }
}

/**
 * Load data from localStorage
 * @param {string} key - The key to load
 * @param {any} defaultValue - The default value if key doesn't exist
 * @returns {any} - The loaded data or default value
 */
export function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const serializedData = localStorage.getItem(key);
        if (serializedData === null) {
            return defaultValue;
        }
        return JSON.parse(serializedData);
    } catch (error) {
        console.error(`Error loading from localStorage (${key}):`, error);
        return defaultValue;
    }
}

/**
 * Remove data from localStorage
 * @param {string} key - The key to remove
 */
export function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing from localStorage (${key}):`, error);
        return false;
    }
}

/**
 * Clear all data from localStorage
 */
export function clearLocalStorage() {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
    }
}

/**
 * Check if a key exists in localStorage
 * @param {string} key - The key to check
 * @returns {boolean} - Whether the key exists
 */
export function existsInLocalStorage(key) {
    return localStorage.getItem(key) !== null;
}

/**
 * Save data to sessionStorage
 * @param {string} key - The key to save under
 * @param {any} data - The data to save
 */
export function saveToSessionStorage(key, data) {
    try {
        const serializedData = JSON.stringify(data);
        sessionStorage.setItem(key, serializedData);
        return true;
    } catch (error) {
        console.error(`Error saving to sessionStorage (${key}):`, error);
        return false;
    }
}

/**
 * Load data from sessionStorage
 * @param {string} key - The key to load
 * @param {any} defaultValue - The default value if key doesn't exist
 * @returns {any} - The loaded data or default value
 */
export function loadFromSessionStorage(key, defaultValue = null) {
    try {
        const serializedData = sessionStorage.getItem(key);
        if (serializedData === null) {
            return defaultValue;
        }
        return JSON.parse(serializedData);
    } catch (error) {
        console.error(`Error loading from sessionStorage (${key}):`, error);
        return defaultValue;
    }
}

/**
 * Remove data from sessionStorage
 * @param {string} key - The key to remove
 */
export function removeFromSessionStorage(key) {
    try {
        sessionStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing from sessionStorage (${key}):`, error);
        return false;
    }
}

/**
 * Clear all data from sessionStorage
 */
export function clearSessionStorage() {
    try {
        sessionStorage.clear();
        return true;
    } catch (error) {
        console.error('Error clearing sessionStorage:', error);
        return false;
    }
}

/**
 * Check if a key exists in sessionStorage
 * @param {string} key - The key to check
 * @returns {boolean} - Whether the key exists
 */
export function existsInSessionStorage(key) {
    return sessionStorage.getItem(key) !== null;
}

/**
 * Get the size of localStorage in bytes
 * @returns {number} - The size in bytes
 */
export function getLocalStorageSize() {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        totalSize += (key.length + value.length) * 2; // UTF-16 uses 2 bytes per character
    }
    return totalSize;
}

/**
 * Get the size of sessionStorage in bytes
 * @returns {number} - The size in bytes
 */
export function getSessionStorageSize() {
    let totalSize = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        totalSize += (key.length + value.length) * 2; // UTF-16 uses 2 bytes per character
    }
    return totalSize;
}
