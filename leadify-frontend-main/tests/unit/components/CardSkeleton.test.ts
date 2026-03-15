/**
 * CardSkeleton Component - Unit Tests
 * =====================================
 * Tests for components/global/CardSkeleton.vue
 *
 * CardSkeleton composes multiple Skeleton sub-components to provide a
 * full-card loading placeholder. Since it has no props the tests verify
 * structure and that the Skeleton pieces are present.
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CardSkeleton from '@/components/global/CardSkeleton.vue';

// Stub the Skeleton child component so we don't need its styles/logic
const SkeletonStub = {
  template: '<div class="skeleton-stub" :data-variant="variant" :style="{ width: width }"></div>',
  props: ['variant', 'width', 'height', 'rounded', 'animated']
};

describe('CardSkeleton.vue', () => {
  // ============================================
  // Structure / Rendering
  // ============================================
  describe('Structure', () => {
    it('renders the card wrapper element', () => {
      const wrapper = mount(CardSkeleton, {
        global: { stubs: { Skeleton: SkeletonStub } }
      });

      expect(wrapper.find('.card-skeleton').exists()).toBe(true);
    });

    it('renders multiple Skeleton sub-components', () => {
      const wrapper = mount(CardSkeleton, {
        global: { stubs: { Skeleton: SkeletonStub } }
      });

      const skeletons = wrapper.findAllComponents(SkeletonStub);
      // Header (avatar + title + text) + 3 content lines + 2 footer buttons = 7
      expect(skeletons.length).toBeGreaterThanOrEqual(5);
    });

    it('renders an avatar skeleton in the header', () => {
      const wrapper = mount(CardSkeleton, {
        global: { stubs: { Skeleton: SkeletonStub } }
      });

      const avatarSkeletons = wrapper.findAll('[data-variant="avatar"]');
      expect(avatarSkeletons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders a title skeleton in the header', () => {
      const wrapper = mount(CardSkeleton, {
        global: { stubs: { Skeleton: SkeletonStub } }
      });

      const titleSkeletons = wrapper.findAll('[data-variant="title"]');
      expect(titleSkeletons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders text skeletons for content lines', () => {
      const wrapper = mount(CardSkeleton, {
        global: { stubs: { Skeleton: SkeletonStub } }
      });

      const textSkeletons = wrapper.findAll('[data-variant="text"]');
      expect(textSkeletons.length).toBeGreaterThanOrEqual(3);
    });

    it('renders button skeletons in the footer', () => {
      const wrapper = mount(CardSkeleton, {
        global: { stubs: { Skeleton: SkeletonStub } }
      });

      const buttonSkeletons = wrapper.findAll('[data-variant="button"]');
      expect(buttonSkeletons.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================
  // CSS Classes
  // ============================================
  describe('CSS Classes', () => {
    it('applies glass-card-premium class', () => {
      const wrapper = mount(CardSkeleton, {
        global: { stubs: { Skeleton: SkeletonStub } }
      });

      expect(wrapper.find('.card-skeleton').classes()).toContain('glass-card-premium');
    });
  });

  // ============================================
  // Skeleton Widths
  // ============================================
  describe('Skeleton Widths', () => {
    it('uses varying widths for text skeletons to simulate realistic content', () => {
      const wrapper = mount(CardSkeleton, {
        global: { stubs: { Skeleton: SkeletonStub } }
      });

      const textSkeletons = wrapper.findAll('[data-variant="text"]');
      const widths = new Set(textSkeletons.map(s => s.attributes('style')));

      // Widths should not all be the same - realistic skeletons vary
      expect(widths.size).toBeGreaterThan(1);
    });
  });
});
