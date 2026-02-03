import { useMain } from "~/stores/common";

export default defineNuxtPlugin((nuxtApp) => {
    // Only run on client side
    if (process.client) {
        const mainStore = useMain();

        // Function to apply theme to body
        const applyTheme = (isLight: boolean) => {
            if (isLight) {
                document.body.classList.add('light-mode');
                localStorage.setItem('theme', 'light');
            } else {
                document.body.classList.remove('light-mode');
                localStorage.setItem('theme', 'dark');
            }
        };

        // Initialize from localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            mainStore.isLight = true;
            applyTheme(true);
        } else {
            mainStore.isLight = false;
            applyTheme(false);
        }

        // Watch for store changes to keep body class in sync
        // This handles changes from ANY component
        watch(() => mainStore.isLight, (isLight) => {
            applyTheme(isLight);
        });
    }
});
