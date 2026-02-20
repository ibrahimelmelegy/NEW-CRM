<template lang="pug">
.smart-table-container.glass-card.animate-entrance
  //- Toolbar
  .smart-table-toolbar
    .toolbar-left
      //- View switcher tabs
      .view-switcher
        button.view-tab(
          v-for="view in views"
          :key="view"
          :class="{ active: currentView === view }"
          @click="switchView(view)"
        )
          el-icon(:size="16")
            Grid(v-if="view === 'table'")
            TrendCharts(v-else-if="view === 'kanban'")
            Calendar(v-else-if="view === 'calendar'")
            PictureFilled(v-else-if="view === 'gallery'")
          span.view-tab-label {{ getViewLabel(view) }}

    .toolbar-right
      //- Search
      .toolbar-search
        el-input(
          v-model="searchQuery"
          :placeholder="$t('common.search')"
          :prefix-icon="Search"
          size="default"
          clearable
          @input="debouncedSearch"
          @clear="debouncedSearch"
        )

      //- Filter toggle
      el-button(
        size="default"
        :class="['premium-btn-outline', { 'filter-active': filters.length > 0 }]"
        @click="showFilters = !showFilters"
      )
        el-icon
          Filter
        span {{ $t('common.filter') }}
        span.filter-badge(v-if="filters.length > 0") {{ filters.length }}

      //- Column manager
      el-button(
        size="default"
        class="premium-btn-outline"
        @click="showColumnManager = true"
      )
        el-icon
          Setting
        span Columns

      //- Saved views
      SmartTableSavedViews(
        :views="savedViews"
        @load-view="loadView"
        @save-view="saveView"
        @delete-view="deleteView"
      )

      //- Export dropdown
      el-dropdown(trigger="click" @command="handleExport")
        el-button(size="default" class="premium-btn-outline")
          el-icon
            Download
          span {{ $t('common.export') }}
        template(#dropdown)
          el-dropdown-menu
            el-dropdown-item(command="xlsx")
              el-icon
                Document
              span Export XLSX
            el-dropdown-item(command="csv")
              el-icon
                Document
              span Export CSV

  //- Filter builder (collapsible)
  Transition(name="expand")
    .smart-table-filters(v-if="showFilters")
      SmartTableFilterBuilder(
        :columns="columns"
        :filters="filters"
        @apply-filters="applyFilter"
        @clear-filters="clearFilters"
      )

  //- Loading skeleton
  .smart-table-loading(v-if="loading")
    el-skeleton(:rows="8" animated)

  //- View content
  .smart-table-content(v-else)
    //- Table view
    SmartTableViewsTableView(
      v-if="currentView === 'table'"
      :data="processedData"
      :columns="columns"
      :sort="sort"
      @sort-change="setSort"
      @selection-change="setSelectedRows"
      @row-click="(row) => $emit('row-click', row)"
      @cell-edit="(payload) => $emit('cell-edit', payload)"
      ref="tableViewRef"
    )

    //- Kanban view
    SmartTableViewsKanbanView(
      v-if="currentView === 'kanban'"
      :data="processedData"
      :columns="columns"
      :groupByField="groupByField"
      :aggregateField="aggregateField"
      @card-move="(payload) => $emit('card-move', payload)"
      @row-click="(row) => $emit('row-click', row)"
    )

    //- Calendar view
    SmartTableViewsCalendarView(
      v-if="currentView === 'calendar'"
      :data="processedData"
      :columns="columns"
      :dateField="dateField"
      @row-click="(row) => $emit('row-click', row)"
      @date-select="(date) => $emit('date-select', date)"
    )

    //- Gallery view
    SmartTableViewsGalleryView(
      v-if="currentView === 'gallery'"
      :data="processedData"
      :columns="columns"
      @row-click="(row) => $emit('row-click', row)"
    )

  //- Pagination (for table and gallery views)
  .smart-table-pagination(v-if="pagination && (currentView === 'table' || currentView === 'gallery') && !loading")
    .pagination-info
      span.text-xs.font-bold.text-muted.uppercase.tracking-widest {{ $t('common.showEntries') }}
      el-select(
        v-model="pageSize"
        style="width: 75px"
        size="default"
        @change="handlePageSizeChange"
      )
        el-option(v-for="size in [10, 25, 50]" :key="size" :label="size" :value="size")
      span.text-xs.font-bold.text-muted.uppercase.tracking-widest {{ $t('common.entries') }}
    el-pagination(
      background
      style="direction: ltr"
      :pager-count="4"
      :page-count="pagination.totalPages || 1"
      v-model:current-page="currentPage"
      :page-size="pageSize"
      layout="prev, pager, next"
      :total="pagination.totalItems || 0"
    )

  //- Column manager drawer
  SmartTableColumnManager(
    v-model="showColumnManager"
    :columns="columns"
    @update:columns="updateColumns"
    @reset="resetColumns"
  )

  //- Bulk actions bar
  SmartTableBulkActions(
    :selectedCount="selectedRows.length"
    :statusOptions="statusOptions"
    @bulk-delete="$emit('bulk-delete', selectedRows)"
    @bulk-export="handleBulkExport"
    @bulk-status-change="(status) => $emit('bulk-status-change', { rows: selectedRows, status })"
    @clear-selection="clearSelection"
  )
</template>

<script setup lang="ts">
import {
  Search, Filter, Setting, Download, Document,
  Grid, TrendCharts, Calendar, PictureFilled,
} from '@element-plus/icons-vue';
import { useSmartTable } from '~/composables/useSmartTable';
import type { SmartTableColumn, ViewType } from '~/composables/useSmartTable';

const props = defineProps({
  columns: {
    type: Array as PropType<SmartTableColumn[]>,
    required: true,
  },
  data: {
    type: Array as PropType<any[]>,
    required: true,
  },
  views: {
    type: Array as PropType<ViewType[]>,
    default: () => ['table', 'kanban', 'calendar', 'gallery'],
  },
  entityType: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: Object as PropType<{ totalItems: number; totalPages: number } | null>,
    default: null,
  },
  filterOptions: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  groupByField: {
    type: String,
    default: 'status',
  },
  dateField: {
    type: String,
    default: 'createdAt',
  },
  aggregateField: {
    type: String,
    default: '',
  },
  statusOptions: {
    type: Array as PropType<Array<{ label: string; value: string }>>,
    default: () => [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Archived', value: 'archived' },
    ],
  },
});

