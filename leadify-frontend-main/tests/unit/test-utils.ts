/**
 * Test Utilities - Component Mount Helper
 * ========================================
 * Pre-configured mount function with all common stubs and mocks
 * to avoid repeating boilerplate in every test file.
 */

import { mount, shallowMount, type ComponentMountingOptions } from '@vue/test-utils';
import { vi } from 'vitest';

// Default stubs for all Element Plus and custom components
const defaultStubs: Record<string, any> = {
  // Nuxt components
  Icon: { template: '<span class="icon-stub" />', props: ['name', 'size'] },
  NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
  NuxtImg: { template: '<img :src="src" :alt="alt" />', props: ['src', 'alt', 'format', 'quality'] },
  LazyImg: { template: '<img :src="src" />', props: ['src', 'small'] },
  Teleport: { template: '<div><slot /></div>' },
  Transition: { template: '<div><slot /></div>' },
  ClientOnly: { template: '<div><slot /></div>' },

  // Element Plus components
  'el-form': { template: '<form @submit.prevent><slot /></form>', props: ['model', 'rules', 'labelPosition', 'validationSchema'] },
  'el-form-item': { template: '<div class="el-form-item"><slot /></div>', props: ['label', 'prop'] },
  'el-button': { template: '<button :type="nativeType" :disabled="loading || disabled"><slot /></button>', props: ['type', 'size', 'loading', 'disabled', 'nativeType', 'plain', 'link'] },
  'el-input': { template: '<input :placeholder="placeholder" :type="type" />', props: ['modelValue', 'placeholder', 'type', 'disabled'] },
  'el-select': { template: '<select><slot /></select>', props: ['modelValue', 'placeholder', 'size', 'multiple', 'filterable'] },
  'el-option': { template: '<option :value="value">{{ label }}</option>', props: ['label', 'value'] },
  'el-tabs': { template: '<div class="el-tabs"><slot /></div>', props: ['modelValue'] },
  'el-tab-pane': { template: '<div class="el-tab-pane"><slot /></div>', props: ['label', 'name'] },
  'el-dropdown': { template: '<div class="el-dropdown"><slot /></div>', props: ['trigger'] },
  'el-dropdown-menu': { template: '<div class="el-dropdown-menu"><slot /></div>' },
  'el-dropdown-item': { template: '<div class="el-dropdown-item"><slot /></div>' },
  'el-table': { template: '<div class="el-table"><slot /></div>', props: ['data'] },
  'el-table-column': { template: '<div />', props: ['prop', 'label', 'width'] },
  'el-pagination': { template: '<div class="el-pagination" />', props: ['total', 'pageSize', 'currentPage'] },
  'el-progress': { template: '<div class="el-progress"><slot /></div>', props: ['type', 'percentage', 'color', 'width'] },
  'el-checkbox': { template: '<input type="checkbox" />', props: ['label', 'modelValue'] },
  'el-dialog': { template: '<div class="el-dialog" v-if="modelValue"><slot /><slot name="footer" /></div>', props: ['modelValue', 'width'] },
  'el-menu': { template: '<nav class="el-menu"><slot /></nav>', props: ['collapse', 'defaultOpeneds'] },
  'el-menu-item': { template: '<div class="el-menu-item"><slot /><slot name="title" /></div>', props: ['index'] },
  'el-sub-menu': { template: '<div class="el-sub-menu"><slot /><slot name="title" /></div>', props: ['index'] },
  'el-icon': { template: '<span><slot /></span>' },
  'el-switch': { template: '<input type="checkbox" />', props: ['modelValue'] },
  'el-empty': { template: '<div class="el-empty">{{ description }}</div>', props: ['description', 'image'] },
  'el-spinner': { template: '<div class="el-spinner" />', props: ['size'] },
  'el-notification': { template: '<div />' },
  'el-radio-group': { template: '<div><slot /></div>', props: ['modelValue'] },
  'el-radio': { template: '<label><input type="radio" />{{ label }}</label>', props: ['label', 'value'] },
  'el-upload': { template: '<div class="el-upload"><slot /></div>', props: ['action', 'fileList'] },

  // Custom form input components
  InputText: { template: '<div class="input-text-stub"><input :name="name" :placeholder="label" /></div>', props: ['label', 'name', 'value', 'type', 'placeholder'] },
  InputSelect: { template: '<div class="input-select-stub"><select :name="name"></select></div>', props: ['label', 'name', 'options', 'value', 'isMultiple'] },
  InputDate: { template: '<div class="input-date-stub"><input :name="name" type="date" /></div>', props: ['label', 'name', 'value', 'placeholder', 'disabledDate'] },
  InputPhone: { template: '<div class="input-phone-stub"><input :name="name" type="tel" /></div>', props: ['label', 'name', 'value', 'mode'] },
  InputTextArea: { template: '<div class="input-textarea-stub"><textarea :name="name"></textarea></div>', props: ['label', 'name', 'value', 'rows'] },
  InputFile: { template: '<div class="input-file-stub"><input type="file" /></div>', props: ['label', 'name', 'value'] },
  InputNumber: { template: '<div class="input-number-stub"><input :name="name" type="number" /></div>', props: ['label', 'name', 'value'] },
  InputSwitch: { template: '<div class="input-switch-stub"><input type="checkbox" /></div>', props: ['label', 'name', 'value', 'activeColor'] },

  // Custom global components
  AppTable: { template: '<div class="app-table-stub" />', props: ['columns', 'data', 'filterOptions', 'pageInfo'] },
  AppBtn: { template: '<button class="app-btn-stub"><slot /></button>', props: ['text', 'icon', 'type', 'loading', 'size'] },
  ActionModel: { template: '<div class="action-model-stub"><slot /></div>', props: ['title', 'modelValue'] },
  ActivityTimeline: { template: '<div class="activity-timeline-stub" />', props: ['activities'] },
  AIEmailAssist: { template: '<div />', props: ['modelValue', 'context'] },
  AISummarizer: { template: '<div />', props: ['modelValue', 'initialText'] },
  ProfessionalBackground: { template: '<div class="professional-bg-stub" />' },
  Avatar: { template: '<div class="avatar-stub" />', props: ['src', 'text', 'small', 'big'] },
  Setting: { template: '<span />' }
};

