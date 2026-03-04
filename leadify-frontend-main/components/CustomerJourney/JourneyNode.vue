<template lang="pug">
.journey-node(
  :class="{ 'journey-node--above': position === 'above', 'journey-node--below': position === 'below' }"
  @mouseenter="showDetails = true"
  @mouseleave="showDetails = false"
)
  //- Connection stem
  .journey-node__stem

  //- Icon badge
  .journey-node__badge(:style="{ backgroundColor: color + '20', borderColor: color }")
    Icon(:name="icon" size="18" :style="{ color: color }")

  //- Content
  .journey-node__content
    .journey-node__title {{ event.title }}
    .journey-node__time {{ formatDate(event.date) }}

  //- Sentiment indicator
  .journey-node__sentiment(:style="{ backgroundColor: sentimentColor }" :title="event.sentiment")

  //- Detail popover on hover
  Transition(name="fade")
    .journey-node__details(v-if="showDetails")
      .journey-node__details-card
        .flex.items-center.gap-2.mb-2
          Icon(:name="icon" size="16" :style="{ color: color }")
          span(class="text-sm font-semibold" style="color: var(--text-primary)") {{ event.title }}
        p(class="text-xs mb-2" style="color: var(--text-secondary)") {{ event.description }}
        .flex.items-center.gap-3
          .flex.items-center.gap-1
            Icon(name="ph:calendar-bold" size="12" style="color: var(--text-muted)")
            span(class="text-xs" style="color: var(--text-muted)") {{ formatDateTime(event.date) }}
          .flex.items-center.gap-1
            .journey-node__sentiment-sm(:style="{ backgroundColor: sentimentColor }")
            span(class="text-xs capitalize" style="color: var(--text-muted)") {{ event.sentiment }}
        //- Metadata
        .mt-2.pt-2(v-if="event.metadata && Object.keys(event.metadata).length" style="border-top: 1px solid var(--glass-border)")
          .flex.items-center.gap-2(v-for="(value, key) in event.metadata" :key="key")
            span(class="text-xs font-medium capitalize" style="color: var(--text-muted)") {{ key }}:
            span(class="text-xs" style="color: var(--text-primary)") {{ value }}
</template>

<script lang="ts" setup>
import type { JourneyEvent } from '~/composables/useCustomerJourney';

const props = defineProps<{
  event: JourneyEvent;
  color: string;
  icon: string;
  position: 'above' | 'below';
}>();

const showDetails = ref(false);

const sentimentColors: Record<string, string> = {
  positive: '#10b981',
  neutral: '#6b7280',
  negative: '#ef4444'
};

const sentimentColor = computed(() => sentimentColors[props.event.sentiment] || sentimentColors.neutral);

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped lang="scss">
.journey-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 140px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &--above {
    flex-direction: column;
    .journey-node__stem {
      order: 3;
      height: 32px;
      width: 2px;
      background: linear-gradient(to bottom, var(--glass-border), transparent);
    }
    .journey-node__badge {
      order: 2;
    }
    .journey-node__content {
      order: 1;
      margin-bottom: 8px;
    }
    .journey-node__sentiment {
      order: 0;
      margin-bottom: 4px;
    }
    .journey-node__details {
      top: -10px;
      transform: translateY(-100%);
    }
  }

  &--below {
    flex-direction: column;
    .journey-node__stem {
      order: 1;
      height: 32px;
      width: 2px;
      background: linear-gradient(to top, var(--glass-border), transparent);
    }
    .journey-node__badge {
      order: 2;
    }
    .journey-node__content {
      order: 3;
      margin-top: 8px;
    }
    .journey-node__sentiment {
      order: 4;
      margin-top: 4px;
    }
    .journey-node__details {
      bottom: -10px;
      transform: translateY(100%);
    }
  }

  &__badge {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid;
    transition: all 0.3s ease;
    z-index: 2;
    background-clip: padding-box;

    .journey-node:hover & {
      transform: scale(1.15);
      box-shadow: 0 0 16px rgba(0, 0, 0, 0.15);
    }
  }

  &__content {
    text-align: center;
    max-width: 130px;
  }

  &__title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 130px;
  }

  &__time {
    font-size: 0.65rem;
    color: var(--text-muted);
    margin-top: 2px;
  }

  &__sentiment {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__sentiment-sm {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__details {
    position: absolute;
    left: 50%;
    z-index: 20;
    width: 280px;
    margin-left: -140px;
  }

  &__details-card {
    background: var(--glass-bg, rgba(255, 255, 255, 0.9));
    backdrop-filter: blur(var(--glass-blur, 12px));
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    padding: 14px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px) !important;
}
</style>
