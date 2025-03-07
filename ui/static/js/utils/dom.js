// FusionLoom v0.2 - DOM Utilities

/**
 * Create an element with attributes and children
 * @param {string} tag - The tag name
 * @param {Object} attributes - The attributes to set
 * @param {Array|string|Node} children - The children to append
 * @returns {HTMLElement} - The created element
 */
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.entries(value).forEach(([prop, val]) => {
                element.style[prop] = val;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Append children
    if (children) {
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (child) {
                    appendChild(element, child);
                }
            });
        } else {
            appendChild(element, children);
        }
    }
    
    return element;
}

/**
 * Append a child to an element
 * @param {HTMLElement} parent - The parent element
 * @param {string|Node} child - The child to append
 */
function appendChild(parent, child) {
    if (typeof child === 'string' || typeof child === 'number') {
        parent.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
        parent.appendChild(child);
    }
}

/**
 * Query selector with error handling
 * @param {string} selector - The selector to query
 * @param {HTMLElement} parent - The parent element (defaults to document)
 * @returns {HTMLElement|null} - The found element or null
 */
export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Query selector all with error handling
 * @param {string} selector - The selector to query
 * @param {HTMLElement} parent - The parent element (defaults to document)
 * @returns {Array<HTMLElement>} - The found elements as an array
 */
export function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

/**
 * Add event listener with delegation
 * @param {HTMLElement} element - The element to listen on
 * @param {string} eventType - The event type
 * @param {string} selector - The selector to delegate to
 * @param {Function} handler - The event handler
 */
export function delegate(element, eventType, selector, handler) {
    element.addEventListener(eventType, event => {
        const target = event.target.closest(selector);
        if (target && element.contains(target)) {
            handler.call(target, event);
        }
    });
}

/**
 * Add multiple event listeners to an element
 * @param {HTMLElement} element - The element to listen on
 * @param {Object} events - Object with event types as keys and handlers as values
 */
export function addEventListeners(element, events) {
    Object.entries(events).forEach(([eventType, handler]) => {
        element.addEventListener(eventType, handler);
    });
}

/**
 * Remove multiple event listeners from an element
 * @param {HTMLElement} element - The element to remove listeners from
 * @param {Object} events - Object with event types as keys and handlers as values
 */
export function removeEventListeners(element, events) {
    Object.entries(events).forEach(([eventType, handler]) => {
        element.removeEventListener(eventType, handler);
    });
}

/**
 * Set multiple CSS properties on an element
 * @param {HTMLElement} element - The element to style
 * @param {Object} styles - Object with style properties as keys and values
 */
export function setStyles(element, styles) {
    Object.entries(styles).forEach(([property, value]) => {
        element.style[property] = value;
    });
}

/**
 * Toggle a class on an element
 * @param {HTMLElement} element - The element to toggle class on
 * @param {string} className - The class to toggle
 * @param {boolean} force - Whether to force add or remove
 */
export function toggleClass(element, className, force) {
    if (force === undefined) {
        element.classList.toggle(className);
    } else {
        if (force) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }
}

/**
 * Find the closest parent matching a selector
 * @param {HTMLElement} element - The element to start from
 * @param {string} selector - The selector to match
 * @returns {HTMLElement|null} - The found element or null
 */
export function closest(element, selector) {
    return element.closest(selector);
}

/**
 * Check if an element matches a selector
 * @param {HTMLElement} element - The element to check
 * @param {string} selector - The selector to match
 * @returns {boolean} - Whether the element matches the selector
 */
export function matches(element, selector) {
    return element.matches(selector);
}
