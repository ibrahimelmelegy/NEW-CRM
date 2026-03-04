<template lang="pug">
.kanban-view
  .kanban-board(ref="boardRef")
    .kanban-column(
      v-for="group in groups"
      :key="group.key"
      :class="{ 'kanban-column-highlight': dragOverGroup === group.key }"
    )
      .kanban-column-header
        .kanban-column-title
          .kanban-color-dot(:style="{ background: getGroupColor(group.key) }")
          span.kanban-group-name {{ group.label }}
          span.kanban-count {{ group.items.length }}
        .kanban-column-aggregate(v-if="aggregateField && group.aggregate != null")
          span {{ formatAggregate(group.aggregate) }}

      .kanban-column-body
        draggable(
          v-model="group.items"
          :group="{ name: 'kanban' }"
          item-key="id"
          :animation="200"
          ghost-class="kanban-card-ghost"
          drag-class="kanban-card-drag"
          @start="onDragStart($event, group.key)"
          @end="onDragEnd"
          @change="(evt) => onDragChange(evt, group.key)"
          class="kanban-cards-list"
        )
          template(#item="{ element }")
            .kanban-card.glass-card.interactive(@click="$emit('row-click', element)")
              .kanban-card-fields
                .kanban-card-field(v-for="col in displayColumns" :key="col.prop")
                  .kanban-field-label {{ col.label }}
                  .kanban-field-value
                    el-tag(
                      v-if="col.type === 'select'"
                      size="small"
                      effect="dark"
                      round
                      :type="getStatusTagType(element[col.prop])"
                    ) {{ element[col.prop] || '-' }}
                    span(v-else) {{ formatFieldValue(col, element[col.prop]) }}

      .kanban-column-footer
        span {{ group.items.length }} {{ group.items.length === 1 ? 'item' : 'items' }}
</template>

<script setup lang="ts">
import draggable from 'vuedraggable';
import type { SmartTableColumn } from '~/composables/useSmartTable';

interface KanbanGroup {
  key: string;
  label: string;
  items: any[];
  aggregate: number | null;
}

const props = defineProps({
  data: {
    type: Array as PropType<any[]>,
    required: true
  },
  columns: {
    type: Array as PropType<SmartTableColumn[]>,
    required: true
  },
  groupByField: {
    type: String,
    default: 'status'
  },
  aggregateField: {
    type: String,
    default: ''
  }
});

const emit = defineEmits<{
  'card-move': [payload: { item: any; fromGroup: string; toGroup: string }];
  'row-click': [row: any];
}>();

const boardRef = ref<HTMLElement | null>(null);
const dragOverGroup = ref<string | null>(null);
const dragFromGroup = ref<string | null>(null);

// Show first 3 visible columns (excluding groupBy field)
const displayColumns = computed(() =>
  props.columns
    .filter(c => c.visible !== false && c.prop !== props.groupByField)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, 3)
);

// Get unique group values
const groupKeys = computed(() => {
  const groupCol = props.columns.find(c => c.prop === props.groupByField);
  if (groupCol?.filters?.length) {
    return groupCol.filters.map(f => ({ key: f.value, label: f.label }));
  }
  // Derive from data
  const uniqueValues = [...new Set(props.data.map(row => row[props.groupByField]))].filter(Boolean);
  return uniqueValues.map(v => ({ key: String(v), label: String(v) }));
});

// Build groups
const groups = ref<KanbanGroup[]>([]);

const buildGroups = () => {
  groups.value = groupKeys.value.map(gk => {
    const items = props.data.filter(row => String(row[props.groupByField]) === String(gk.key));
    let aggregate: number | null = null;
    if (props.aggregateField) {
      aggregate = items.reduce((sum, row) => {
        const val = Number(row[props.aggregateField]);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
    }
    return {
      key: gk.key,
      label: gk.label,
      items: items.map(item => ({ ...item })),
      aggregate
    };
  });
};

watch(
  () => [props.data, props.groupByField, props.aggregateField],
  () => buildGroups(),
  { immediate: true, deep: true }
);

// Drag handlers
const onDragStart = (_evt: any, groupKey: string) => {
  dragFromGroup.value = groupKey;
};

const onDragEnd = () => {
  dragOverGroup.value = null;
  dragFromGroup.value = null;
};

const onDragChange = (evt: any, toGroupKey: string) => {
  if (evt.added) {
    const item = evt.added.element;
    const fromGroup = dragFromGroup.value || '';

    if (fromGroup !== toGroupKey) {
      // Update the groupBy field on the item
      item[props.groupByField] = toGroupKey;

      emit('card-move', {
        item: { ...item },
        fromGroup,
        toGroup: toGroupKey
      });
    }
  }
};

// Color generation
const groupColorMap = new Map<string, string>();
const groupColors = [
  '#7c3aed',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#8b5cf6',
  '#f97316',
  '#14b8a6',
  '#6366f1',
  '#84cc16'
];

const getGroupColor = (key: string) => {
  if (!groupColorMap.has(key)) {
    const idx = groupColorMap.size % groupColors.length;
    groupColorMap.set(key, groupColors[idx]!);
  }
  return groupColorMap.get(key) || '';
};

const getStatusTagType = (status: string): string => {
  const lc = String(status || '').toLowerCase();
  if (['active', 'won', 'completed', 'approved'].includes(lc)) return 'success';
  if (['inactive', 'lost', 'rejected', 'cancelled'].includes(lc)) return 'danger';
  if (['pending', 'in_progress', 'review'].includes(lc)) return 'warning';
  if (['new', 'open', 'draft'].includes(lc)) return 'info';
  return '';
};

const formatFieldValue = (col: SmartTableColumn, val: any) => {
  if (val == null || val === '') return '-';
  if (col.type === 'date') {
    try {
      return new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return val;
    }
  }
  if (col.type === 'number') {
    const num = Number(val);
    return isNaN(num) ? val : num.toLocaleString();
  }
  return val;
};

const formatAggregate = (val: number) => {
  return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
};
</script>

<style lang="scss" scoped>
.kanban-view {
  width: 100%;
  overflow: hidden;
}

.kanban-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 8px 4px 16px;
  min-height: 400px;
}

.kanban-column {
  flex: 0 0 280px;
  min-width: 280px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 14px);
  transition: border-color 0.2s ease;

  &.kanban-column-highlight {
    border-color: var(--brand-primary, #7c3aed);
  }
}

.kanban-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border-default);
}

.kanban-column-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kanban-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.kanban-group-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  text-transform: capitalize;
}

.kanban-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--bg-hover, rgba(255, 255, 255, 0.08));
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
}

.kanban-column-aggregate {
  font-size: 12px;
  font-weight: 600;
  color: var(--brand-primary, #7c3aed);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.kanban-column-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 100px;
}

.kanban-cards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 60px;
}

.kanban-card {
  padding: 12px 14px;
  border-radius: var(--radius-md, 10px) !important;
  cursor: grab;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  &:active {
    cursor: grabbing;
  }
}

.kanban-card-ghost {
  opacity: 0.3;
  border: 2px dashed var(--brand-primary, #7c3aed) !important;
}

.kanban-card-drag {
  transform: rotate(3deg);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4) !important;
}

.kanban-card-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kanban-card-field {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.kanban-field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  min-width: 50px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.kanban-field-value {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kanban-column-footer {
  padding: 8px 16px;
  border-top: 1px solid var(--border-default);
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}
</style>