const emit = defineEmits<{
  'row-click': [row: any];
  'cell-edit': [payload: { row: any; prop: string; value: any; oldValue: any }];
  'card-move': [payload: { item: any; fromGroup: string; toGroup: string }];
  'date-select': [date: string];
  'bulk-delete': [rows: any[]];
  'bulk-export': [rows: any[]];
  'bulk-status-change': [payload: { rows: any[]; status: string }];
  'page-change': [page: number];
  'page-size-change': [size: number];
  'sort-change': [sort: any];
  'filter-change': [filters: any[]];
  'search': [query: string];
}>();

const {
  currentView,
  columns: smartColumns,
  visibleColumns,
  filters,
  sort,
  selectedRows,
  searchQuery,
  savedViews,
  groupByField: smartGroupByField,
  switchView,
  applyFilter,
  clearFilters,
  toggleColumn,
  updateColumns,
  setSort: setSmartSort,
  setSelectedRows,
  clearSelection,
  saveView,
  loadView,
  deleteView,
  resetColumns,
  exportData,
  applyFiltersToData,
} = useSmartTable(props.entityType, props.columns);

// Local state
const showFilters = ref(false);
const showColumnManager = ref(false);
const tableViewRef = ref<any>(null);
const currentPage = ref(1);
const pageSize = ref(10);

// Sync columns from props when they change externally
watch(
  () => props.columns,
  (newCols) => {
    // Only update if columns are different from current managed columns
    if (JSON.stringify(newCols.map((c) => c.prop)) !== JSON.stringify(smartColumns.value.map((c) => c.prop))) {
      updateColumns(
        newCols.map((col, i) => ({
          ...col,
          visible: col.visible !== false,
          order: col.order ?? i,
        }))
      );
    }
  }
);

// Sync groupByField from props
watch(
  () => props.groupByField,
  (val) => {
    smartGroupByField.value = val;
  },
  { immediate: true }
);

// Processed data = data after applying client-side filters & search
const processedData = computed(() => {
  return applyFiltersToData(props.data);
});

// Columns pass-through: use managed columns
const columns = computed(() => smartColumns.value);

// Methods
const setSort = (newSort: any) => {
  setSmartSort(newSort);
  emit('sort-change', newSort);
};

let searchTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    emit('search', searchQuery.value);
  }, 400);
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  emit('page-size-change', size);
};

watch(currentPage, (page) => {
  emit('page-change', page);
});

const handleExport = (format: string) => {
  exportData(processedData.value, format as 'xlsx' | 'csv');
};

const handleBulkExport = () => {
  exportData(selectedRows.value);
  emit('bulk-export', selectedRows.value);
};

const getViewLabel = (view: ViewType) => {
  const labels: Record<ViewType, string> = {
    table: 'Table',
    kanban: 'Kanban',
    calendar: 'Calendar',
    gallery: 'Gallery',
  };
  return labels[view] || view;
};

// Expose
defineExpose({
  clearSelection,
  switchView,
  processedData,
});
</script>

<style lang="scss" scoped>
.smart-table-container {
  padding: 20px;
  border-radius: 20px !important;
}

.smart-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-search {
  width: 220px;
}

// View switcher tabs
.view-switcher {
  display: flex;
  background: var(--bg-secondary, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 10px);
  padding: 3px;
  gap: 2px;
}

.view-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }

  &.active {
    background: var(--gradient-primary, linear-gradient(135deg, #7c3aed, #a855f7));
    color: #fff;
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
  }
}

.view-tab-label {
  @media (max-width: 768px) {
    display: none;
  }
}

// Filter badge
.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--brand-primary, #7c3aed);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  margin-left: 4px;
}

.filter-active {
  border-color: var(--brand-primary, #7c3aed) !important;
}

// Filter section
.smart-table-filters {
  margin-bottom: 16px;
}

// Loading
.smart-table-loading {
  padding: 20px 0;
}

// Content area
.smart-table-content {
  min-height: 200px;
}

// Pagination
.smart-table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--border-default);
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

// Transition for filter expand
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

.text-muted {
  color: var(--text-muted);
}
</style>
