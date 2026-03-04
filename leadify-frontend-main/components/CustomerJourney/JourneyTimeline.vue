<template lang="pug">
.journey-timeline(ref="timelineRef")
  //- Legend
  .journey-timeline__legend
    .journey-timeline__legend-item(v-for="(color, type) in typeColors" :key="type")
      .journey-timeline__legend-dot(:style="{ backgroundColor: color }")
      span {{ $t(`journey.${typeLabels[type] || type}`) }}

  //- Scrollable timeline area
  .journey-timeline__scroll(
    ref="scrollRef"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
    @mouseleave="onMouseUp"
    :class="{ 'journey-timeline__scroll--grabbing': isDragging }"
  )
    .journey-timeline__track(:style="trackStyle")
      //- Date group labels
      .journey-timeline__dates
        .journey-timeline__date-label(
          v-for="(label, idx) in dateLabels"
          :key="idx"
          :style="{ left: label.position + '%' }"
        ) {{ label.text }}

      //- Connecting line
      .journey-timeline__line
        .journey-timeline__line-gradient

      //- Nodes
      .journey-timeline__nodes
        .journey-timeline__node-slot(
          v-for="(event, idx) in events"
          :key="idx"
          :style="{ left: getEventPosition(idx) + '%' }"
          :class="{ 'journey-timeline__node-slot--mounted': isMounted }"
        )
          JourneyNode(
            :event="event"
            :color="typeColors[event.type] || '#6b7280'"
            :icon="typeIcons[event.type] || 'ph:circle-bold'"
            :position="idx % 2 === 0 ? 'above' : 'below'"
          )
</template>

<script lang="ts" setup>
import type { JourneyEvent } from '~/composables/useCustomerJourney';

const props = defineProps<{
  events: JourneyEvent[];
  typeColors: Record<string, string>;
  typeIcons: Record<string, string>;
  zoomLevel: 'year' | 'month' | 'week';
}>();

const scrollRef = ref<HTMLElement | null>(null);
const timelineRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startX = ref(0);
const scrollLeft = ref(0);
const isMounted = ref(false);

// Type labels mapping for i18n keys
const typeLabels: Record<string, string> = {
  creation: 'creation',
  email: 'email',
  call: 'call',
  meeting: 'meeting',
  deal_stage: 'dealStage',
  note: 'note',
  task: 'task',
  proposal: 'proposal',
  invoice: 'invoice'
};

// Calculate track width based on zoom level and event count
const trackStyle = computed(() => {
  const baseWidth = Math.max(props.events.length * 180, 900);
  const zoomMultiplier = props.zoomLevel === 'week' ? 2.5 : props.zoomLevel === 'month' ? 1.5 : 1;
  return {
    width: `${baseWidth * zoomMultiplier}px`,
    minWidth: '100%'
  };
});

// Calculate event position as percentage along the timeline
function getEventPosition(idx: number): number {
  if (props.events.length <= 1) return 50;
  const padding = 5; // 5% padding on each side
  const usableRange = 100 - padding * 2;
  return padding + (idx / (props.events.length - 1)) * usableRange;
}

// Generate date labels for the timeline
const dateLabels = computed(() => {
  if (!props.events.length) return [];

  const labels: Array<{ text: string; position: number }> = [];
  const seen = new Set<string>();

  props.events.forEach((event, idx) => {
    const d = new Date(event.date);
    let key: string;
    let text: string;

    if (props.zoomLevel === 'year') {
      key = `${d.getFullYear()}`;
      text = key;
    } else if (props.zoomLevel === 'month') {
      key = `${d.getFullYear()}-${d.getMonth()}`;
      text = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else {
      key = `${d.getFullYear()}-W${getWeekNumber(d)}`;
      text = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (!seen.has(key)) {
      seen.add(key);
      labels.push({ text, position: getEventPosition(idx) });
    }
  });

  return labels;
});

function getWeekNumber(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
}

// Grab-to-pan handlers
function onMouseDown(e: MouseEvent) {
  if (!scrollRef.value) return;
  isDragging.value = true;
  startX.value = e.pageX - scrollRef.value.offsetLeft;
  scrollLeft.value = scrollRef.value.scrollLeft;
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value || !scrollRef.value) return;
  e.preventDefault();
  const x = e.pageX - scrollRef.value.offsetLeft;
  const walk = (x - startX.value) * 1.5;
  scrollRef.value.scrollLeft = scrollLeft.value - walk;
}

function onMouseUp() {
  isDragging.value = false;
}

// Mount animation trigger
onMounted(() => {
  setTimeout(() => {
    isMounted.value = true;
  }, 100);
});
</script>

<style scoped lang="scss">
.journey-timeline {
  position: relative;

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--glass-border);
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  &__legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__scroll {
    overflow-x: auto;
    overflow-y: visible;
    cursor: grab;
    padding: 20px 0;
    scrollbar-width: thin;
    scrollbar-color: var(--glass-border) transparent;

    &--grabbing {
      cursor: grabbing;
      user-select: none;
    }

    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--glass-border);
      border-radius: 3px;
    }
  }

  &__track {
    position: relative;
    min-height: 320px;
    padding: 80px 0;
  }

  &__dates {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 0;
    transform: translateY(30px);
  }

  &__date-label {
    position: absolute;
    transform: translateX(-50%);
    font-size: 0.65rem;
    color: var(--text-muted);
    white-space: nowrap;
    padding: 3px 8px;
    background: var(--glass-bg, rgba(255, 255, 255, 0.6));
    border-radius: 8px;
    border: 1px solid var(--glass-border);
  }

  &__line {
    position: absolute;
    top: 50%;
    left: 3%;
    right: 3%;
    height: 3px;
    transform: translateY(-50%);
    border-radius: 2px;
    overflow: hidden;
  }

  &__line-gradient {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #3b82f6 25%, #8b5cf6 50%, #f59e0b 75%, #ef4444 100%);
    opacity: 0.4;
    border-radius: 2px;
  }

  &__nodes {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  &__node-slot {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition:
      opacity 0.5s ease,
      transform 0.5s ease;

    &--mounted {
      opacity: 1;
    }

    @for $i from 1 through 20 {
      &:nth-child(#{$i}) {
        transition-delay: #{$i * 0.08}s;
      }
    }
  }
}
</style>
