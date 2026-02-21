import { ref, computed } from 'vue';
import { ElNotification, ElMessageBox } from 'element-plus';

export interface BulkActionItem {
  id: string;
  [key: string]: any;
}

export function useBulkActions<T extends BulkActionItem>(items: Ref<T[]>) {
  const selectedIds = ref<Set<string>>(new Set());

  const selectedCount = computed(() => selectedIds.value.size);
  const isAllSelected = computed(() => items.value.length > 0 && selectedIds.value.size === items.value.length);
  const isSomeSelected = computed(() => selectedIds.value.size > 0 && selectedIds.value.size < items.value.length);
  const hasSelection = computed(() => selectedIds.value.size > 0);

  const selectedItems = computed(() => {
    return items.value.filter(item => selectedIds.value.has(item.id));
  });

  function toggleItem(id: string) {
    const newSet = new Set(selectedIds.value);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    selectedIds.value = newSet;
  }

  function toggleAll() {
    if (isAllSelected.value) {
      selectedIds.value = new Set();
    } else {
      selectedIds.value = new Set(items.value.map(item => item.id));
    }
  }

  function clearSelection() {
    selectedIds.value = new Set();
  }

  function isSelected(id: string): boolean {
    return selectedIds.value.has(id);
  }

  async function bulkDelete(deleteFn: (id: string) => Promise<any>, entityName: string = 'items'): Promise<boolean> {
    if (!hasSelection.value) return false;

    try {
      await ElMessageBox.confirm(`Are you sure you want to delete ${selectedCount.value} ${entityName}?`, 'Bulk Delete', {
        type: 'warning',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
      });

      const ids = Array.from(selectedIds.value);
      let successCount = 0;
      let failCount = 0;

      for (const id of ids) {
        try {
          await deleteFn(id);
          successCount++;
        } catch {
          failCount++;
        }
      }

      clearSelection();

      if (failCount === 0) {
        ElNotification({ type: 'success', title: 'Deleted', message: `${successCount} ${entityName} deleted successfully` });
      } else {
        ElNotification({ type: 'warning', title: 'Partial Success', message: `${successCount} deleted, ${failCount} failed` });
      }

      return true;
    } catch {
      return false; // Cancelled
    }
  }

  async function bulkUpdate(
    updateFn: (id: string, data: Partial<T>) => Promise<any>,
    data: Partial<T>,
    entityName: string = 'items'
  ): Promise<boolean> {
    if (!hasSelection.value) return false;

    const ids = Array.from(selectedIds.value);
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        await updateFn(id, data);
        successCount++;
      } catch {
        failCount++;
      }
    }

    clearSelection();

    if (failCount === 0) {
      ElNotification({ type: 'success', title: 'Updated', message: `${successCount} ${entityName} updated` });
    } else {
      ElNotification({ type: 'warning', title: 'Partial Success', message: `${successCount} updated, ${failCount} failed` });
    }

    return true;
  }

  return {
    selectedIds,
    selectedCount,
    selectedItems,
    isAllSelected,
    isSomeSelected,
    hasSelection,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
    bulkDelete,
    bulkUpdate
  };
}
