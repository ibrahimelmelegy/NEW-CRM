<template lang="pug">
.glass-card.rounded-xl.overflow-hidden
  //- Header
  .flex.items-center.justify-between.p-4.border-b(style="border-color: var(--border-default)")
    .flex.items-center.gap-2
      .w-8.h-8.rounded-lg.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
        Icon(name="ph:calendar-bold" size="18" style="color: #7849ff")
      .text-sm.font-bold(style="color: var(--text-primary)") {{ $t('calendar.upcoming') }}
    NuxtLink.text-xs.font-medium(to="/calendar" style="color: #7849ff") {{ $t('common.viewAll') }}

  //- Loading
  .p-4(v-if="loading")
    .animate-pulse.space-y-3
      .flex.gap-3(v-for="i in 3" :key="i")
        .w-10.h-10.rounded-lg(style="background: var(--bg-input)")
        .flex-1.space-y-2
          .h-3.rounded(style="background: var(--bg-input); width: 70%")
          .h-2.rounded(style="background: var(--bg-input); width: 50%")

  //- Events List
  .divide-y(v-else-if="upcomingEvents.length" style="border-color: var(--border-default)")
    .flex.items-start.gap-3.p-3.cursor-pointer.transition(
      v-for="evt in upcomingEvents.slice(0, maxItems)"
      :key="evt.id"
      class="hover:bg-[var(--bg-input)]"
      @click="goToEvent(evt)"
    )
      //- Time block
      .w-10.h-10.rounded-lg.flex.flex-col.items-center.justify-center.shrink-0.text-center(
        :style="{ background: (evt.color || getEventTypeColor(evt.eventType)) + '15' }"
      )
        .text-xs.font-bold.leading-none(:style="{ color: evt.color || getEventTypeColor(evt.eventType) }")
          | {{ getEventDay(evt.startDate) }}
        .text-xs.leading-none(style="color: var(--text-muted); margin-top: 0.125rem;")
          | {{ getEventMonth(evt.startDate) }}

      //- Event details
      .min-w-0.flex-1
        .flex.items-center(class="gap-1.5")
          Icon(
            :name="getEventTypeIcon(evt.eventType)"
            size="12"
            :style="{ color: evt.color || getEventTypeColor(evt.eventType) }"
          )
          .text-sm.font-medium.truncate(style="color: var(--text-primary)") {{ evt.title }}
        .flex.items-center.gap-2(class="mt-0.5")
          .text-xs(style="color: var(--text-muted)")
            span(v-if="evt.allDay") {{ $t('calendar.allDay') }}
            span(v-else) {{ formatEventTime(evt.startDate) }}
          //- Sync indicator
          .flex.items-center(class="gap-0.5" v-if="evt.externalProvider")
            Icon(
              :name="evt.externalProvider === 'google' ? 'logos:google-calendar' : 'logos:microsoft-icon'"
              size="10"
            )

      //- Priority dot
      .w-2.h-2.rounded-full.shrink-0.mt-2(
        :style="{ background: getPriorityColor(evt.priority) }"
      )

  //- Empty state
  .p-6.text-center(v-else)
    Icon(name="ph:calendar-blank-bold" size="32" class="mx-auto mb-2" style="color: var(--text-muted); opacity: 0.5")
    .text-xs(style="color: var(--text-muted)") {{ $t('calendar.noUpcomingEvents') }}

  //- Sync status footer (if any provider connected)
  .flex.items-center.justify-between.px-4.py-2.border-t(
    v-if="syncInfo"
    style="border-color: var(--border-default); background: var(--bg-elevated)"
  )
    .flex.items-center.gap-2
      .rounded-full(class="w-1.5 h-1.5" :class="syncInfo.connected ? 'bg-green-500' : 'bg-gray-400'")
      .text-xs(style="color: var(--text-muted)") {{ syncInfo.label }}
    .text-xs(style="color: var(--text-muted)") {{ syncInfo.lastSync }}
</template>

<script setup lang="ts">
import {
  fetchUpcomingEvents,
  fetchSyncStatus,
  getEventTypeColor,
  getEventTypeIcon,
  getCalendarPriorityColor,
  formatSyncTime
} from '~/composables/useCalendar';
import type { CalendarEvent, CalendarSyncStatus } from '~/composables/useCalendar';

const props = withDefaults(
  defineProps<{
    maxItems?: number;
  }>(),
  {
    maxItems: 5
  }
);

const router = useRouter();

const upcomingEvents = ref<CalendarEvent[]>([]);
const syncStatus = ref<CalendarSyncStatus | null>(null);
const loading = ref(true);

const syncInfo = computed(() => {
  if (!syncStatus.value) return null;
  const { google, outlook } = syncStatus.value;

  if (google.connected && outlook.connected) {
    return {
      connected: true,
      label: 'Google + Outlook synced',
      lastSync: formatSyncTime(google.lastSyncAt || outlook.lastSyncAt)
    };
  }
  if (google.connected) {
    return {
      connected: true,
      label: 'Google Calendar synced',
      lastSync: formatSyncTime(google.lastSyncAt)
    };
  }
  if (outlook.connected) {
    return {
      connected: true,
      label: 'Outlook synced',
      lastSync: formatSyncTime(outlook.lastSyncAt)
    };
  }
  return null;
});

function getEventDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString();
}

function getEventMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });
}

function formatEventTime(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getPriorityColor(priority: string): string {
  return getCalendarPriorityColor(priority);
}

function goToEvent(evt: CalendarEvent) {
  router.push(`/calendar?event=${evt.id}`);
}

onMounted(async () => {
  try {
    const [events, status] = await Promise.all([fetchUpcomingEvents(props.maxItems), fetchSyncStatus()]);
    upcomingEvents.value = events;
    syncStatus.value = status;
  } finally {
    loading.value = false;
  }
});
</script>
