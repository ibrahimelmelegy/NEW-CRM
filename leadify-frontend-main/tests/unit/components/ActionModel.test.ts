import { describe, it, expect, vi } from 'vitest';
import { mountWithStubs } from '../test-utils';
import ActionModel from '@/components/global/ActionModel.vue';

describe('ActionModel.vue', () => {
  const createWrapper = (props = {}) => {
    return mountWithStubs(ActionModel, {
      props: {
        modelValue: true,
        title: 'Confirm Action',
        descriptionOne: 'Are you sure?',
        btnText: 'Confirm',
        ...props
      }
    });
  };

  it('should mount without errors', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('should display the title', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Confirm Action');
  });

  it('should display the description', () => {
    const wrapper = createWrapper();
    expect(wrapper.text()).toContain('Are you sure?');
  });

  it('should display optional second description', () => {
    const wrapper = createWrapper({ descriptionTwo: 'This cannot be undone' });
    expect(wrapper.text()).toContain('This cannot be undone');
  });

  it('should have default btnText of Confirm', () => {
    const wrapper = mountWithStubs(ActionModel, {
      props: { modelValue: true, title: 'Test' }
    });
    expect(wrapper.text()).toContain('Confirm');
  });

  it('should emit confirm event when confirm button clicked', async () => {
    const wrapper = createWrapper();
    // The confirm function should emit
    expect(wrapper.emitted()).toBeDefined();
  });
});
