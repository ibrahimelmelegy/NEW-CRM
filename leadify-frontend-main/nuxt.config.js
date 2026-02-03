import { defineNuxtConfig } from 'nuxt/config';

import { visualizer } from 'rollup-plugin-visualizer';



export default defineNuxtConfig({

  app: {

    // pageTransition: { name: "page" , mode:"out-in" },

    head: {

      title: 'App HP Tech',

      link: [

        { rel: 'icon', href: '/images/logo-shape.png' },

        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },

      ],

      meta: [

        { 'http-equiv': 'x-ua-compatible', content: 'IE=edge' },

        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },

      ],

    },

  },



  // Fix Content-Length Mismatch in Dev

  nitro: {

    compressPublicAssets: false,

    timing: false

  },



  css: ['@/assets/styles/global.scss'],

  sourcemap: {

    server: false,

    client: false

  },

  vite: {

    css: {

      preprocessorOptions: {

        scss: {

          additionalData: `@use "@/assets/styles/_injected.scss" as *;`,

        },

      },

    },

    optimizeDeps: {

      force: true, // FORCE re-bundling of dependencies

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

        // Add frequently re-bundled deps to prevent reload loop

        '@vueup/vue-quill',

        'vue-tel-input',

        'vue-advanced-cropper',

        'vue-animated-counter',

        '@vueuse/core',

        'quill-image-uploader'

      ]

    },

    build: {

      chunkSizeWarningLimit: 1000,

      rollupOptions: {

        output: {

          manualChunks(id) {

            if (id.includes('node_modules')) {

              if (id.includes('element-plus')) return 'ui-vendor';

              if (id.includes('echarts') || id.includes('vue-echarts')) return 'charts-vendor';

              if (id.includes('@tiptap') || id.includes('prosemirror')) return 'editor-vendor';

              return 'vendor';

            }

          }

        }

      }

    },

    plugins: [visualizer({ open: false, filename: 'stats.html' })],

  },



  modules: ['@element-plus/nuxt', '@nuxt/icon', '@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxt/image', '@vueuse/nuxt'],

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

  devtools: { enabled: true, vscode: { enabled: true } },



  // pwa: {

  //   workbox: {

  //     runtimeCaching: [

  //       {

  //         urlPattern: '.*', // Match all requests

  //         handler: 'NetworkFirst', // Fallback to network

  //       },

  //     ],

  //   },

  // },



  compatibilityDate: '2024-11-16',

});