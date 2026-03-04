<template lang="pug">
.kanban-toolbar.glass-card.rounded-2xl.p-3.mb-4.flex.items-center.justify-between.flex-wrap.gap-2
  .flex.items-center.gap-3.flex-wrap
    //- Swimlane toggle
    el-select.swimlane-select(
      :model-value="swimlaneMode"
      :placeholder="$t('kanbanBoard.groupBy')"
      size="small"
      @change="$emit('update:swimlaneMode', $event)"
    )
      el-option(:label="$t('kanbanBoard.noGrouping')" value="none")
      el-option(:label="$t('kanbanBoard.byAssignee')" value="assignee")
      el-option(:label="$t('kanbanBoard.byPriority')" value="priority")
      el-option(:label="$t('kanbanBoard.byValueRange')" value="value")

    //- Quick filters
    .flex.items-center.gap-2
      el-tag.cursor-pointer(
        v-for="filter in quickFilters"
        :key="filter.key"
        :type="activeFilter === filter.key ? '' : 'info'"
        :effect="activeFilter === filter.key ? 'dark' : 'plain'"
        size="small"
        @click="onFilterClick(filter.key)"
      ) {{ filter.label }}

  .flex.items-center.gap-2
    //- Card count
    span.text-xs.text-gray-400 {{ totalCards }} cards

    //- Collapse all swimlanes
    el-button(
      v-if="swimlaneMode !== 'none'"
      size="small"
      text
      @click="$emit('toggleAll')"
    )
      Icon(name="ph:arrows-in-bold" size="16")
</template>

<script setup lang="ts">
interface QuickFilter {
  key: string;
  label: string;
}

interface Props {
  swimlaneMode: string;
  totalCards: number;
  activeFilter?: string;
}

const props = withDefaults(defineProps<Props>(), {
  activeFilter: 'all'
});

const emit = defineEmits<{
  (e: 'update:swimlaneMode', value: string): void;
  (e: 'filter', key: string): void;
  (e: 'toggleAll'): void;
}>();

const quickFilters: QuickFilter[] = [
  { key: 'all', label: 'All' },
  { key: 'high-value', label: 'High Value' },
  { key: 'stale', label: 'Stale' },
  { key: 'closing-soon', label: 'Closing Soon' }
];

function onFilterClick(key: string) {
  emit('filter', key);
}
</script>

<style scoped lang="scss">
.kanban-toolbar {
  background: rgba(18, 18, 30, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.swimlane-select {
  width: 160px;
}
</style>
