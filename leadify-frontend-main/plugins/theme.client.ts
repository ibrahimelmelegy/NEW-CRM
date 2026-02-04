/**
 * 🎨 Theme Initialization Plugin
 * Applies the saved theme class IMMEDIATELY on client-side load
 * This runs before components mount, preventing theme flash on refresh
 * 
 * IMPORTANT: This plugin only manages the class. All styling is handled by:
 * - assets/css/microsoft-light.css (Glass theme)
 * - assets/scss/theme-variables.scss (Base theme variables)
 */

export default defineNuxtPlugin((nuxtApp) => {
    // Run only on client side
    if (process.client) {
        const applyTheme = () => {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                document.body.classList.add('light-theme');
            } else {
                document.body.classList.remove('light-theme');
            }
        };

        // Apply theme immediately
        applyTheme();

        // Also apply on app:mounted to ensure consistency
        nuxtApp.hook('app:mounted', applyTheme);

        // Provide toggle functions globally
        nuxtApp.provide('enableLightMode', () => {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        });

        nuxtApp.provide('disableLightMode', () => {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
        });
    }
});
