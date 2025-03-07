// FusionLoom v0.2 - Validation Utilities

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {any} value - The value to check
 * @returns {boolean} - Whether the value is empty
 */
export function isEmpty(value) {
    if (value === null || value === undefined) {
        return true;
    }
    
    if (typeof value === 'string') {
        return value.trim() === '';
    }
    
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    
    if (typeof value === 'object') {
        return Object.keys(value).length === 0;
    }
    
    return false;
}

/**
 * Check if a value is a valid URL
 * @param {string} value - The value to check
 * @returns {boolean} - Whether the value is a valid URL
 */
export function isValidUrl(value) {
    try {
        new URL(value);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Check if a value is a valid email address
 * @param {string} value - The value to check
 * @returns {boolean} - Whether the value is a valid email address
 */
export function isValidEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
}

/**
 * Check if a value is a valid IP address (IPv4 or IPv6)
 * @param {string} value - The value to check
 * @returns {boolean} - Whether the value is a valid IP address
 */
export function isValidIpAddress(value) {
    // IPv4 regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 regex (simplified)
    const ipv6Regex = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i;
    
    return ipv4Regex.test(value) || ipv6Regex.test(value);
}

/**
 * Check if a value is a valid port number (1-65535)
 * @param {number|string} value - The value to check
 * @returns {boolean} - Whether the value is a valid port number
 */
export function isValidPort(value) {
    const port = parseInt(value, 10);
    return !isNaN(port) && port >= 1 && port <= 65535;
}

/**
 * Check if a value is a valid hostname
 * @param {string} value - The value to check
 * @returns {boolean} - Whether the value is a valid hostname
 */
export function isValidHostname(value) {
    // Hostname regex (simplified)
    const hostnameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return hostnameRegex.test(value);
}

/**
 * Check if a value is a number
 * @param {any} value - The value to check
 * @returns {boolean} - Whether the value is a number
 */
export function isNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Check if a value is an integer
 * @param {any} value - The value to check
 * @returns {boolean} - Whether the value is an integer
 */
export function isInteger(value) {
    return Number.isInteger(Number(value));
}

/**
 * Check if a value is within a range
 * @param {number} value - The value to check
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {boolean} - Whether the value is within the range
 */
export function isInRange(value, min, max) {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
}

/**
 * Check if a value matches a regex pattern
 * @param {string} value - The value to check
 * @param {RegExp} pattern - The regex pattern
 * @returns {boolean} - Whether the value matches the pattern
 */
export function matchesPattern(value, pattern) {
    return pattern.test(value);
}

/**
 * Validate a form field
 * @param {HTMLElement} field - The field to validate
 * @param {Function} validationFn - The validation function
 * @param {string} errorMessage - The error message to display
 * @returns {boolean} - Whether the field is valid
 */
export function validateField(field, validationFn, errorMessage) {
    const isValid = validationFn(field.value);
    
    if (!isValid) {
        // Add error class
        field.classList.add('error');
        
        // Show error message
        let errorElement = field.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('error-message')) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        }
        errorElement.textContent = errorMessage;
    } else {
        // Remove error class
        field.classList.remove('error');
        
        // Remove error message
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.remove();
        }
    }
    
    return isValid;
}

/**
 * Validate a form
 * @param {HTMLFormElement} form - The form to validate
 * @param {Object} validations - Object with field names as keys and validation objects as values
 * @returns {boolean} - Whether the form is valid
 */
export function validateForm(form, validations) {
    let isValid = true;
    
    Object.entries(validations).forEach(([fieldName, validation]) => {
        const field = form.elements[fieldName];
        if (field) {
            const fieldValid = validateField(field, validation.fn, validation.message);
            isValid = isValid && fieldValid;
        }
    });
    
    return isValid;
}
