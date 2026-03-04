/**
 * Type augmentations for globals mocked in the Vitest test setup.
 * Uses `var` (not `function`) with permissive `any` return types so these
 * declarations don't shadow Nuxt's auto-imported composable types in
 * component files — those types come from .nuxt/types/auto-imports.d.ts.
 */

declare global {
  var useApiFetch: (...args: any[]) => Promise<any>;
  var useI18n: (...args: any[]) => any;
  var useRuntimeConfig: (...args: any[]) => any;
  var useCookie: (name: string) => { value: string | null };
  var useRoute: () => {
    fullPath: string;
    path: string;
    params: Record<string, string>;
    query: Record<string, string>;
  };
  var useRouter: () => {
    push: (path: string | object) => void;
    replace: (path: string | object) => void;
    go: (delta: number) => void;
    back: () => void;
  };
  var navigateTo: (path: string | object) => void;
  var ElNotification: any;
}

export {};
