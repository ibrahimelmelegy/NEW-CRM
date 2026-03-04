<template lang="pug">
div(class="space-y-8 pb-8 max-w-[1400px] mx-auto px-4")
  //- Loading state
  .flex.items-center.justify-center.min-h-screen(v-if="loading")
    el-spinner(size="large")

  template(v-else)
    //- Greeting Section
    BriefingGreeting(:greeting="greeting" :user-name="userName")

    //- Focus Priorities
    .glass-card.p-6(v-if="priorities.length")
      h2(class="text-xl font-bold mb-4 text-[var(--text-primary)]") {{ $t('briefing.focusPriorities') }}
      FocusPriorities(:priorities="priorities")

    //- KPI Metrics
    .glass-card.p-6
      h2(class="text-xl font-bold mb-4 text-[var(--text-primary)]") {{ $t('briefing.kpis') }}
      BriefingMetrics(:kpis="kpis")

    //- Today's Schedule
    .glass-card.p-6(v-if="todaySchedule.length")
      h2(class="text-xl font-bold mb-4 text-[var(--text-primary)]") {{ $t('briefing.todaySchedule') }}
      .space-y-3
        .flex.items-center.gap-4.p-3.rounded-lg(
          v-for="(item, i) in todaySchedule"
          :key="i"
          class="bg-[var(--bg-card)] border border-[var(--border-default)] transition-colors hover:border-[var(--brand-primary)]"
        )
          .flex-shrink-0.w-10.h-10.rounded-full.flex.items-center.justify-center(class="bg-[var(--brand-primary,rgba(120,73,255,0.15))]")
            Icon(:name="item.icon" size="20" class="text-[var(--brand-accent,#a78bfa)]")
          div
            p(class="text-sm font-medium text-[var(--text-primary)]") {{ item.title }}
            p(class="text-xs text-[var(--text-muted)]") {{ item.time }}

    //- Yesterday's Highlights
    .glass-card.p-6(v-if="yesterdayHighlights.length")
      h2(class="text-xl font-bold mb-4 text-[var(--text-primary)]") {{ $t('briefing.yesterdayHighlights') }}
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
        .p-4.rounded-lg(
          v-for="(h, i) in yesterdayHighlights"
          :key="i"
          class="bg-[var(--bg-card)] border border-[var(--border-default)] transition-colors hover:border-[var(--brand-primary)]"
        )
          .flex.items-center.gap-3
            .w-10.h-10.rounded-full.flex.items-center.justify-center(:class="h.bgClass")
              Icon(:name="h.icon" size="18")
            div
              p(class="text-sm font-medium text-[var(--text-primary)]") {{ h.title }}
              p(class="text-xs text-[var(--text-muted)]") {{ h.description }}
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useDailyBriefing } from '~/composables/useDailyBriefing';
import { user } from '~/composables/useUser';

definePageMeta({ layout: 'default' });

const { greeting, priorities, yesterdayHighlights, todaySchedule, kpis, loading, fetchBriefing } = useDailyBriefing();

const userName = computed(() => {
  return user.value?.name || (user.value as any)?.firstName || 'there';
});

onMounted(() => {
  fetchBriefing();
});
</script>

<style lang="scss" scoped>
.glass-card {
  background: var(--glass-bg, rgba(30, 30, 45, 0.5));
  backdrop-filter: var(--glass-blur, blur(12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
  border-radius: 20px;
}
</style>
