/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Extend Global for Test Mocks
declare global {
  var useCookie: any;
  var definePageMeta: any;
}

export {};
