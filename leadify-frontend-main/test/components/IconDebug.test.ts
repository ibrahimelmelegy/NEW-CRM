
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

// Mock #imports required by nuxt-icon
vi.mock('#imports', () => ({
    useAppConfig: () => ({
        icon: {
            mode: 'css', // Default mode
            size: '1em',
            attrs: {},
            class: ''
        }
    }),
    useNuxtApp: () => ({
        vueApp: {
            component: () => null // Don't resolve cached components
        }
    })
}));

// Import the component directly from the node_modules path
// Note: We need to use the absolute path or relative path from this test file
import NuxtIcon from '../../node_modules/nuxt-icon/dist/runtime/components/index.js';

describe('Icon Component', () => {
    it('renders correctly', async () => {
        const wrapper = mount(NuxtIcon, {
            props: {
                name: 'ph:user',
                size: '24'
            }
        });

        await wrapper.vm.$nextTick();
        console.log('Icon HTML:', wrapper.html());

        // Expecting some content (CSS mode usually renders a span with background-image or mask)
        // The previous CSS fix relies on .myicon display: inline-block.
        // This test verifies that the component ITSELF renders a root element that hasn't crashed.
        expect(wrapper.element).toBeTruthy();
        expect(wrapper.classes()).toContain('nuxt-icon'); // It usually adds this class
    });
});
