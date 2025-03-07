// FusionLoom v0.2 - Theme Module

/**
 * Apply a theme to the application
 * @param {string} theme - The theme to apply (dark, light, red, blue, green, purple, system)
 */
export function applyTheme(theme) {
    console.log('Applying theme:', theme);
    
    // Get all possible theme classes
    const themeClasses = [
        'theme-dark',
        'theme-light',
        'theme-red',
        'theme-blue',
        'theme-green',
        'theme-purple'
    ];
    
    // Remove all theme classes from document and body
    themeClasses.forEach(cls => {
        document.documentElement.classList.remove(cls);
        document.body.classList.remove(cls);
    });
    
    // Apply theme based on selection
    if (theme === 'system') {
        // For system theme, check user's preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = prefersDark ? 'dark' : 'light';
        
        // Apply theme class
        const themeClass = `theme-${systemTheme}`;
        document.documentElement.classList.add(themeClass);
        document.body.classList.add(themeClass);
        
        console.log('Applied system theme:', themeClass);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            const newThemeClass = `theme-${newSystemTheme}`;
            
            // Remove all theme classes
            themeClasses.forEach(cls => {
                document.documentElement.classList.remove(cls);
                document.body.classList.remove(cls);
            });
            
            // Apply new theme class
            document.documentElement.classList.add(newThemeClass);
            document.body.classList.add(newThemeClass);
            
            console.log('System theme changed to:', newThemeClass);
        });
    } else {
        // Apply the selected theme
        const themeClass = `theme-${theme}`;
        document.documentElement.classList.add(themeClass);
        document.body.classList.add(themeClass);
        
        // Force a repaint to ensure styles are applied
        setTimeout(() => {
            // This will force a complete repaint of the page
            const currentBodyBg = getComputedStyle(document.body).backgroundColor;
            document.body.style.backgroundColor = 'transparent';
            document.body.offsetHeight; // Trigger a reflow
            document.body.style.backgroundColor = '';
            
            console.log('Forced repaint for theme change');
        }, 10);
        
        console.log('Applied theme class:', themeClass);
    }
    
    // Update the theme selector dropdown
    const themeSelector = document.getElementById('theme');
    if (themeSelector) {
        themeSelector.value = theme;
    }
    
    // Ensure the modal also inherits the theme
    const modal = document.querySelector('.fusion-modal-content');
    if (modal) {
        // The modal will inherit the theme from CSS variables
        console.log('Applied theme to modal');
    }
}

/**
 * Initialize theme preview functionality
 */
export function initializeThemePreview() {
    const themeSelect = document.getElementById('theme');
    
    // Add change event listener to theme dropdown
    if (themeSelect) {
        themeSelect.addEventListener('change', () => {
            const selectedTheme = themeSelect.value;
            applyTheme(selectedTheme);
            
            // These functions will be called from the UI module
            // saveSettings();
            // showNotification(`Theme changed to ${selectedTheme}`, 'success');
        });
    }
}

/**
 * This function is no longer needed since we removed the theme preview section
 * Kept for compatibility but no longer does anything
 */
export function updateThemePreviewActive(selectedTheme) {
    return;
}
