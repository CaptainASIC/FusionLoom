// FusionLoom v0.2 - API Utilities

/**
 * Make a GET request to the specified URL
 * @param {string} url - The URL to fetch
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} - The response data
 */
export async function get(url, options = {}) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;
    }
}

/**
 * Make a POST request to the specified URL
 * @param {string} url - The URL to fetch
 * @param {Object} data - The data to send
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} - The response data
 */
export async function post(url, data, options = {}) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(data),
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error posting to ${url}:`, error);
        throw error;
    }
}

/**
 * Check if an endpoint is reachable
 * @param {string} url - The URL to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} - Whether the endpoint is reachable
 */
export async function isEndpointReachable(url, timeout = 3000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Try HEAD request first
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok || response.status === 0; // status 0 is for no-cors mode
        } catch (headError) {
            // If HEAD fails, try GET
            const response = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok || response.status === 0; // status 0 is for no-cors mode
        }
    } catch (error) {
        console.error(`Error checking endpoint ${url}:`, error);
        return false;
    }
}
