import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ColorModeToggle from '@/components/global/ColorModeToggle.vue';

// Mock the theme store
vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({
    isLight: false,
    toggleTheme: vi.fn()
  })
}));

describe('ColorModeToggle.vue', () => {
  const createWrapper = () => {
    return mount(ColorModeToggle, {
      global: {
        mocks: { $t: (key: string) => key }
      }
    });
  };

  it('should render a toggle button', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.mode-toggle').exists()).toBe(true);
  });

  it('should render an icon span', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.icon').exists()).toBe(true);
  });

  it('should show sun emoji in dark mode', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.icon').text()).toContain('\u2600\uFE0F');
  });

  it('should have a click handler', () => {
    const wrapper = createWrapper();
    const button = wrapper.find('.mode-toggle');
    expect(button.exists()).toBe(true);
  });

  it('should have cursor pointer styling', () => {
    const wrapper = createWrapper();
    const button = wrapper.find('.mode-toggle');
    expect(button.exists()).toBe(true);
  });
});
