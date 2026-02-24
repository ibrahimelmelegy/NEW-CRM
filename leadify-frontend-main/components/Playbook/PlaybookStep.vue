<template lang="pug">
div(
  class="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-[rgba(120,73,255,0.06)] group"
  @click="$emit('toggle')"
)
  //- Checkbox
  .flex-shrink-0.mt-px
    .check-box(
      class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300"
      :class="completed ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]' : 'border-[var(--text-secondary)] bg-transparent'"
    )
      Transition(name="scale")
        Icon(v-if="completed" name="ph:check-bold" size="12" class="text-white")

  //- Content
  .flex-1.min-w-0
    .flex.items-center.gap-2
      span(
        class="text-sm font-medium transition-all duration-300"
        :class="completed ? 'line-through text-[var(--text-secondary)] opacity-60' : 'text-[var(--text-primary)]'"
      ) {{ step.title }}
    p(
      class="text-xs mt-1 leading-relaxed transition-all duration-300"
      :class="completed ? 'text-[var(--text-secondary)] opacity-50' : 'text-[var(--text-secondary)]'"
    ) {{ step.description }}

  //- Time badge
  .flex-shrink-0
    span(
      class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
      style="background: rgba(120, 73, 255, 0.1); color: var(--brand-primary)"
    )
      Icon(name="ph:clock" size="12")
      | {{ step.estimatedMinutes }} {{ $t('playbook.minutes') }}
</template>

<script lang="ts" setup>
import type { PlaybookStep } from '~/composables/usePlaybook';

defineProps<{
  step: PlaybookStep;
  completed: boolean;
}>();

defineEmits<{
  (e: 'toggle'): void;
}>();
</script>

<style lang="scss" scoped>
.check-box {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
