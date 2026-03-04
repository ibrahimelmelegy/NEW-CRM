<template lang="pug">
.skeleton-table
  .skeleton-toolbar
    .skeleton-shimmer.skeleton-search
    .skeleton-toolbar-actions
      .skeleton-shimmer.skeleton-filter
      .skeleton-shimmer.skeleton-filter-sm

  .skeleton-table-body
    .skeleton-header
      .skeleton-shimmer.skeleton-th(
        v-for="c in cols"
        :key="'th-' + c"
        :style="{ width: getColWidth(c) }"
      )
    .skeleton-row(
      v-for="r in rows"
      :key="'row-' + r"
      :style="{ animationDelay: r * 0.03 + 's' }"
    )
      .skeleton-shimmer.skeleton-td(
        v-for="c in cols"
        :key="'td-' + r + '-' + c"
        :style="{ width: getColWidth(c), height: getCellHeight(c) }"
      )
</template>

<script setup lang="ts">
interface Props {
  rows?: number;
  cols?: number;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  cols: 4
});

const getColWidth = (index: number): string => {
  if (index === 1) return '28%';
  if (index === props.cols) return '14%';
  const remaining = 58 / Math.max(props.cols - 2, 1);
  return `${remaining}%`;
};

const getCellHeight = (index: number): string => {
  if (index === 1) return '16px';
  return '14px';
};
</script>

<style lang="scss" scoped>
.skeleton-table {
  animation: fadeIn 0.3s ease;
}

.skeleton-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}

.skeleton-toolbar-actions {
  display: flex;
  gap: 10px;
}

.skeleton-search {
  width: 260px;
  height: 44px;
  border-radius: 12px;
}

.skeleton-filter {
  width: 120px;
  height: 44px;
  border-radius: 12px;
}

.skeleton-filter-sm {
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.skeleton-table-body {
  background: var(--glass-bg, rgba(22, 22, 29, 0.7));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-lg, 14px);
  overflow: hidden;
}

.skeleton-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  gap: 16px;
  border-bottom: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  background: var(--bg-tertiary, rgba(30, 30, 38, 0.5));
}

.skeleton-th {
  height: 12px;
  border-radius: 4px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  padding: 18px 24px;
  gap: 16px;
  border-bottom: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  animation: fadeIn 0.3s ease both;

  &:last-child {
    border-bottom: none;
  }
}

.skeleton-td {
  border-radius: 6px;
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
html.light-mode .skeleton-table-body {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.08);
  backdrop-filter: none;
}

html.light-mode .skeleton-header {
  background: rgba(244, 244, 245, 0.8);
  border-bottom-color: rgba(0, 0, 0, 0.06);
}

html.light-mode .skeleton-row {
  border-bottom-color: rgba(0, 0, 0, 0.04);
}

html.light-mode .skeleton-shimmer {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.08) 50%, rgba(0, 0, 0, 0.04) 100%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

// Responsive
@media (max-width: 640px) {
  .skeleton-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .skeleton-search {
    width: 100%;
  }

  .skeleton-toolbar-actions {
    justify-content: flex-end;
  }

  .skeleton-row,
  .skeleton-header {
    padding: 12px 16px;
    gap: 10px;
  }
}
</style>
