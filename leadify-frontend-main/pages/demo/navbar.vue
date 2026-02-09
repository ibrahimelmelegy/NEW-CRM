<template lang="pug">
.navbar-demo-page
  PremiumNavbar

  .demo-content
    .container
      .hero-section
        .glass-card.hero-card
          h1.hero-title ✨ Premium Glass Navbar
          p.hero-subtitle World-class navigation with Microsoft Fluent Design
          .features-grid
            .feature-item(v-for="feature in features" :key="feature.title")
              .feature-icon
                Icon(:name="feature.icon" size="32")
              h3 {{ feature.title }}
              p {{ feature.description }}

      .demo-section
        h2.section-title Features Showcase
        .demo-grid
          .demo-card.glass-card
            Icon.demo-icon(name="ph:sparkle-bold" size="40")
            h3 Glassmorphism Effect
            p Beautiful frosted glass effect with backdrop blur and mica material

          .demo-card.glass-card
            Icon.demo-icon(name="ph:lightning-bold" size="40")
            h3 Smooth Animations
            p Fluent transitions and micro-interactions for premium feel

          .demo-card.glass-card
            Icon.demo-icon(name="ph:palette-bold" size="40")
            h3 Dark/Light Theme
            p Seamless theme switching with one click

          .demo-card.glass-card
            Icon.demo-icon(name="ph:globe-bold" size="40")
            h3 Multi-Language
            p RTL/LTR support for Arabic and English

          .demo-card.glass-card
            Icon.demo-icon(name="ph:bell-ringing-bold" size="40")
            h3 Live Notifications
            p Real-time notification drawer with glass effect

          .demo-card.glass-card
            Icon.demo-icon(name="ph:squares-four-bold" size="40")
            h3 Quick Access Apps
            p Beautiful app launcher with gradient icons

      .code-section
        h2.section-title Implementation
        .glass-card.code-card
          pre.code-block
            code {{ sampleCode }}
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const features = [
  {
    icon: 'ph:magic-wand-bold',
    title: 'Professional Design',
    description: 'Enterprise-grade UI following Microsoft Fluent Design principles'
  },
  {
    icon: 'ph:device-mobile-bold',
    title: 'Fully Responsive',
    description: 'Perfect experience on desktop, tablet, and mobile devices'
  },
  {
    icon: 'ph:accessible-bold',
    title: 'Accessible',
    description: 'WCAG compliant with keyboard navigation and screen reader support'
  },
  {
    icon: 'ph:rocket-launch-bold',
    title: 'Performance',
    description: 'Optimized animations with hardware acceleration'
  }
]

const sampleCode = `// Usage in your layout
<template>
  <PremiumNavbar />
  <div class="page-content">
    <slot />
  </div>
</template>

// The navbar includes:
✓ Glass morphism effect
✓ Search with Ctrl+K shortcut
✓ Language switcher (EN/AR)
✓ Theme toggle (Dark/Light)
✓ Notifications drawer
✓ Apps quick launcher
✓ User profile menu`
</script>

<style lang="scss" scoped>
.navbar-demo-page {
  min-height: 100vh;
  background: var(--color-neutral-background-1);
  padding-top: 90px; // Space for navbar
}

.demo-content {
  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: var(--spacing-4xl) var(--spacing-xl);
  }

  .hero-section {
    margin-bottom: var(--spacing-5xl);

    .hero-card {
      text-align: center;
      padding: var(--spacing-5xl) var(--spacing-4xl);

      .hero-title {
        font-size: var(--font-size-5xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin-bottom: var(--spacing-md);
        background: linear-gradient(135deg, var(--color-primary), #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .hero-subtitle {
        font-size: var(--font-size-xl);
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-4xl);
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-2xl);
        margin-top: var(--spacing-4xl);

        .feature-item {
          .feature-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto var(--spacing-md);
            background: linear-gradient(135deg, var(--color-primary), #764ba2);
            border-radius: var(--radius-large);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: var(--elevation-shadow-8);
          }

          h3 {
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-semibold);
            color: var(--color-text-primary);
            margin-bottom: var(--spacing-xs);
          }

          p {
            font-size: var(--font-size-sm);
            color: var(--color-text-tertiary);
            line-height: 1.6;
          }
        }
      }
    }
  }

  .demo-section {
    margin-bottom: var(--spacing-5xl);

    .section-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-3xl);
      text-align: center;
    }

    .demo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-xl);

      .demo-card {
        padding: var(--spacing-2xl);
        text-align: center;
        transition: all var(--duration-normal) var(--curve-standard);

        &:hover {
          transform: translateY(-8px);
          box-shadow: var(--elevation-shadow-16);

          .demo-icon {
            transform: scale(1.1);
          }
        }

        .demo-icon {
          color: var(--color-primary);
          margin-bottom: var(--spacing-lg);
          transition: transform var(--duration-fast);
        }

        h3 {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-sm);
        }

        p {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
      }
    }
  }

  .code-section {
    .section-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-3xl);
      text-align: center;
    }

    .code-card {
      padding: 0;
      overflow: hidden;

      .code-block {
        margin: 0;
        padding: var(--spacing-2xl);
        background: var(--color-neutral-background-1);
        overflow-x: auto;

        code {
          font-family: var(--font-family-mono);
          font-size: var(--font-size-sm);
          line-height: 1.8;
          color: var(--color-text-secondary);
          white-space: pre;
        }
      }
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .navbar-demo-page {
    .demo-content .container {
      padding: var(--spacing-2xl) var(--spacing-md);
    }

    .hero-section .hero-card {
      padding: var(--spacing-3xl) var(--spacing-lg);

      .hero-title {
        font-size: var(--font-size-3xl);
      }

      .hero-subtitle {
        font-size: var(--font-size-md);
      }
    }

    .demo-grid,
    .features-grid {
      grid-template-columns: 1fr !important;
    }
  }
}
</style>
