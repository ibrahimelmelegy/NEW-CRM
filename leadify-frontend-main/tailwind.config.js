/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      colors: {
        // 🔮 Synced with premium-theme.scss variables
        primary: {
          DEFAULT: 'var(--accent-purple)',
          hover: '#9360FF',
          light: 'var(--bg-card)'
        },

        // System Layout System
        obsidian: 'var(--bg-obsidian)',
        sidebar: 'var(--bg-sidebar)',
        'card-surface': 'var(--bg-card)',
        'border-stroke': 'var(--border-stroke)',
        'border-glass': 'var(--border-glass)',

        // Dynamic Text Colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',

        // Brand Accents & Gradients Hooks
        'accent-purple': 'var(--accent-purple)',
        'accent-indigo': 'var(--accent-indigo)',
        'accent-cyan': 'var(--accent-cyan)',
        'accent-rose': 'var(--accent-rose)',
        'accent-amber': 'var(--accent-amber)',
        'accent-emerald': 'var(--accent-emerald)'
      },
      spacing: {
        main: '24px'
      },
      borderRadius: {
        '2xl': 'var(--radius-card)' // Synced with Premium Radius
      },
      boxShadow: {
        premium: 'var(--shadow-premium)',
        'active-glow': 'var(--shadow-active)'
      },
      backgroundImage: {
        'gradient-glass': 'var(--gradient-glass)',
        'gradient-premium': 'var(--gradient-primary)'
      }
    }
  },
  plugins: []
};
