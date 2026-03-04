<template lang="pug">
.smart-table-view
  el-table(
    ref="tableRef"
    :data="data"
    style="width: 100%"
    :row-style="{ cursor: 'pointer' }"
    :default-sort="currentSort"
    :max-height="maxHeight"
    @sort-change="handleSortChange"
    @selection-change="handleSelectionChange"
    @row-click="handleRowClick"
    border
    stripe
  )
    //- Checkbox selection column
    el-table-column(type="selection" width="45" fixed="left")

    //- Row index column
    el-table-column(type="index" width="50" fixed="left" label="#")

    //- Dynamic columns
    el-table-column(
      v-for="col in visibleColumns"
      :key="col.prop"
      :prop="col.prop"
      :label="col.label"
      :sortable="col.sortable ? 'custom' : false"
      :min-width="col.width || 150"
      :fixed="col.fixed ? 'left' : undefined"
      :show-overflow-tooltip="!isEditing(col.prop)"
      resizable
    )
      template(#default="scope")
        //- Editing mode
        .cell-edit-container(v-if="isEditingCell(scope.$index, col.prop)" @click.stop)
          el-input(
            v-if="col.type !== 'select' && col.type !== 'date'"
            v-model="editValue"
            :type="col.type === 'number' ? 'number' : 'text'"
            size="small"
            autofocus
            @keyup.enter="saveEdit(scope.$index, col.prop, scope.row)"
            @keyup.escape="cancelEdit"
            @blur="saveEdit(scope.$index, col.prop, scope.row)"
            ref="editInputRef"
          )
          el-date-picker(
            v-else-if="col.type === 'date'"
            v-model="editValue"
            type="date"
            size="small"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="saveEdit(scope.$index, col.prop, scope.row)"
            @blur="cancelEdit"
          )
          el-select(
            v-else-if="col.type === 'select'"
            v-model="editValue"
            size="small"
            @change="saveEdit(scope.$index, col.prop, scope.row)"
            @blur="cancelEdit"
          )
            el-option(
              v-for="opt in col.filters || []"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            )

        //- Display mode
        .cell-display(v-else @dblclick.stop="startEdit(scope.$index, col.prop, scope.row[col.prop])")
          //- Select type with tag
          template(v-if="col.type === 'select'")
            el-tag(
              v-if="scope.row[col.prop]"
              size="small"
              effect="dark"
              round
              :type="getStatusType(scope.row[col.prop])"
            ) {{ getSelectLabel(col, scope.row[col.prop]) }}
            span.text-muted(v-else) -

          //- Image type
          template(v-else-if="col.type === 'image'")
            el-avatar(
              v-if="scope.row[col.prop]"
              :src="scope.row[col.prop]"
              :size="32"
              shape="square"
            )
            span.text-muted(v-else) -

          //- Date type
          template(v-else-if="col.type === 'date'")
            span {{ formatDate(scope.row[col.prop]) }}

          //- Number type
          template(v-else-if="col.type === 'number'")
            span.font-mono {{ formatNumber(scope.row[col.prop]) }}

          //- Default text
          template(v-else)
            span {{ scope.row[col.prop] ?? '-' }}

    //- Empty state
    template(#empty)
      el-empty(:description="$t('common.noData')" image="/images/empty.png")
</template>

<script setup lang="ts">
import type { ElTable } from 'element-plus';
import type { SmartTableColumn, SmartTableSort } from '~/composables/useSmartTable';

const props = defineProps({
  data: {
    type: Array as PropType<any[]>,
    required: true
  },
  columns: {
    type: Array as PropType<SmartTableColumn[]>,
    required: true
  },
  sort: {
    type: Object as PropType<SmartTableSort | null>,
    default: null
  },
  maxHeight: {
    type: [String, Number],
    default: 600
  }
});

const emit = defineEmits<{
  'sort-change': [sort: SmartTableSort];
  'selection-change': [rows: any[]];
  'row-click': [row: any];
  'cell-edit': [payload: { row: any; prop: string; value: any; oldValue: any }];
}>();

const tableRef = ref<InstanceType<typeof ElTable> | null>(null);
const editInputRef = ref<any>(null);

// Inline editing state
const editingCell = ref<{ rowIndex: number; prop: string } | null>(null);
const editValue = ref<any>('');

// Computed
const visibleColumns = computed(() => [...props.columns].filter(c => c.visible !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));

const currentSort = computed(() => {
  if (!props.sort) return {};
  return { prop: props.sort.prop, order: props.sort.order };
});

// Methods
const isEditing = (prop: string) => {
  return editingCell.value?.prop === prop;
};

const isEditingCell = (rowIndex: number, prop: string) => {
  return editingCell.value?.rowIndex === rowIndex && editingCell.value?.prop === prop;
};

const startEdit = (rowIndex: number, prop: string, currentValue: any) => {
  editingCell.value = { rowIndex, prop };
  editValue.value = currentValue ?? '';
  nextTick(() => {
    if (editInputRef.value) {
      const inputEl = Array.isArray(editInputRef.value) ? editInputRef.value[0] : editInputRef.value;
      inputEl?.focus?.();
    }
  });
};

const saveEdit = (rowIndex: number, prop: string, row: any) => {
  if (!editingCell.value) return;
  const oldValue = row[prop];
  const newValue = editValue.value;

  if (String(oldValue) !== String(newValue)) {
    emit('cell-edit', { row, prop, value: newValue, oldValue });
  }
  editingCell.value = null;
  editValue.value = '';
};

const cancelEdit = () => {
  editingCell.value = null;
  editValue.value = '';
};

const handleSortChange = ({ prop, order }: { prop: string; order: string | null }) => {
  emit('sort-change', {
    prop,
    order: order as SmartTableSort['order']
  });
};

const handleSelectionChange = (rows: any[]) => {
  emit('selection-change', rows);
};

const handleRowClick = (row: any) => {
  emit('row-click', row);
};

const getStatusType = (status: string): string => {
  const lc = String(status).toLowerCase();
  if (['active', 'won', 'completed', 'approved'].includes(lc)) return 'success';
  if (['inactive', 'lost', 'rejected', 'cancelled'].includes(lc)) return 'danger';
  if (['pending', 'in_progress', 'review'].includes(lc)) return 'warning';
  if (['new', 'open', 'draft'].includes(lc)) return 'info';
  return '';
};

const getSelectLabel = (col: SmartTableColumn, value: any) => {
  const opt = col.filters?.find(f => f.value === value);
  return opt?.label || value;
};

const formatDate = (val: any) => {
  if (!val) return '-';
  try {
    const d = new Date(val);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return val;
  }
};

const formatNumber = (val: any) => {
  if (val == null || val === '') return '-';
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toLocaleString();
};

// Expose for parent
defineExpose({
  tableRef,
  clearSelection: () => tableRef.value?.clearSelection()
});
</script>

<style lang="scss" scoped>
.smart-table-view {
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-md, 10px);

  :deep(.el-table) {
    --el-table-bg-color: var(--bg-card, transparent);
    --el-table-tr-bg-color: transparent;
    --el-table-header-bg-color: var(--bg-tertiary);
    --el-table-row-hover-bg-color: var(--bg-hover);
    --el-table-border-color: var(--border-default);
    --el-table-text-color: var(--text-primary);
    --el-table-header-text-color: var(--text-secondary);

    background: transparent !important;

    .el-table__header th {
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .el-table__row {
      transition: all 0.15s ease;

      &:hover {
        transform: scale(1.001);
      }
    }

    .el-table__body td .cell {
      padding: 8px 12px;
    }

    // Column resize handle
    .el-table__column-resize-proxy {
      border-left: 2px solid var(--brand-primary, #7c3aed);
    }
  }
}

.cell-edit-container {
  width: 100%;
}

.cell-display {
  cursor: default;
  min-height: 22px;
  display: flex;
  align-items: center;
}

.text-muted {
  color: var(--text-muted);
  font-style: italic;
  font-size: 12px;
}

.font-mono {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
}
</style>
