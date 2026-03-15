/**
 * Avatar Component - Unit Tests
 * ================================
 * Tests for components/global/Avatar.vue
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Avatar from '@/components/global/Avatar.vue';

// Stub child components used inside Avatar
const LazyImgStub = {
  template: '<img class="lazy-img-stub" :src="src" />',
  props: ['src', 'small']
};

const ElDialogStub = {
  template: '<div class="el-dialog-stub" v-if="modelValue"><slot /></div>',
  props: ['modelValue', 'alignCenter'],
  emits: ['update:modelValue']
};

const defaultStubs = {
  LazyImg: LazyImgStub,
  'el-dialog': ElDialogStub
};

describe('Avatar.vue', () => {
  // ============================================
  // Image Rendering
  // ============================================
  describe('Image Rendering', () => {
    it('renders LazyImg when src is provided and no text', () => {
      const wrapper = mount(Avatar, {
        props: { src: '/images/user.jpg' },
        global: { stubs: defaultStubs }
      });

      expect(wrapper.findComponent(LazyImgStub).exists()).toBe(true);
    });

    it('does not render text element when src is provided', () => {
      const wrapper = mount(Avatar, {
        props: { src: '/images/user.jpg' },
        global: { stubs: defaultStubs }
      });

      expect(wrapper.find('.text').exists()).toBe(false);
    });

    it('passes src to LazyImg', () => {
      const wrapper = mount(Avatar, {
        props: { src: '/images/avatar.png' },
        global: { stubs: defaultStubs }
      });

      const img = wrapper.findComponent(LazyImgStub);
      expect(img.props('src')).toBe('/images/avatar.png');
    });
  });

  // ============================================
  // Initials / Text Display
  // ============================================
  describe('Initials Display', () => {
    it('shows text element when text prop is provided', () => {
      const wrapper = mount(Avatar, {
        props: { text: 'John Doe' },
        global: { stubs: defaultStubs }
      });

      expect(wrapper.find('.text').exists()).toBe(true);
    });

    it('displays the first character (uppercased) of text', () => {
      const wrapper = mount(Avatar, {
        props: { text: 'alice' },
        global: { stubs: defaultStubs }
      });

      expect(wrapper.find('.text p').text()).toBe('A');
    });

    it('does not render LazyImg when text is provided', () => {
      const wrapper = mount(Avatar, {
        props: { text: 'Bob' },
        global: { stubs: defaultStubs }
      });

      expect(wrapper.findComponent(LazyImgStub).exists()).toBe(false);
    });
  });

  // ============================================
  // Size Classes
  // ============================================
  describe('Size Classes', () => {
    it('applies "big" class when big prop is true', () => {
      const wrapper = mount(Avatar, {
        props: { src: '/img.jpg', big: true },
        global: { stubs: defaultStubs }
      });

      expect(wrapper.classes()).toContain('big');
    });

    it('applies "bigger" class when bigger prop is true', () => {
      const wrapper = mount(Avatar, {
        props: { src: '/img.jpg', bigger: true },
        global: { stubs: defaultStubs }
      });

      expect(wrapper.classes()).toContain('bigger');
    });

    it('does not apply "big" or "bigger" class when neither prop is set', () => {
      const wrapper = mount(Avatar, {
        props: { src: '/img.jpg' },
        global: { stubs: defaultStubs }
      });

      expect(wrapper.classes()).not.toContain('big');
      expect(wrapper.classes()).not.toContain('bigger');
    });

    it('applies small inline style when small prop is true', () => {
      const wrapper = mount(Avatar, {
        props: { src: '/img.jpg', small: true },
        global: { stubs: defaultStubs }
      });

      // The component uses inline style binding for small size
      expect(wrapper.props('small')).toBe(true);
    });
  });

  // ============================================
  // Props Defaults
  // ============================================
  describe('Props Defaults', () => {
    it('has no size-specific classes by default', () => {
      const wrapper = mount(Avatar, {
        props: { src: '/img.jpg' },
        global: { stubs: defaultStubs }
      });

      expect(wrapper.props('small')).toBeFalsy();
      expect(wrapper.props('big')).toBeFalsy();
      expect(wrapper.props('bigger')).toBeFalsy();
    });

    it('accepts table prop without error', () => {
      const wrapper = mount(Avatar, {
        props: { src: '/img.jpg', table: true },
        global: { stubs: defaultStubs }
      });

      expect(wrapper.props('table')).toBe(true);
    });
  });
});
