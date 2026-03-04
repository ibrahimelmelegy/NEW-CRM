<template lang="pug">
.skeleton-card-wrapper(:class="'variant-' + variant")
  .skeleton-card(
    v-for="n in count"
    :key="n"
    :class="'skeleton-card--' + variant"
  )
    .skeleton-shimmer.skeleton-icon
    .skeleton-text-group
      .skeleton-shimmer.skeleton-title
      .skeleton-shimmer.skeleton-value
    .skeleton-shimmer.skeleton-trend(v-if="variant !== 'mini'")
</template>

<script setup lang="ts">
interface Props {
  variant?: 'card' | 'wide' | 'mini';
  count?: number;
}

withDefaults(defineProps<Props>(), {
  variant: 'card',
  count: 1
});
</script>

<style lang="scss" scoped>
.skeleton-card-wrapper {
  display: grid;
  gap: 16px;

  &.variant-card {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  &.variant-wide {
    grid-template-columns: 1fr;
  }

  &.variant-mini {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}

.skeleton-card {
  background: var(--glass-bg, rgba(22, 22, 29, 0.7));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-lg, 14px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.2), transparent);
  }

  &--wide {
    flex-direction: row;
    align-items: center;
    padding: 20px 28px;

    .skeleton-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      flex-shrink: 0;
    }

    .skeleton-text-group {
      flex: 1;
    }

    .skeleton-title {
      width: 120px;
      height: 14px;
    }

    .skeleton-value {
      width: 180px;
      height: 28px;
    }

    .skeleton-trend {
      width: 80px;
      height: 24px;
      border-radius: 20px;
      flex-shrink: 0;
    }
  }

  &--mini {
    padding: 16px;
    gap: 10px;

    .skeleton-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
    }

    .skeleton-title {
      width: 60px;
      height: 10px;
    }

    .skeleton-value {
      width: 80px;
      height: 20px;
    }
  }

  &--card {
    .skeleton-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
    }

    .skeleton-title {
      width: 100px;
      height: 12px;
    }

    .skeleton-value {
      width: 130px;
      height: 28px;
    }

    .skeleton-trend {
      width: 70px;
      height: 16px;
      border-radius: 20px;
    }
  }
}

.skeleton-text-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-shimmer {
  background: linear-gradient(90deg, rgba(124, 58, 237, 0.06) 0%, rgba(124, 58, 237, 0.12) 50%, rgba(124, 58, 237, 0.06) 100%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes skeleton-pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// Light mode
html.light-mode .skeleton-card {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.08);
  backdrop-filter: none;

  &::before {
    background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.08), transparent);
  }
}

html.light-mode .skeleton-shimmer {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.08) 50%, rgba(0, 0, 0, 0.04) 100%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
</style>
