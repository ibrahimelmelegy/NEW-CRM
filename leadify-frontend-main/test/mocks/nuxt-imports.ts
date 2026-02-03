
import { vi } from 'vitest';
import { defineComponent as _defineComponent } from 'vue';

export const useAppConfig = () => ({
    icon: {
        mode: 'css',
        size: '1em',
        attrs: {},
        class: '',
        cssSelectorPrefix: 'i-',
        cssWherePseudo: true,
        cssLayer: '',
        serverKnownCssClasses: []
    }
});

export const useNuxtApp = () => ({
    vueApp: {
        component: () => null,
        _context: { provides: {} }
    },
    payload: { data: {} },
    runWithContext: (fn: any) => fn()
});

export const useRuntimeConfig = () => ({
    public: {},
    icon: {}
});

export const useAsyncData = () => ({});
export const useHead = () => ({});
export { defineComponent } from 'vue';
