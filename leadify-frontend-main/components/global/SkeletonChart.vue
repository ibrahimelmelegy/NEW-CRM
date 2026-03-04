<template lang="pug">
.skeleton-chart(:style="{ height: height }")
  .skeleton-chart-header
    .skeleton-chart-header-left
      .skeleton-shimmer.skeleton-chart-title
      .skeleton-shimmer.skeleton-chart-subtitle
    .skeleton-chart-header-right
      .skeleton-shimmer.skeleton-chart-legend(v-for="n in 3" :key="n")

  .skeleton-chart-area
    //- Y-axis labels
    .skeleton-chart-y-axis
      .skeleton-shimmer.skeleton-y-label(v-for="n in 5" :key="n")

    //- Chart body with bars
    .skeleton-chart-body
      .skeleton-chart-bar-group(v-for="n in 8" :key="n")
        .skeleton-shimmer.skeleton-chart-bar(:style="{ height: getBarHeight(n) }")

  //- X-axis labels
  .skeleton-chart-x-axis
    .skeleton-shimmer.skeleton-x-label(v-for="n in 8" :key="n")
</template>

<script setup lang="ts">
interface Props {
  height?: string;
}

withDefaults(defineProps<Props>(), {
  height: '300px'
});

const barHeights = [45, 72, 58, 85, 63, 90, 40, 68];

const getBarHeight = (index: number): string => {
  return `${barHeights[(index - 1) % barHeights.length]}%`;
};
</script>

<style lang="scss" scoped>
.skeleton-chart {
  background: var(--glass-bg, rgba(22, 22, 29, 0.7));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-lg, 14px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease;
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.2), transparent);
  }
}

.skeleton-chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.skeleton-chart-header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-chart-title {
  width: 140px;
  height: 18px;
  border-radius: 6px;
}

.skeleton-chart-subtitle {
  width: 90px;
  height: 12px;
  border-radius: 4px;
}

.skeleton-chart-header-right {
  display: flex;
  gap: 12px;
}

.skeleton-chart-legend {
  width: 60px;
  height: 24px;
  border-radius: 6px;
}

.skeleton-chart-area {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
}

.skeleton-chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px 0 24px;
  flex-shrink: 0;
}

.skeleton-y-label {
  width: 30px;
  height: 10px;
  border-radius: 3px;
}

.skeleton-chart-body {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding-bottom: 0;
  border-bottom: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-left: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
}

.skeleton-chart-bar-group {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 100%;
}

.skeleton-chart-bar {
  width: 70%;
  max-width: 40px;
  min-height: 12px;
  border-radius: 6px 6px 0 0;
}

.skeleton-chart-x-axis {
  display: flex;
  gap: 12px;
  padding-left: 42px;
  margin-top: 10px;
  flex-shrink: 0;
}

.skeleton-x-label {
  flex: 1;
  height: 10px;
  max-width: 50px;
  border-radius: 3px;
  margin: 0 auto;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// Light mode
html.light-mode .skeleton-chart {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.08);
  backdrop-filter: none;

  &::before {
    background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.08), transparent);
  }
}

html.light-mode .skeleton-chart-body {
  border-color: rgba(0, 0, 0, 0.06);
}

html.light-mode .skeleton-shimmer {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.08) 50%, rgba(0, 0, 0, 0.04) 100%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

// Responsive
@media (max-width: 640px) {
  .skeleton-chart {
    padding: 16px;
  }

  .skeleton-chart-header {
    flex-direction: column;
    gap: 12px;
  }

  .skeleton-chart-legend {
    width: 48px;
    height: 20px;
  }

  .skeleton-chart-body {
    gap: 6px;
  }
}
</style>
