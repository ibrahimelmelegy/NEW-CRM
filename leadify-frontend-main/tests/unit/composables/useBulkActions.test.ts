/**
 * useBulkActions - Unit Tests
 * ============================
 * Tests for composables/useBulkActions.ts
 *
 * The composable provides:
 * - selectedIds, selectedCount, selectedItems
 * - isAllSelected, isSomeSelected, hasSelection
 * - toggleItem, toggleAll, clearSelection, isSelected
 * - bulkDelete, bulkUpdate
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

import { useBulkActions } from '@/composables/useBulkActions';

// ============================================
// Mocks
// ============================================
const mockElNotification = vi.fn();
const mockElMessageBox = { confirm: vi.fn() };

vi.mock('element-plus', () => ({
  ElNotification: (...args: unknown[]) => mockElNotification(...args),
  ElMessageBox: {
    confirm: (...args: unknown[]) => mockElMessageBox.confirm(...args)
  }
}));

interface TestItem {
  id: string;
  name: string;
  [key: string]: unknown;
}

describe('useBulkActions', () => {
  let items: ReturnType<typeof ref<TestItem[]>>;
  let bulkActions: ReturnType<typeof useBulkActions<TestItem>>;

  beforeEach(() => {
    vi.clearAllMocks();
    items = ref<TestItem[]>([
      { id: 'item-1', name: 'Item 1' },
      { id: 'item-2', name: 'Item 2' },
      { id: 'item-3', name: 'Item 3' }
    ]);
    bulkActions = useBulkActions<TestItem>(items);
  });

  // ============================================
  // Initial State
  // ============================================
  describe('initial state', () => {
    it('should have empty selection initially', () => {
      expect(bulkActions.selectedIds.value.size).toBe(0);
      expect(bulkActions.selectedCount.value).toBe(0);
      expect(bulkActions.hasSelection.value).toBe(false);
      expect(bulkActions.isAllSelected.value).toBe(false);
      expect(bulkActions.isSomeSelected.value).toBe(false);
    });

    it('should have empty selectedItems initially', () => {
      expect(bulkActions.selectedItems.value).toHaveLength(0);
    });
  });

  // ============================================
  // toggleItem
  // ============================================
  describe('toggleItem', () => {
    it('should select an item when toggled', () => {
      bulkActions.toggleItem('item-1');

      expect(bulkActions.selectedIds.value.has('item-1')).toBe(true);
      expect(bulkActions.selectedCount.value).toBe(1);
      expect(bulkActions.hasSelection.value).toBe(true);
    });

    it('should deselect an item when toggled again', () => {
      bulkActions.toggleItem('item-1');
      bulkActions.toggleItem('item-1');

      expect(bulkActions.selectedIds.value.has('item-1')).toBe(false);
      expect(bulkActions.selectedCount.value).toBe(0);
    });

    it('should allow selecting multiple items', () => {
      bulkActions.toggleItem('item-1');
      bulkActions.toggleItem('item-2');

      expect(bulkActions.selectedCount.value).toBe(2);
      expect(bulkActions.isSomeSelected.value).toBe(true);
    });
  });

  // ============================================
  // toggleAll
  // ============================================
  describe('toggleAll', () => {
    it('should select all items when none are selected', () => {
      bulkActions.toggleAll();

      expect(bulkActions.selectedCount.value).toBe(3);
      expect(bulkActions.isAllSelected.value).toBe(true);
      expect(bulkActions.isSomeSelected.value).toBe(false);
    });

    it('should deselect all items when all are selected', () => {
      bulkActions.toggleAll();
      bulkActions.toggleAll();

      expect(bulkActions.selectedCount.value).toBe(0);
      expect(bulkActions.isAllSelected.value).toBe(false);
    });

    it('should select all items when some are selected', () => {
      bulkActions.toggleItem('item-1');
      expect(bulkActions.isSomeSelected.value).toBe(true);

      bulkActions.toggleAll();

      expect(bulkActions.isAllSelected.value).toBe(true);
      expect(bulkActions.selectedCount.value).toBe(3);
    });
  });

  // ============================================
  // clearSelection
  // ============================================
  describe('clearSelection', () => {
    it('should clear all selected items', () => {
      bulkActions.toggleItem('item-1');
      bulkActions.toggleItem('item-2');

      expect(bulkActions.selectedCount.value).toBe(2);

      bulkActions.clearSelection();

      expect(bulkActions.selectedCount.value).toBe(0);
      expect(bulkActions.hasSelection.value).toBe(false);
    });
  });

  // ============================================
  // isSelected
  // ============================================
  describe('isSelected', () => {
    it('should return false for unselected items', () => {
      expect(bulkActions.isSelected('item-1')).toBe(false);
    });

    it('should return true for selected items', () => {
      bulkActions.toggleItem('item-1');

      expect(bulkActions.isSelected('item-1')).toBe(true);
    });
  });

  // ============================================
  // selectedItems computed
  // ============================================
  describe('selectedItems', () => {
    it('should return the selected item objects', () => {
      bulkActions.toggleItem('item-1');
      bulkActions.toggleItem('item-3');

      const selected = bulkActions.selectedItems.value;
      expect(selected).toHaveLength(2);
      expect(selected.map(i => i.id)).toContain('item-1');
      expect(selected.map(i => i.id)).toContain('item-3');
    });
  });

  // ============================================
  // isAllSelected computed
  // ============================================
  describe('isAllSelected', () => {
    it('should be false when list is empty', () => {
      items.value = [];
      const ba = useBulkActions(items);

      expect(ba.isAllSelected.value).toBe(false);
    });

    it('should be true when all items are selected', () => {
      bulkActions.toggleAll();

      expect(bulkActions.isAllSelected.value).toBe(true);
    });
  });

  // ============================================
  // bulkDelete
  // ============================================
  describe('bulkDelete', () => {
    it('should return false when no items are selected', async () => {
      const deleteFn = vi.fn();

      const result = await bulkActions.bulkDelete(deleteFn);

      expect(result).toBe(false);
      expect(deleteFn).not.toHaveBeenCalled();
    });

    it('should call confirm dialog before deleting', async () => {
      mockElMessageBox.confirm.mockResolvedValue('confirm');
      const deleteFn = vi.fn().mockResolvedValue(true);

      bulkActions.toggleItem('item-1');
      await bulkActions.bulkDelete(deleteFn);

      expect(mockElMessageBox.confirm).toHaveBeenCalledWith(
        expect.stringContaining('delete'),
        'Bulk Delete',
        expect.objectContaining({ type: 'warning' })
      );
    });

    it('should call deleteFn for each selected item', async () => {
      mockElMessageBox.confirm.mockResolvedValue('confirm');
      const deleteFn = vi.fn().mockResolvedValue(true);

      bulkActions.toggleItem('item-1');
      bulkActions.toggleItem('item-2');
      await bulkActions.bulkDelete(deleteFn);

      expect(deleteFn).toHaveBeenCalledTimes(2);
    });

    it('should show success notification when all deleted', async () => {
      mockElMessageBox.confirm.mockResolvedValue('confirm');
      const deleteFn = vi.fn().mockResolvedValue(true);

      bulkActions.toggleItem('item-1');
      await bulkActions.bulkDelete(deleteFn, 'leads');

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    });

    it('should show warning notification when some deletions fail', async () => {
      mockElMessageBox.confirm.mockResolvedValue('confirm');
      const deleteFn = vi.fn().mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('Server error'));

      bulkActions.toggleItem('item-1');
      bulkActions.toggleItem('item-2');
      await bulkActions.bulkDelete(deleteFn);

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }));
    });

    it('should clear selection after successful deletion', async () => {
      mockElMessageBox.confirm.mockResolvedValue('confirm');
      const deleteFn = vi.fn().mockResolvedValue(true);

      bulkActions.toggleItem('item-1');
      await bulkActions.bulkDelete(deleteFn);

      expect(bulkActions.selectedCount.value).toBe(0);
    });

    it('should return false when user cancels the confirm dialog', async () => {
      mockElMessageBox.confirm.mockRejectedValue(new Error('Cancelled'));
      const deleteFn = vi.fn();

      bulkActions.toggleItem('item-1');
      const result = await bulkActions.bulkDelete(deleteFn);

      expect(result).toBe(false);
      expect(deleteFn).not.toHaveBeenCalled();
    });

    it('should return true on successful deletion', async () => {
      mockElMessageBox.confirm.mockResolvedValue('confirm');
      const deleteFn = vi.fn().mockResolvedValue(true);

      bulkActions.toggleItem('item-1');
      const result = await bulkActions.bulkDelete(deleteFn);

      expect(result).toBe(true);
    });
  });

  // ============================================
  // bulkUpdate
  // ============================================
  describe('bulkUpdate', () => {
    it('should return false when no items are selected', async () => {
      const updateFn = vi.fn();

      const result = await bulkActions.bulkUpdate(updateFn, { name: 'Updated' });

      expect(result).toBe(false);
      expect(updateFn).not.toHaveBeenCalled();
    });

    it('should call updateFn for each selected item', async () => {
      const updateFn = vi.fn().mockResolvedValue(true);

      bulkActions.toggleItem('item-1');
      bulkActions.toggleItem('item-2');
      await bulkActions.bulkUpdate(updateFn, { name: 'Updated' });

      expect(updateFn).toHaveBeenCalledTimes(2);
    });

    it('should pass update data to each call', async () => {
      const updateFn = vi.fn().mockResolvedValue(true);
      const updateData = { name: 'New Name', status: 'active' };

      bulkActions.toggleItem('item-1');
      await bulkActions.bulkUpdate(updateFn, updateData);

      expect(updateFn).toHaveBeenCalledWith('item-1', updateData);
    });

    it('should show success notification when all updated', async () => {
      const updateFn = vi.fn().mockResolvedValue(true);

      bulkActions.toggleItem('item-1');
      await bulkActions.bulkUpdate(updateFn, { name: 'Updated' }, 'leads');

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    });

    it('should show warning notification when some updates fail', async () => {
      const updateFn = vi.fn().mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('Server error'));

      bulkActions.toggleItem('item-1');
      bulkActions.toggleItem('item-2');
      await bulkActions.bulkUpdate(updateFn, { name: 'Updated' });

      expect(mockElNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }));
    });

    it('should clear selection after update', async () => {
      const updateFn = vi.fn().mockResolvedValue(true);

      bulkActions.toggleItem('item-1');
      await bulkActions.bulkUpdate(updateFn, { name: 'Updated' });

      expect(bulkActions.selectedCount.value).toBe(0);
    });

    it('should return true after update', async () => {
      const updateFn = vi.fn().mockResolvedValue(true);

      bulkActions.toggleItem('item-1');
      const result = await bulkActions.bulkUpdate(updateFn, { name: 'Updated' });

      expect(result).toBe(true);
    });
  });
});
