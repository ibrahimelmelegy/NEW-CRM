<template lang="pug">
el-drawer(
  v-model="drawerVisible"
  direction="rtl"
  :show-close="true"
  destroy-on-close
  size="380px"
  append-to-body
  :title="'Manage Columns'"
)
  template(#header)
    .column-manager-header
      h4.text-lg.font-bold Manage Columns

  template(#default)
    .column-manager-body
      .column-search
        el-input(
          v-model="searchTerm"
          placeholder="Search columns..."
          :prefix-icon="Search"
          size="default"
          clearable
        )

      .column-actions-row
        el-button(text size="small" @click="selectAll") Select All
        el-button(text size="small" @click="deselectAll") Deselect All

      .column-list-wrapper
        draggable(
          v-model="localColumns"
          item-key="prop"
          handle=".drag-handle"
          :animation="200"
          ghost-class="column-ghost"
          @end="onDragEnd"
        )
          template(#item="{ element, index }")
            .column-item(v-show="matchesSearch(element)")
              .drag-handle
                el-icon
                  Rank
              el-checkbox(
                :model-value="element.visible"
                @change="toggleVisibility(index)"
              )
                span.column-label {{ element.label }}
              .column-type-badge(v-if="element.type")
                el-tag(size="small" :type="getTagType(element.type)" effect="plain" round) {{ element.type }}

  template(#footer)
    .column-manager-footer
      el-button(size="default" @click="resetToDefault")
        el-icon
          RefreshLeft
        span {{ $t('common.reset') }}
      el-button(type="primary" size="default" @click="applyChanges")
        span {{ $t('common.save') || 'Apply' }}
</template>

<script setup lang="ts">
import { Search, Rank, RefreshLeft } from '@element-plus/icons-vue';
import draggable from 'vuedraggable';
import type { SmartTableColumn } from '~/composables/useSmartTable';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  columns: {
    type: Array as PropType<SmartTableColumn[]>,
    required: true,
  },
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'update:columns': [columns: SmartTableColumn[]];
  'reset': [];
}>();

const searchTerm = ref('');

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// Deep clone columns for local editing
const localColumns = ref<SmartTableColumn[]>([]);

watch(
  () => props.columns,
  (newCols) => {
    localColumns.value = JSON.parse(JSON.stringify(newCols));
  },
  { immediate: true, deep: true }
);

const matchesSearch = (col: SmartTableColumn) => {
  if (!searchTerm.value) return true;
  return col.label.toLowerCase().includes(searchTerm.value.toLowerCase());
};

const toggleVisibility = (index: number) => {
  localColumns.value[index].visible = !localColumns.value[index].visible;
};

const selectAll = () => {
  localColumns.value.forEach((col) => {
    col.visible = true;
  });
};

const deselectAll = () => {
  localColumns.value.forEach((col) => {
    col.visible = false;
  });
};

const onDragEnd = () => {
  // Update order based on new position
  localColumns.value.forEach((col, i) => {
    col.order = i;
  });
};

const getTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    text: '',
    number: 'success',
    date: 'warning',
    select: 'info',
    image: 'danger',
  };
  return typeMap[type] || '';
};

const resetToDefault = () => {
  emit('reset');
  drawerVisible.value = false;
};

const applyChanges = () => {
  // Update order property based on current position
  localColumns.value.forEach((col, i) => {
    col.order = i;
  });
  emit('update:columns', JSON.parse(JSON.stringify(localColumns.value)));
  drawerVisible.value = false;
};
</script>

<style lang="scss" scoped>
.column-manager-header {
  display: flex;
  align-items: center;
}

.column-manager-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column-search {
  padding: 0 4px;
}

.column-actions-row {
  display: flex;
  justify-content: flex-start;
  gap: 4px;
  padding: 0 4px;
}

.column-list-wrapper {
  display: flex;
  flex-direction: column;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-sm, 6px);
  transition: background 0.15s ease;
  cursor: default;

  &:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.05));
  }
}

.drag-handle {
  cursor: grab;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  padding: 2px;

  &:active {
    cursor: grabbing;
  }
}

.column-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.column-type-badge {
  margin-left: auto;
  flex-shrink: 0;
}

.column-ghost {
  opacity: 0.4;
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
}

.column-manager-footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
