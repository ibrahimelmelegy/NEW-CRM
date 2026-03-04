<template lang="pug">
.skeleton-kanban
  .skeleton-kanban-column(
    v-for="col in columns"
    :key="'col-' + col"
    :style="{ animationDelay: col * 0.08 + 's' }"
  )
    .skeleton-column-header
      .skeleton-shimmer.skeleton-column-title
      .skeleton-shimmer.skeleton-column-count

    .skeleton-column-cards
      .skeleton-kanban-card(
        v-for="card in cardsPerColumn"
        :key="'card-' + col + '-' + card"
        :style="{ animationDelay: (col * cardsPerColumn + card) * 0.04 + 's' }"
      )
        .skeleton-card-top
          .skeleton-shimmer.skeleton-card-badge
          .skeleton-shimmer.skeleton-card-dots
        .skeleton-shimmer.skeleton-card-title
        .skeleton-shimmer.skeleton-card-desc
        .skeleton-card-footer
          .skeleton-shimmer.skeleton-card-avatar
          .skeleton-shimmer.skeleton-card-date
</template>

<script setup lang="ts">
interface Props {
  columns?: number;
  cardsPerColumn?: number;
}

withDefaults(defineProps<Props>(), {
  columns: 4,
  cardsPerColumn: 3
});
</script>

<style lang="scss" scoped>
.skeleton-kanban {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  animation: fadeIn 0.3s ease;
}

.skeleton-kanban-column {
  min-width: 280px;
  flex: 1;
  background: var(--bg-secondary, #16161d);
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-lg, 14px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.4s ease both;
}

.skeleton-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
}

.skeleton-column-title {
  width: 100px;
  height: 16px;
  border-radius: 6px;
}

.skeleton-column-count {
  width: 28px;
  height: 22px;
  border-radius: 10px;
}

.skeleton-column-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-kanban-card {
  background: var(--glass-bg, rgba(22, 22, 29, 0.7));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-md, 10px);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: fadeIn 0.4s ease both;
}

.skeleton-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.skeleton-card-badge {
  width: 60px;
  height: 20px;
  border-radius: 10px;
}

.skeleton-card-dots {
  width: 20px;
  height: 14px;
  border-radius: 4px;
}

.skeleton-card-title {
  width: 85%;
  height: 14px;
  border-radius: 4px;
}

.skeleton-card-desc {
  width: 60%;
  height: 10px;
  border-radius: 4px;
}

.skeleton-card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.skeleton-card-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-card-date {
  width: 70px;
  height: 10px;
  border-radius: 4px;
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
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Light mode
html.light-mode .skeleton-kanban-column {
  background: rgba(250, 250, 250, 0.9);
  border-color: rgba(0, 0, 0, 0.06);
}

html.light-mode .skeleton-kanban-card {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(0, 0, 0, 0.06);
}

html.light-mode .skeleton-column-header {
  border-bottom-color: rgba(0, 0, 0, 0.06);
}

html.light-mode .skeleton-shimmer {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.08) 50%, rgba(0, 0, 0, 0.04) 100%);
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

// Responsive
@media (max-width: 768px) {
  .skeleton-kanban {
    flex-direction: column;
  }

  .skeleton-kanban-column {
    min-width: unset;
  }
}
</style>
