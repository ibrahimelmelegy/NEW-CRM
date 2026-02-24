<template lang="pug">
.activity-timeline
  .space-y-1
    .flex.items-start.gap-3.px-3.py-2.rounded-lg.transition-colors(
      v-for="entry in entries"
      :key="entry.id"
      class="hover:bg-gray-50/50"
    )
      //- Icon
      div(class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        :style="{ backgroundColor: (actionColors[entry.action] || '#6b7280') + '15' }"
      )
        Icon(:name="actionIcons[entry.action] || 'ph:circle'" size="16" :style="{ color: actionColors[entry.action] || '#6b7280' }")
      //- Content
      .flex-1.min-w-0
        p.text-sm.font-semibold(style="color: var(--text-primary);") {{ entry.description }}
        div(class="flex items-center gap-2 mt-0.5")
          el-tag(size="small" effect="plain" round) {{ entry.entityType }}
          span.text-xs.font-mono(style="color: var(--text-muted);") {{ entry.entityLabel }}
      //- Time
      span.text-xs.font-mono.flex-shrink-0(style="color: var(--text-muted); opacity: 0.6;") {{ timeAgo(entry.timestamp) }}

  //- Empty state
  .text-center.py-10(v-if="entries.length === 0")
    Icon(name="ph:clock-countdown" size="40" style="color: var(--text-muted);")
    p.text-sm.mt-2(style="color: var(--text-muted);") No activity recorded yet
</template>

<script setup lang="ts">
import { useActivityLog } from '~/composables/useActivityLog';
import type { ActivityEntry } from '~/composables/useActivityLog';

defineProps<{ entries: ActivityEntry[] }>();

const { actionIcons, actionColors } = useActivityLog();

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}
</script>
