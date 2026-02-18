<template lang="pug">
.graph-filters.flex.items-center.gap-3.flex-wrap
  .filter-chip(
    v-for="f in filterOptions"
    :key="f.value"
    :class="{ active: modelValue.includes(f.value) }"
    @click="toggle(f.value)"
    :style="modelValue.includes(f.value) ? { borderColor: f.color, color: f.color } : {}"
  )
    .filter-dot(:style="{ background: f.color }")
    span {{ f.label }}
    span.filter-count(v-if="counts[f.value]") {{ counts[f.value] }}
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string[];
  counts: Record<string, number>;
}>();

const emit = defineEmits(['update:modelValue']);

const filterOptions = [
  { value: 'lead', label: 'Leads', color: '#3b82f6' },
  { value: 'deal', label: 'Deals', color: '#8b5cf6' },
  { value: 'client', label: 'Clients', color: '#22c55e' },
  { value: 'user', label: 'Users', color: '#f59e0b' }
];

function toggle(type: string) {
  const current = [...props.modelValue];
  const idx = current.indexOf(type);
  if (idx >= 0) {
    if (current.length > 1) current.splice(idx, 1);
  } else {
    current.push(type);
  }
  emit('update:modelValue', current);
}
</script>

<style lang="scss" scoped>
.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s;
  user-select: none;

  &:hover { border-color: rgba(255, 255, 255, 0.2); }
  &.active { background: rgba(255, 255, 255, 0.05); }
}

.filter-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.filter-count {
  font-size: 11px;
  opacity: 0.6;
}
</style>