// Default mocks for $t and $i18n
const defaultMocks = {
  $t: (key: string) => key,
  $i18n: { locale: 'en' }
};

/**
 * Mount a component with all common stubs pre-configured.
 * Use this for tests that need to verify rendered HTML structure.
 */
export function mountWithStubs(component: any, options: any = {}) {
  const { global: globalOptions = {}, ...restOptions } = options;
  const { stubs: extraStubs = {}, mocks: extraMocks = {}, ...restGlobal } = globalOptions;

  return mount(component, {
    global: {
      stubs: { ...defaultStubs, ...extraStubs },
      mocks: { ...defaultMocks, ...extraMocks },
      ...restGlobal
    },
    ...restOptions
  });
}

/**
 * Shallow mount a component with common mocks.
 * Faster for tests that only check top-level rendering.
 */
export function shallowMountWithStubs(component: any, options: any = {}) {
  const { global: globalOptions = {}, ...restOptions } = options;
  const { stubs: extraStubs = {}, mocks: extraMocks = {}, ...restGlobal } = globalOptions;

  return shallowMount(component, {
    global: {
      stubs: { ...defaultStubs, ...extraStubs },
      mocks: { ...defaultMocks, ...extraMocks },
      ...restGlobal
    },
    ...restOptions
  });
}

/**
 * Count occurrences of a CSS class in the rendered HTML.
 */
export function countClass(wrapper: any, className: string): number {
  return wrapper.findAll(`.${className}`).length;
}

/**
 * Check if component HTML contains no hardcoded Tailwind neutral text classes.
 */
export function hasNoHardcodedNeutralColors(html: string): boolean {
  // These should be overridden by _utilities.scss, but templates shouldn't add new ones
  const forbidden = ['text-neutral-900', 'text-neutral-800', 'text-neutral-700', 'text-neutral-600'];
  return !forbidden.some(cls => html.includes(cls));
}

// Re-export vitest utilities for convenience
export { vi } from 'vitest';
export { mount, shallowMount } from '@vue/test-utils';
