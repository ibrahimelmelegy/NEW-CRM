<template lang="pug">
.deal-timeline
  h3.section-title
    Icon.mr-2(name="ph:clock-clockwise-bold" size="18")
    | Activity Timeline
  .timeline-scroll
    .timeline-track
      .timeline-node(v-for="(item, i) in timeline" :key="item.id || i" :class="`type-${item.type}`")
        .node-dot
          Icon(:name="getIcon(item.type)" size="14")
        .node-line(v-if="i < timeline.length - 1")
        .node-content
          .node-desc {{ item.description }}
          .node-meta
            span.node-user(v-if="item.user") {{ item.user.name }}
            span.node-date {{ formatDate(item.date) }}
</template>

<script setup lang="ts">
defineProps<{
  timeline: Record<string, unknown>[];
}>();

function getIcon(type: string): string {
  const icons: Record<string, string> = {
    create: 'ph:plus-circle-bold',
    email: 'ph:envelope-bold',
    call: 'ph:phone-bold',
    meeting: 'ph:video-camera-bold',
    stage: 'ph:arrow-right-bold',
    note: 'ph:note-bold',
    update: 'ph:pencil-bold'
  };
  return icons[type] || 'ph:activity-bold';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
</script>

<style lang="scss" scoped>
.section-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.timeline-scroll {
  overflow-x: auto;
  padding-bottom: 8px;
}

.timeline-track {
  display: flex;
  gap: 0;
  min-width: min-content;
}

.timeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
  position: relative;

  .node-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .node-line {
    position: absolute;
    top: 16px;
    left: calc(50% + 16px);
    right: calc(-50% + 16px);
    height: 2px;
    width: calc(100% - 32px);
    background: rgba(255, 255, 255, 0.1);
  }

  &.type-create .node-dot {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }
  &.type-email .node-dot {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }
  &.type-call .node-dot {
    background: rgba(168, 85, 247, 0.2);
    color: #a78bfa;
  }
  &.type-meeting .node-dot {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }
  &.type-stage .node-dot {
    background: rgba(236, 72, 153, 0.2);
    color: #ec4899;
  }
  &.type-note .node-dot {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
  }
  &.type-update .node-dot {
    background: rgba(120, 73, 255, 0.2);
    color: var(--accent-color, #7849ff);
  }
}

.node-content {
  margin-top: 10px;
  text-align: center;
  max-width: 140px;
}

.node-desc {
  font-size: 12px;
  color: var(--text-primary);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.node-meta {
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}

.node-user {
  display: block;
  font-weight: 600;
}
</style>
