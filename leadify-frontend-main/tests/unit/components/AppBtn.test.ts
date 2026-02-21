/**
 * AppBtn Component - Unit Tests
 * ==============================
 * Tests for components/global/AppBtn.vue
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AppBtn from '@/components/global/AppBtn.vue';

// Mock Icon component
const IconStub = {
  template: '<span class="icon-stub"></span>',
  props: ['name', 'size']
};

// Mock el-button
const ElButtonStub = {
  template: '<button :type="type" :disabled="loading"><slot /></button>',
  props: ['type', 'size', 'link', 'nativeType', 'plain', 'loading']
};

describe('AppBtn.vue', () => {
  // ============================================
  // Basic Rendering
  // ============================================
  describe('Basic Rendering', () => {
    it('should render with text prop', () => {
      const wrapper = mount(AppBtn, {
        props: {
          text: 'Click Me'
        },
        global: {
          stubs: {
            'el-button': ElButtonStub,
            Icon: IconStub
          }
        }
      });

      expect(wrapper.text()).toContain('Click Me');
    });

    it('should render without icon when not provided', () => {
      const wrapper = mount(AppBtn, {
        props: {
          text: 'No Icon'
        },
        global: {
          stubs: {
            'el-button': ElButtonStub,
            Icon: IconStub
          }
        }
      });

      expect(wrapper.findComponent(IconStub).exists()).toBe(false);
    });

    it('should render with icon when provided', () => {
      const wrapper = mount(AppBtn, {
        props: {
          text: 'With Icon',
          icon: 'IconPlus'
        },
        global: {
          stubs: {
            'el-button': ElButtonStub,
            Icon: IconStub
          }
        }
      });

      expect(wrapper.findComponent(IconStub).exists()).toBe(true);
    });
  });

  // ============================================
  // Props
  // ============================================
  describe('Props', () => {
    it('should have default size of large', () => {
      const wrapper = mount(AppBtn, {
        props: {
          text: 'Test'
        },
        global: {
          stubs: {
            'el-button': ElButtonStub,
            Icon: IconStub
          }
        }
      });

      // Check component props
      expect(wrapper.props('size')).toBe('large');
    });

    it('should have default plain as false', () => {
      const wrapper = mount(AppBtn, {
        props: {
          text: 'Test'
        },
        global: {
          stubs: {
            'el-button': ElButtonStub,
            Icon: IconStub
          }
        }
      });

      expect(wrapper.props('plain')).toBe(false);
    });

    it('should have default link as false', () => {
      const wrapper = mount(AppBtn, {
        props: {
          text: 'Test'
        },
        global: {
          stubs: {
            'el-button': ElButtonStub,
            Icon: IconStub
          }
        }
      });

      expect(wrapper.props('link')).toBe(false);
    });

    it('should have default loading as false', () => {
      const wrapper = mount(AppBtn, {
        props: {
          text: 'Test'
        },
        global: {
          stubs: {
            'el-button': ElButtonStub,
            Icon: IconStub
          }
        }
      });

      expect(wrapper.props('loading')).toBe(false);
    });

    it('should accept custom type', () => {
      const wrapper = mount(AppBtn, {
        props: {
          text: 'Primary',
          type: 'primary'
        },
        global: {
          stubs: {
            'el-button': ElButtonStub,
            Icon: IconStub
          }
        }
      });

      expect(wrapper.props('type')).toBe('primary');
    });
  });

  // ============================================
  // Loading State
  // ============================================
  describe('Loading State', () => {
    it('should show loading state when loading is true', () => {
      const wrapper = mount(AppBtn, {
        props: {
          text: 'Loading...',
          loading: true
        },
        global: {
          stubs: {
            'el-button': ElButtonStub,
            Icon: IconStub
          }
        }
      });

      expect(wrapper.props('loading')).toBe(true);
    });
  });
});
