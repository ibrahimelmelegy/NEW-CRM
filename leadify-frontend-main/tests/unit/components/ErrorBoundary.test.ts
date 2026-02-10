import { describe, it, expect, vi } from 'vitest';
import { mountWithStubs } from '../test-utils';
import ErrorBoundary from '@/components/global/ErrorBoundary.vue';

describe('ErrorBoundary.vue', () => {
  it('should mount without errors', () => {
    const wrapper = mountWithStubs(ErrorBoundary, {
      slots: { default: '<div class=child-content>Hello</div>' }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should render slot content when no error', () => {
    const wrapper = mountWithStubs(ErrorBoundary, {
      slots: { default: '<div class=child-content>Hello</div>' }
    });
    expect(wrapper.find('.child-content').exists()).toBe(true);
    expect(wrapper.text()).toContain('Hello');
  });

  it('should not show error UI when no error', () => {
    const wrapper = mountWithStubs(ErrorBoundary, {
      slots: { default: '<div>Normal content</div>' }
    });
    expect(wrapper.find('.error-boundary').exists()).toBe(false);
  });

  it('should accept fallback prop', () => {
    const wrapper = mountWithStubs(ErrorBoundary, {
      props: { fallback: 'Custom error message' },
      slots: { default: '<div>Content</div>' }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
