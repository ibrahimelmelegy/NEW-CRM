import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import type { Pinia } from 'pinia';

/**
 * Pinia Persistence Plugin
 * Automatically persists specified stores to localStorage
 */
export default defineNuxtPlugin(nuxtApp => {
  // Only run on client side
  if (import.meta.client) {
    const pinia = nuxtApp.$pinia as Pinia;

    if (pinia) {
      pinia.use(piniaPluginPersistedstate);
    }
  }
});
