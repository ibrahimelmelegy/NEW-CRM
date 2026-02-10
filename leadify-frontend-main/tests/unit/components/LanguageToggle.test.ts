import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LanguageToggle from '@/components/global/LanguageToggle.vue';

describe('LanguageToggle.vue', () => {
  const createWrapper = () => {
    return mount(LanguageToggle, {
      global: {
        mocks: {
          $t: (key: string) => key
        },
        stubs: { Icon: true }
      }
    });
  };

  it('should mount without errors', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('should render a toggle button', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.lang-toggle').exists()).toBe(true);
  });

  it('should display AR text when locale is en', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('AR');
  });

  it('should have premium-nav-btn class', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.premium-nav-btn').exists()).toBe(true);
  });
});
