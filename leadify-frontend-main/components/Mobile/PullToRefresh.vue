<template lang="pug">
.pull-to-refresh(ref="containerRef")
  //- Pull indicator
  .pull-indicator(
    :style="indicatorStyle"
    :class="{ 'is-refreshing': loading, 'is-ready': pullReady }"
  )
    .pull-spinner(v-if="loading")
      Icon(name="ph:spinner-bold" size="24" class="spin-animation")
    .pull-arrow(v-else)
      Icon(
        name="ph:arrow-down-bold"
        size="20"
        :style="arrowStyle"
      )
    span.pull-text {{ pullText }}

  //- Scrollable content
  .pull-content(
    ref="contentRef"
    :style="contentStyle"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
  )
    slot
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  loading?: boolean;
  threshold?: number;
  maxPull?: number;
}>(), {
  loading: false,
  threshold: 80,
  maxPull: 140,
});

const emit = defineEmits<{
  refresh: [];
}>();

const { t } = useI18n();

const containerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

const pullDistance = ref(0);
const isDragging = ref(false);
const startY = ref(0);
const pullReady = ref(false);

const pullText = computed(() => {
  if (props.loading) return t('mobile.refreshing');
  if (pullReady.value) return t('mobile.releaseToRefresh');
  if (pullDistance.value > 0) return t('mobile.pullToRefresh');
  return '';
});

const indicatorStyle = computed(() => {
  const height = Math.min(pullDistance.value, 60);
  const opacity = Math.min(pullDistance.value / props.threshold, 1);
  return {
    height: `${height}px`,
    opacity: props.loading ? 1 : opacity,
  };
});

const contentStyle = computed(() => ({
  transform: `translateY(${pullDistance.value}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
}));

const arrowStyle = computed(() => {
  const rotation = pullReady.value ? 180 : 0;
  return {
    transform: `rotate(${rotation}deg)`,
    transition: 'transform 0.25s ease',
  };
});

function isScrolledToTop(): boolean {
  if (!contentRef.value) return true;
  // Check if the scroll container (or any parent) is at the top
  let el: HTMLElement | null = contentRef.value;
  while (el) {
    if (el.scrollTop > 0) return false;
    el = el.parentElement;
  }
  return true;
}

function onTouchStart(e: TouchEvent) {
  if (props.loading) return;
  if (!isScrolledToTop()) return;

  startY.value = e.touches[0].clientY;
  isDragging.value = true;
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value || props.loading) return;

  const currentY = e.touches[0].clientY;
  const diff = currentY - startY.value;

  if (diff < 0) {
    // Scrolling up, not pulling down
    pullDistance.value = 0;
    return;
  }

  if (!isScrolledToTop()) {
    isDragging.value = false;
    pullDistance.value = 0;
    return;
  }

  // Apply diminishing resistance as pull increases
  const resistance = 1 - Math.min(diff / (props.maxPull * 3), 0.7);
  pullDistance.value = Math.min(diff * resistance, props.maxPull);
  pullReady.value = pullDistance.value >= props.threshold;
}

function onTouchEnd() {
  if (!isDragging.value) return;
  isDragging.value = false;

  if (pullReady.value && !props.loading) {
    // Snap to threshold height and trigger refresh
    pullDistance.value = props.threshold * 0.6;
    emit('refresh');
  } else {
    pullDistance.value = 0;
  }

  pullReady.value = false;
}

// Reset pull distance when loading finishes
watch(() => props.loading, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    pullDistance.value = 0;
  }
});
</script>

<style lang="scss" scoped>
.pull-to-refresh {
  position: relative;
  overflow: hidden;
}

.pull-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  z-index: 1;
  color: var(--text-muted);

  &.is-ready {
    color: var(--brand-primary);
  }

  &.is-refreshing {
    height: 48px !important;
    opacity: 1 !important;
    color: var(--brand-primary);
  }
}

.pull-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pull-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pull-text {
  font-size: 12px;
  font-weight: 500;
}

.pull-content {
  position: relative;
  z-index: 2;
  min-height: 100%;
}

// Spin animation for the loading spinner
:global(.spin-animation) {
  animation: ptr-spin 0.8s linear infinite;
}

@keyframes ptr-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
