// High Point Technology CRM Frontend Configuration
import { defineNuxtConfig } from 'nuxt/config';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineNuxtConfig({
  ssr: false,
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'fade', mode: 'out-in' },
    head: {
      title: 'High Point Technology CRM - Enterprise Customer Relationship Management',
      htmlAttrs: {
        lang: 'en'
      },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' }
      ],
      script: [],
      meta: [
        { 'http-equiv': 'x-ua-compatible', content: 'IE=edge' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        {
          name: 'description',
          content:
            'High Point Technology CRM - Professional enterprise customer relationship management solution for sales, leads, and opportunity tracking.'
        },
        { name: 'theme-color', content: '#7849ff' }
      ]
    }
  },

  css: [
    '@/assets/styles/global.scss',
    '@/assets/scss/transitions.scss',
    '@/assets/css/dark-theme.css',
    '@/assets/css/microsoft-light.css',
    '@/assets/css/mobile.scss'
  ],

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
        brotliSize: true
      })
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/_injected.scss" as *;`,
          silenceDeprecations: ['legacy-js-api']
        }
      }
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
        'xlsx',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'errx'
      ]
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split heavy vendor libraries into separate chunks for better caching
            if (id.includes('node_modules/echarts') || id.includes('node_modules/vue-echarts') || id.includes('node_modules/zrender')) {
              return 'vendor-charts';
            }
            if (id.includes('node_modules/element-plus')) {
              return 'vendor-element-plus';
            }
            if (id.includes('node_modules/@tiptap') || id.includes('node_modules/prosemirror')) {
              return 'vendor-editor';
            }
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/xlsx')) {
              return 'vendor-export';
            }
            if (id.includes('node_modules/lodash')) {
              return 'vendor-lodash';
            }
          }
        }
      }
    }
  },

  modules: [
    '@vite-pwa/nuxt',
    '@element-plus/nuxt',
    '@nuxt/icon',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@nuxtjs/i18n'
  ],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Leadify CRM',
      short_name: 'Leadify',
      description: 'Complete CRM Solution',
      theme_color: '#6366f1',
      background_color: '#0f172a',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/api\..*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: { maxEntries: 100, maxAgeSeconds: 300 }
          }
        }
      ]
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: false
    }
  },

  // ✅ الحل النهائي لمشكلة ENOENT في Nuxt 4
  i18n: {
    vueI18n: './i18n.config.ts',
    locales: [
      { code: 'en', name: 'English', file: 'en.json', dir: 'ltr' },
      { code: 'ar', name: 'العربية', file: 'ar.json', dir: 'rtl' }
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
      fallbackLocale: 'en'
    }
  },

  icon: {
    componentName: 'NuxtIcon',
    class: 'nuxt-icon'
  },

  image: {
    format: ['webp', 'avif'],
    quality: 80,
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    },
    densities: [1, 2],
    presets: {
      avatar: {
        modifiers: { fit: 'cover', format: 'webp', quality: 75, width: 80, height: 80 }
      },
      thumbnail: {
        modifiers: { fit: 'cover', format: 'webp', quality: 70, width: 200, height: 200 }
      }
    }
  },

  runtimeConfig: {
    public: {
      API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api/',
      BASE_URL: process.env.BASE_URL || 'http://localhost:3060/',
      BUCKET_URL: process.env.BUCKET_URL || 'http://localhost:3000/',
      BOOKING_BASE_URL: process.env.BOOKING_BASE_URL || ''
    }
  },

  tailwindcss: {
    configPath: 'tailwind.config.js',
    cssPath: '~/assets/css/tailwind.css'
  },

  imports: {
    dirs: ['composables/**']
  },

  // Experimental performance features
  experimental: {
    // Payload optimization for smaller client-side payloads
    payloadExtraction: true,
    // Enable async entry for better code splitting
    asyncEntry: true
  },

  devtools: {
    enabled: true,
    vscode: { enabled: true }
  },

  compatibilityDate: '2024-11-16',

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        prependPath: true
      }
    }
  }
});
