import { describe, it, expect, vi } from 'vitest';
import { mountWithStubs } from '../test-utils';
import Avatar from '@/components/global/Avatar.vue';

describe('Avatar.vue', () => {
  it('should mount without errors', () => {
    const wrapper = mountWithStubs(Avatar, {
      props: { src: '/test.jpg' }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should render with avatar class', () => {
    const wrapper = mountWithStubs(Avatar, {
      props: { src: '/test.jpg' }
    });
    expect(wrapper.find('.avatar').exists()).toBe(true);
  });

  it('should show text fallback when text prop provided', () => {
    const wrapper = mountWithStubs(Avatar, {
      props: { text: 'John' }
    });
    expect(wrapper.find('.text').exists()).toBe(true);
    expect(wrapper.text()).toContain('J');
  });

  it('should apply big class when big prop is true', () => {
    const wrapper = mountWithStubs(Avatar, {
      props: { src: '/test.jpg', big: true }
    });
    expect(wrapper.find('.big').exists()).toBe(true);
  });

  it('should apply bigger class when bigger prop is true', () => {
    const wrapper = mountWithStubs(Avatar, {
      props: { src: '/test.jpg', bigger: true }
    });
    expect(wrapper.find('.bigger').exists()).toBe(true);
  });

  it('should uppercase the first letter of text', () => {
    const wrapper = mountWithStubs(Avatar, {
      props: { text: 'john' }
    });
    expect(wrapper.text()).toContain('J');
  });
});
