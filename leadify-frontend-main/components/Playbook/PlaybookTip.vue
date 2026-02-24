<template lang="pug">
div(v-if="tips && tips.length" class="mt-4")
  .tip-card(
    class="rounded-xl p-4 border-l-4"
    style="background: rgba(251, 191, 36, 0.06); border-left-color: #f59e0b"
  )
    .flex.items-center.justify-between.cursor-pointer(@click="toggleExpanded")
      .flex.items-center.gap-2
        Icon(name="ph:lightbulb-filament-bold" size="18" class="text-amber-500")
        span(class="text-sm font-semibold text-[var(--text-primary)]") {{ $t('playbook.tips') }}
        span(class="text-xs px-2 py-px rounded-full bg-amber-500/10 text-amber-500 font-medium") {{ tips.length }}
      Icon(
        v-if="tips.length > 2"
        :name="expanded ? 'ph:caret-up-bold' : 'ph:caret-down-bold'"
        size="14"
        class="text-[var(--text-secondary)] transition-transform duration-200"
      )

    //- Tips list
    TransitionGroup(name="list" tag="ul" class="mt-3 space-y-2")
      li(
        v-for="(tip, index) in visibleTips"
        :key="index"
        class="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
      )
        Icon(name="ph:arrow-right" size="14" class="text-amber-500 mt-px flex-shrink-0")
        span {{ tip }}
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const props = defineProps<{
  tips: string[];
}>();

const expanded = ref(false);

const visibleTips = computed(() => {
  if (props.tips.length <= 2 || expanded.value) return props.tips;
  return props.tips.slice(0, 2);
});

function toggleExpanded() {
  if (props.tips.length > 2) expanded.value = !expanded.value;
}
</script>

<style lang="scss" scoped>
.tip-card {
  backdrop-filter: blur(8px);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
