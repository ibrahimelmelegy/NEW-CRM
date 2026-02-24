<template lang="pug">
.subscription-timeline
  el-timeline(v-if="sortedEvents.length > 0")
    el-timeline-item(
      v-for="event in sortedEvents"
      :key="event.id"
      :timestamp="formatDate(event.date)"
      placement="top"
      :color="getEventColor(event.type)"
    )
      .event-card
        .event-header
          .flex.items-center.gap-2
            Icon(:name="getEventIcon(event.type)" size="18" :style="{ color: getEventColor(event.type) }")
            span.event-type {{ getEventLabel(event.type) }}
        .event-details(v-if="event.metadata")
          //- CREATED event
          template(v-if="event.type === 'CREATED'")
            .detail-row(v-if="event.metadata.planName")
              span.detail-label Plan:
              span.detail-value {{ event.metadata.planName }}
            .detail-row(v-if="event.metadata.price")
              span.detail-label Price:
              span.detail-value {{ event.metadata.price }}
            .detail-row(v-if="event.metadata.hasTrial")
              span.detail-label Trial:
              span.detail-value {{ event.metadata.trialDays }} days

          //- UPGRADED / DOWNGRADED event
          template(v-else-if="event.type === 'UPGRADED' || event.type === 'DOWNGRADED'")
            .detail-row
              span.detail-label From:
              span.detail-value {{ event.metadata.oldPlanName }} ({{ event.metadata.oldPrice }})
            .detail-row
              span.detail-label To:
              span.detail-value {{ event.metadata.newPlanName }} ({{ event.metadata.newPrice }})
            .detail-row(v-if="event.metadata.prorationAmount !== undefined")
              span.detail-label Proration:
              span.detail-value {{ event.metadata.prorationAmount >= 0 ? '+' : '' }}{{ event.metadata.prorationAmount }}

          //- RENEWED event
          template(v-else-if="event.type === 'RENEWED'")
            .detail-row(v-if="event.metadata.amount")
              span.detail-label Amount:
              span.detail-value {{ event.metadata.amount }}
            .detail-row(v-if="event.metadata.periodStart")
              span.detail-label New Period:
              span.detail-value {{ formatDate(event.metadata.periodStart) }} - {{ formatDate(event.metadata.periodEnd) }}

          //- CANCELLED event
          template(v-else-if="event.type === 'CANCELLED'")
            .detail-row(v-if="event.metadata.reason")
              span.detail-label Reason:
              span.detail-value {{ event.metadata.reason }}

          //- PAYMENT_FAILED event
          template(v-else-if="event.type === 'PAYMENT_FAILED'")
            .detail-row(v-if="event.metadata.error")
              span.detail-label Error:
              span.detail-value.text-red-500 {{ event.metadata.error }}

  .empty-timeline(v-else)
    Icon(name="ph:clock-clockwise-bold" size="32" style="color: var(--text-muted)")
    p.mt-2.text-sm(style="color: var(--text-muted)") No events yet
</template>

<script setup lang="ts">
import {
  getEventTypeInfo,
  type SubscriptionEvent
} from '~/composables/useSubscriptions';

const props = defineProps<{
  events: SubscriptionEvent[];
}>();

const sortedEvents = computed(() => {
  if (!props.events) return [];
  return [...props.events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

function getEventColor(type: string): string {
  return getEventTypeInfo(type).color;
}

function getEventIcon(type: string): string {
  return getEventTypeInfo(type).icon;
}

function getEventLabel(type: string): string {
  return getEventTypeInfo(type).label;
}

function formatDate(date: string | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
.subscription-timeline {
  width: 100%;
}

.event-card {
  padding: 8px 0;
}

.event-header {
  margin-bottom: 6px;
}

.event-type {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #303133);
}

.event-details {
  padding: 8px 12px;
  background: var(--bg-page, #f5f7fa);
  border-radius: 8px;
  font-size: 13px;
}

.detail-row {
  display: flex;
  gap: 8px;
  padding: 2px 0;
}

.detail-label {
  color: var(--text-muted, #909399);
  min-width: 80px;
  font-weight: 500;
}

.detail-value {
  color: var(--text-primary, #303133);
}

.empty-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}
</style>
