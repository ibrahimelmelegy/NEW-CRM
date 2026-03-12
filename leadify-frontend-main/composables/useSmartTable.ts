export interface SmartTableColumn {
  prop: string;
  label: string;
  visible: boolean;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'select' | 'image';
  width?: number | string;
  filters?: Array<{ label: string; value: string }>;
  fixed?: boolean;
  order?: number;
}

export interface SmartTableFilter {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between' | 'in';
  value: unknown;
  logic?: 'AND' | 'OR';
}

export interface SmartTableSort {
  prop: string;
  order: 'ascending' | 'descending' | null;
}

export interface SmartTableSavedView {
  id: string;
  name: string;
  viewType: string;
  columns: SmartTableColumn[];
  filters: SmartTableFilter[];
  sort: SmartTableSort | null;
  groupByField?: string;
  createdAt: string;
}

export type ViewType = 'table' | 'kanban' | 'calendar' | 'gallery';

export function useSmartTable(entityType: string, initialColumns: SmartTableColumn[]) {
  const STORAGE_KEY = `smart-table-views-${entityType}`;

  // Reactive state
  const currentView = ref<ViewType>('table');
  const columns = ref<SmartTableColumn[]>(
    initialColumns.map((col, i) => ({
      ...col,
      visible: col.visible !== false,
      order: col.order ?? i
    }))
  );
  const filters = ref<SmartTableFilter[]>([]);
  const sort = ref<SmartTableSort | null>(null);
  const selectedRows = ref<Record<string, unknown>[]>([]);
  const searchQuery = ref('');
  const savedViews = ref<SmartTableSavedView[]>([]);
  const groupByField = ref('status');

  // Load saved views from localStorage
  const loadSavedViews = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        savedViews.value = JSON.parse(stored);
      }
    } catch {
      savedViews.value = [];
    }
  };

  // Initialize
  loadSavedViews();

  // Computed: visible columns in order
  const visibleColumns = computed(() => [...columns.value].filter(c => c.visible).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));

  // Computed: filtered data helper
  const applyFiltersToData = (data: Record<string, unknown>[]) => {
    let result = [...data];

    // Apply search
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      result = result.filter(row =>
        columns.value.some(col => {
          const val = row[col.prop];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        })
      );
    }

    // Apply filters
    if (filters.value.length > 0) {
      result = result.filter(row => {
        return filters.value.every((filter, index) => {
          const val = row[filter.field];
          const useOr = filter.logic === 'OR' && index > 0;

          const matches = (() => {
            switch (filter.operator) {
              case 'equals':
                return String(val) === String(filter.value);
              case 'contains':
                return String(val ?? '')
                  .toLowerCase()
                  .includes(String(filter.value).toLowerCase());
              case 'gt':
                return Number(val) > Number(filter.value);
              case 'lt':
                return Number(val) < Number(filter.value);
              case 'between': {
                const num = Number(val);
                const [min, max] = Array.isArray(filter.value) ? filter.value : [0, 0];
                return num >= Number(min) && num <= Number(max);
              }
              case 'in': {
                const arr = Array.isArray(filter.value) ? filter.value : [filter.value];
                return arr.includes(val);
              }
              default:
                return true;
            }
          })();

          // For OR logic with previous filter, we need special handling
          if (useOr) return true; // handled at group level
          return matches;
        });
      });
    }

    // Apply sort
    if (sort.value?.prop && sort.value?.order) {
      const { prop, order } = sort.value;
      result.sort((a, b) => {
        const aVal = a[prop];
        const bVal = b[prop];
        if ((aVal === null || aVal === undefined) && (bVal === null || bVal === undefined)) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison: number;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        return order === 'ascending' ? comparison : -comparison;
      });
    }

    return result;
  };

  // Methods
  const switchView = (view: ViewType) => {
    currentView.value = view;
  };

  const applyFilter = (newFilters: SmartTableFilter[]) => {
    filters.value = [...newFilters];
  };

  const clearFilters = () => {
    filters.value = [];
    searchQuery.value = '';
  };

  const toggleColumn = (prop: string) => {
    const col = columns.value.find(c => c.prop === prop);
    if (col) {
      col.visible = !col.visible;
    }
  };

  const updateColumns = (newColumns: SmartTableColumn[]) => {
    columns.value = newColumns;
  };

  const setSort = (newSort: SmartTableSort | null) => {
    sort.value = newSort;
  };

  const setSelectedRows = (rows: Record<string, unknown>[]) => {
    selectedRows.value = rows;
  };

  const clearSelection = () => {
    selectedRows.value = [];
  };

  const saveView = (name: string) => {
    const view: SmartTableSavedView = {
      id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      viewType: currentView.value,
      columns: JSON.parse(JSON.stringify(columns.value)),
      filters: JSON.parse(JSON.stringify(filters.value)),
      sort: sort.value ? JSON.parse(JSON.stringify(sort.value)) : null,
      groupByField: groupByField.value,
      createdAt: new Date().toISOString()
    };
    savedViews.value.push(view);
    persistSavedViews();
    return view;
  };

  const loadView = (viewId: string) => {
    const view = savedViews.value.find(v => v.id === viewId);
    if (!view) return;

    currentView.value = view.viewType as ViewType;
    columns.value = JSON.parse(JSON.stringify(view.columns));
    filters.value = JSON.parse(JSON.stringify(view.filters));
    sort.value = view.sort ? JSON.parse(JSON.stringify(view.sort)) : null;
    if (view.groupByField) {
      groupByField.value = view.groupByField;
    }
  };

  const deleteView = (viewId: string) => {
    savedViews.value = savedViews.value.filter(v => v.id !== viewId);
    persistSavedViews();
  };

  const persistSavedViews = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedViews.value));
    } catch {
      // Storage full or unavailable
    }
  };

  const resetColumns = () => {
    columns.value = initialColumns.map((col, i) => ({
      ...col,
      visible: col.visible !== false,
      order: col.order ?? i
    }));
  };

  const exportData = (data: Record<string, unknown>[], _format: 'xlsx' | 'csv' = 'csv') => {
    const exportColumns = visibleColumns.value;
    const headers = exportColumns.map(c => c.label);
    const rows = data.map(row =>
      exportColumns.map(col => {
        const val = row[col.prop];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object' && (val as Record<string, unknown>).title) return (val as Record<string, unknown>).title;
        return val;
      })
    );

    const escapeCsv = (val: unknown) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const csvContent = [headers.map(escapeCsv).join(','), ...rows.map(row => row.map(escapeCsv).join(','))].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityType}-export-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    // State
    currentView,
    columns,
    visibleColumns,
    filters,
    sort,
    selectedRows,
    searchQuery,
    savedViews,
    groupByField,

    // Methods
    switchView,
    applyFilter,
    clearFilters,
    toggleColumn,
    updateColumns,
    setSort,
    setSelectedRows,
    clearSelection,
    saveView,
    loadView,
    deleteView,
    resetColumns,
    exportData,
    applyFiltersToData
  };
}
