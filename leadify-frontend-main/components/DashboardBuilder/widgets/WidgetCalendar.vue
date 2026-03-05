<template lang="pug">
.widget-calendar.glass-card.p-5.h-full
  .flex.items-center.justify-between.mb-3
    h4.text-sm.font-bold(style="color: var(--text-primary)") {{ title }}
    NuxtLink.text-xs(to="/calendar" style="color: var(--accent-color, #7849ff)") View All
  //- Loading skeleton
  .animate-pulse.space-y-3(v-if="loading")
    .flex.items-center.gap-3(v-for="i in 4" :key="i")
      .w-10.h-10.rounded-xl(style="background: rgba(168, 85, 247, 0.1)")
      div.space-y-1.flex-1
        .h-3.rounded(:style="{ width: `${50 + Math.random() * 30}%`, background: 'rgba(168, 85, 247, 0.1)' }")
        .h-2.rounded.w-24(style="background: rgba(168, 85, 247, 0.06)")
  //- Events list
  .space-y-2(v-else)
    .flex.items-center.gap-3.p-2.rounded-xl.transition-colors(
      v-for="event in events"
      :key="event.id"
      class="hover:bg-white/[0.03]"
      style="border: 1px solid rgba(255,255,255,0.04)"
    )
      .w-10.h-10.rounded-xl.flex.flex-col.items-center.justify-center.shrink-0(:style="{ background: event.color + '15' }")
        span.text-xs.font-bold(:style="{ color: event.color }") {{ event.day }}
        span.text-xs(style="color: var(--text-muted); font-size: 9px; line-height: 1") {{ event.month }}
      div.min-w-0.flex-1
        p.text-sm.font-medium.truncate(style="color: var(--text-primary)") {{ event.title }}
        p.text-xs(style="color: var(--text-muted)") {{ event.time }}
    .text-center.py-6(v-if="!events.length")
      Icon(name="ph:calendar" size="32" style="color: var(--text-muted)")
      p.text-xs.mt-2(style="color: var(--text-muted)") No upcoming events
</template>

<script setup lang="ts">
defineProps<{
  title: string;
}>();

interface CalendarEvent {
  id: string | number;
  title: string;
  day: string;
  month: string;
  time: string;
  color: string;
}

const loading = ref(true);
const events = ref<CalendarEvent[]>([]);

const EVENT_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

async function loadData() {
  loading.value = true;
  try {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    const start = today.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const { body, success } = await useApiFetch(`calendar/events?startDate=${start}&endDate=${end}&limit=6`);
    if (success && body) {
      const data = body as unknown;
      const docs = data.docs || data.events || data || [];
      events.value = docs.map((e: unknown, i: number) => {
        const date = new Date(e.startDate || e.date || e.start);
        return {
          id: e.id || e._id || i,
          title: e.title || e.name || e.subject || 'Event',
          day: date.getDate().toString(),
          month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
          time: e.allDay ? 'All day' : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          color: EVENT_COLORS[i % EVENT_COLORS.length]
        };
      });
    }
  } catch (e) {
    console.error('Calendar widget load failed:', e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style lang="scss" scoped>
.widget-calendar {
  min-height: 200px;
}
</style>
