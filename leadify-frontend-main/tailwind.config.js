/** @type {import('tailwindcss').Config} */
module.exports = {
  // ✅ Fix: Ensure all Nuxt directories are scanned for classes
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 Synced with variables.scss (Element Plus)
        primary: {
          DEFAULT: '#7849ff', // Matches $primary
          hover: '#9360ff',   // Matches $primary-hover
          light: '#f8f7fa',   // Matches $primary-light
          'light-hover': '#9360ff',
          'light-active': '#c2b6c1',
          // Shades derived from your previous config for utility usage
          50: '#F2EDFF',
          100: '#D5C7FF',
          200: '#C1ABFF',
          300: '#A585FF',
          400: '#9360FF',
          500: '#7849FF', // Base Primary
          600: '#6D42E8',
          700: '#553485',
          800: '#42288C',
          900: '#321F68',
        },

        // System Status Colors (Synced with variables.scss)
        success: '#2fb350', // $success
        danger: '#bf2c24',  // $danger
        warning: '#bf9900', // $yellow
        info: '#e7e7e7',    // $info
        gray: '#7d7d7d',    // $gray
        brown: '#686252',   // $brown

        // Dark Theme / UI Colors
        obsidian: '#0B0A12',
        sidebar: '#111019',
        'card-surface': '#16151F',
        'border-stroke': '#2D2B3B',

        // Text Colors
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',

        // Gradients
        'gradient-start': '#7C3AED',
        'gradient-end': '#C026D3',
      },
      spacing: {
        main: '24px',
        secondary: '16px',
      },
      // Un-comment if you need custom fonts sizes later
      // fontSize: { ... }
    },
  },
  plugins: [],
};