<template>
  <div class="skeleton-loader" :class="[variantClass, { 'animate-pulse': animated }]" :style="customStyle" />
</template>

<script setup lang="ts">
interface Props {
  variant?: 'text' | 'title' | 'avatar' | 'thumbnail' | 'button' | 'input' | 'custom';
  width?: string;
  height?: string;
  rounded?: boolean | string;
  animated?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  width: '100%',
  height: undefined,
  rounded: false,
  animated: true
});

const variantClass = computed(() => {
  switch (props.variant) {
    case 'text':
      return 'skeleton-text';
    case 'title':
      return 'skeleton-title';
    case 'avatar':
      return 'skeleton-avatar';
    case 'thumbnail':
      return 'skeleton-thumbnail';
    case 'button':
      return 'skeleton-button';
    case 'input':
      return 'skeleton-input';
    default:
      return '';
  }
});

const customStyle = computed(() => {
  const style: Record<string, string> = {
    width: props.width
  };

  if (props.height) {
    style.height = props.height;
  }

  if (typeof props.rounded === 'string') {
    style.borderRadius = props.rounded;
  }

  return style;
});
</script>

<style scoped lang="scss">
.skeleton-loader {
  background: linear-gradient(90deg, rgba(168, 85, 247, 0.1) 25%, rgba(168, 85, 247, 0.2) 50%, rgba(168, 85, 247, 0.1) 75%);
  background-size: 200% 100%;

  &.animate-pulse {
    animation: shimmer 1.5s ease-in-out infinite;
  }
}

// Light mode overrides
html.light-mode .skeleton-loader,
body.light-theme .skeleton-loader {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.06) 25%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.06) 75%);
  background-size: 200% 100%;
}

// Variant styles
.skeleton-text {
  height: 16px;
  border-radius: 4px;
}

.skeleton-title {
  height: 28px;
  border-radius: 6px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.skeleton-thumbnail {
  width: 100%;
  height: 120px;
  border-radius: 12px;
}

.skeleton-button {
  height: 44px;
  border-radius: 12px;
}

.skeleton-input {
  height: 52px;
  border-radius: 16px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
