<template lang="pug">
div(class="stage-card glass-card overflow-hidden animate-entrance" :style="{ animationDelay: (stage.order * 80) + 'ms' }")
  //- Stage header
  .flex.items-center.justify-between.p-5.cursor-pointer(@click="expanded = !expanded")
    .flex.items-center.gap-3
      //- Stage number badge
      .stage-number(
        class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
        :class="completion === 100 ? 'bg-emerald-500' : ''"
        :style="completion < 100 ? 'background: var(--brand-primary)' : ''"
      )
        Icon(v-if="completion === 100" name="ph:check-bold" size="18")
        span(v-else) {{ stage.order }}

      div
        h3(class="text-base font-semibold text-[var(--text-primary)]") {{ stage.name }}
        p(class="text-xs text-[var(--text-secondary)] mt-px") {{ stage.description }}

    .flex.items-center.gap-4
      //- Stage progress
      .flex.items-center.gap-2
        .mini-progress(class="w-20 h-2 rounded-full overflow-hidden" style="background: rgba(128, 128, 128, 0.15)")
          .mini-fill(
            class="h-full rounded-full transition-all duration-500"
            :style="{ width: completion + '%' }"
            :class="completion === 100 ? 'bg-emerald-500' : ''"
          )
        span(class="text-xs font-semibold whitespace-nowrap" :class="completion === 100 ? 'text-emerald-500' : 'text-[var(--brand-primary)]'") {{ completion }}%

      //- Expand/collapse icon
      Icon(
        :name="expanded ? 'ph:caret-up-bold' : 'ph:caret-down-bold'"
        size="16"
        class="text-[var(--text-secondary)] transition-transform duration-200"
      )

  //- Steps list
  Transition(name="expand")
    div(v-show="expanded")
      .px-5.pb-2
        .divider(class="border-t" style="border-color: var(--glass-border)")

      .px-3.pb-3
        PlaybookStep(
          v-for="step in stage.steps"
          :key="step.id"
          :step="step"
          :completed="!!progress[step.id]"
          @toggle="$emit('toggle-step', step.id)"
        )

      //- Tips section
      .px-5.pb-5(v-if="stage.tips && stage.tips.length")
        PlaybookTip(:tips="stage.tips")

      //- Stage stats
      .px-5.pb-4
        .flex.items-center.gap-4(class="text-xs text-[var(--text-secondary)]")
          .flex.items-center.gap-1
            Icon(name="ph:list-checks" size="14")
            span {{ completedCount }}/{{ stage.steps.length }} {{ $t('playbook.steps') }}
          .flex.items-center.gap-1
            Icon(name="ph:clock" size="14")
            span {{ totalMinutes }} {{ $t('playbook.minutes') }} {{ $t('playbook.estimatedTime').toLowerCase() }}
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { PlaybookStage } from '~/composables/usePlaybook';

const props = defineProps<{
  stage: PlaybookStage;
  progress: Record<string, boolean>;
}>();

defineEmits<{
  (e: 'toggle-step', stepId: string): void;
}>();

const expanded = ref(true);

const completedCount = computed(() => {
  return props.stage.steps.filter(s => props.progress[s.id]).length;
});

const completion = computed(() => {
  if (!props.stage.steps.length) return 0;
  return Math.round((completedCount.value / props.stage.steps.length) * 100);
});

const totalMinutes = computed(() => {
  return props.stage.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
});
</script>

<style lang="scss" scoped>
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}

.stage-card {
  border-left: 3px solid var(--brand-primary);
  transition: all 0.3s ease;

  &:hover {
    border-left-color: var(--brand-accent, #a78bfa);
  }
}

.mini-fill {
  background: linear-gradient(90deg, var(--brand-primary), var(--brand-accent, #a78bfa));
}

.mini-fill.bg-emerald-500 {
  background: #10b981 !important;
}

.animate-entrance {
  animation: slideUp 0.4s ease-out both;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>
