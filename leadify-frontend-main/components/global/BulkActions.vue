<template lang="pug">
Transition(name="slide-up")
  .glass-card.px-6.py-3.flex.items-center.gap-4.mb-4.animate-entrance(v-if="count > 0")
    .flex.items-center.gap-2
      span.font-bold.text-lg(style="color: var(--text-primary)") {{ count }}
      span.text-sm(style="color: var(--text-muted)") {{ $t('common.selected') || 'selected' }}
    .h-6.w-px(style="background: var(--glass-border-color)")
    .flex.items-center.gap-2
      el-button(v-if="actions.includes('delete')" size="small" type="danger" @click="$emit('bulk-delete')" class="!rounded-xl")
        Icon(name="ph:trash-bold" size="14")
        span.ml-1 {{ $t('common.delete') }}
      el-button(v-if="actions.includes('export')" size="small" @click="$emit('bulk-export')" class="!rounded-xl")
        Icon(name="ph:export-bold" size="14")
        span.ml-1 {{ $t('common.export') }}
      el-button(v-if="actions.includes('status')" size="small" @click="$emit('bulk-status')" class="!rounded-xl")
        Icon(name="ph:swap-bold" size="14")
        span.ml-1 {{ $t('common.changeStatus') || 'Change Status' }}
      el-button(v-if="actions.includes('assign')" size="small" @click="$emit('bulk-assign')" class="!rounded-xl")
        Icon(name="ph:user-plus-bold" size="14")
        span.ml-1 {{ $t('common.assign') || 'Assign' }}
      slot
    .ml-auto
      el-button(text @click="$emit('clear-selection')")
        span.text-sm {{ $t('common.clearSelection') || 'Clear' }}
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count: number;
    actions?: string[];
  }>(),
  {
    actions: () => ['delete', 'export']
  }
);

defineEmits<{
  'bulk-delete': [];
  'bulk-export': [];
  'bulk-status': [];
  'bulk-assign': [];
  'clear-selection': [];
}>();
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
