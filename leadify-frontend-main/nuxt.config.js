import { defineNuxtConfig } from 'nuxt/config';
import { visualizer } from 'rollup-plugin-visualizer';
import { fileURLToPath } from 'node:url'; // استيراد لضمان دقة المسارات

export default defineNuxtConfig({
  app: {
    head: {
      title: 'High Point CRM - Enterprise Customer Relationship Management',
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        { rel: 'icon', href: '/images/logo-shape.png' },
        { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },
      ],
      meta: [
        { 'http-equiv': 'x-ua-compatible', content: 'IE=edge' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: 'High Point CRM - Professional enterprise customer relationship management solution for sales, leads, and opportunity tracking.' },
        { name: 'theme-color', content: '#7849ff' },
      ],
    },
  },

  css: ['@/assets/styles/global.scss', '@/assets/css/microsoft-light.css'],

  sourcemap: {
    server: process.env.NODE_ENV !== 'production',
    client: process.env.NODE_ENV !== 'production'
  },

  vite: {
    plugins: [
      visualizer({
        filename: './stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/_injected.scss" as *;`,
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
    optimizeDeps: {
      include: [
        'vue',
        'element-plus',
        '@element-plus/icons-vue',
        'echarts',
        'vue-echarts',
        'lodash',
        '@tiptap/vue-3',
        '@tiptap/starter-kit',
        '@tiptap/extension-image',
        '@tiptap/extension-table',
        '@tiptap/extension-table-row',
        '@tiptap/extension-table-cell',
        '@tiptap/extension-table-header',
        'axios',
        'pinia',
        '@vueup/vue-quill',
        'vue-tel-input',
        'vue-advanced-cropper',
        'vue-animated-counter',
        '@vueuse/core',
        'quill-image-uploader',
        'vee-validate',
        'yup',
        'validator/lib/isEmail',
        'jspdf',
        'jspdf-autotable',
        '@vue/devtools-core',
        '@vue/devtools-kit'
      ]
    },
  },

  modules: [
    '@element-plus/nuxt',
    '@nuxt/icon',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
  ],

  // ✅ الحل النهائي لمشكلة ENOENT في Nuxt 4
  i18n: {
    vueI18n: './i18n.config.ts',
    locales: [
      { code: 'en', name: 'English', file: 'en.json', dir: 'ltr' },
      { code: 'ar', name: 'العربية', file: 'ar.json', dir: 'rtl' },
    ],
    defaultLocale: 'en',
    lazy: true,
    restructureDir: '.',
    // تحويل المسار النسبي إلى مسار مطلق متوافق مع نظام Windows
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      fallbackLocale: 'en',
    },
  },

  icon: {
    componentName: 'NuxtIcon',
    class: 'nuxt-icon'
  },

  image: {
    format: ['webp'],
    quality: 80,
  },

  runtimeConfig: {
    public: {
      API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api/',
      BASE_URL: process.env.BASE_URL || 'http://localhost:3060/',
      BUCKET_URL: process.env.BUCKET_URL || 'http://localhost:3000/',
    },
  },

  tailwindcss: {
    configPath: 'tailwind.config.js',
    cssPath: '~/assets/css/tailwind.css',
  },

  imports: {
    dirs: ['composables/**'],
  },

  ssr: false,

  devtools: {
    enabled: true,
    vscode: { enabled: true }
  },

  compatibilityDate: '2024-11-16',

  nitro: {
    devProxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        prependPath: true,
      }
    }
  }
});