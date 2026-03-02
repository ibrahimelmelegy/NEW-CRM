/**
 * useFinance - Unit Tests
 * =========================
 * Tests for composables/useFinance.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

import {
  expenseStatuses,
  fetchExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  fetchExpenses,
  fetchExpenseById,
  fetchExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  fetchBudgets,
  fetchBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
} from '~/composables/useFinance';

describe('useFinance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Constants
  // ============================================
  describe('expenseStatuses', () => {
    it('should have 3 status options', () => {
      expect(expenseStatuses).toHaveLength(3);
    });

    it('should include PENDING, APPROVED, REJECTED', () => {
      const values = expenseStatuses.map(s => s.value);
      expect(values).toContain('PENDING');
      expect(values).toContain('APPROVED');
      expect(values).toContain('REJECTED');
    });
  });

  // ============================================
  // Expense Categories
  // ============================================
  describe('fetchExpenseCategories', () => {
    it('should return categories on success', async () => {
      const categories = [{ id: 1, name: 'Travel' }];
      mockApiFetch.mockResolvedValue({ body: categories, success: true });

      const result = await fetchExpenseCategories();

      expect(mockApiFetch).toHaveBeenCalledWith('finance/categories');
      expect(result).toEqual(categories);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchExpenseCategories();

      expect(result).toEqual([]);
    });
  });

  describe('createExpenseCategory', () => {
    it('should POST new category', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createExpenseCategory({ name: 'Office' });

      expect(mockApiFetch).toHaveBeenCalledWith('finance/categories', 'POST', { name: 'Office' });
    });
  });

  describe('updateExpenseCategory', () => {
    it('should PUT updated category', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateExpenseCategory(1, { name: 'Updated' });

      expect(mockApiFetch).toHaveBeenCalledWith('finance/categories/1', 'PUT', { name: 'Updated' });
    });
  });

  describe('deleteExpenseCategory', () => {
    it('should DELETE category by id', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteExpenseCategory(1);

      expect(mockApiFetch).toHaveBeenCalledWith('finance/categories/1', 'DELETE');
    });
  });

  // ============================================
  // Expenses
  // ============================================
  describe('fetchExpenses', () => {
    it('should fetch expenses without params', async () => {
      const data = { docs: [{ id: 1, description: 'Lunch' }], pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 } };
      mockApiFetch.mockResolvedValue({ body: data, success: true });

      const result = await fetchExpenses();

      expect(mockApiFetch).toHaveBeenCalledWith('finance/expenses');
      expect(result.docs).toHaveLength(1);
    });

    it('should fetch expenses with query params', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchExpenses({ status: 'PENDING' });

      expect(mockApiFetch).toHaveBeenCalledWith('finance/expenses?status=PENDING');
    });

    it('should return default empty result on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchExpenses();

      expect(result.docs).toEqual([]);
    });
  });

  describe('fetchExpenseById', () => {
    it('should return expense on success', async () => {
      const expense = { id: 1, description: 'Taxi' };
      mockApiFetch.mockResolvedValue({ body: expense, success: true });

      const result = await fetchExpenseById(1);

      expect(result).toEqual(expense);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchExpenseById(999);

      expect(result).toBeNull();
    });
  });

  describe('fetchExpenseSummary', () => {
    it('should return summary on success', async () => {
      const summary = { total: 5000, approved: 3000, pending: 2000 };
      mockApiFetch.mockResolvedValue({ body: summary, success: true });

      const result = await fetchExpenseSummary();

      expect(result).toEqual(summary);
    });

    it('should return default zeroes on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchExpenseSummary();

      expect(result).toEqual({ total: 0, approved: 0, pending: 0 });
    });
  });

  describe('createExpense', () => {
    it('should POST expense data', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createExpense({ description: 'New expense', amount: 100 });

      expect(mockApiFetch).toHaveBeenCalledWith('finance/expenses', 'POST', { description: 'New expense', amount: 100 });
    });
  });

  describe('approveExpense', () => {
    it('should PATCH approve endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await approveExpense(1);

      expect(mockApiFetch).toHaveBeenCalledWith('finance/expenses/1/approve', 'PATCH');
    });
  });

  describe('rejectExpense', () => {
    it('should PATCH reject endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await rejectExpense(1);

      expect(mockApiFetch).toHaveBeenCalledWith('finance/expenses/1/reject', 'PATCH');
    });
  });

  // ============================================
  // Budgets
  // ============================================
  describe('fetchBudgets', () => {
    it('should fetch budgets', async () => {
      const data = { docs: [{ id: 1, name: 'Q1 Budget' }], pagination: {} };
      mockApiFetch.mockResolvedValue({ body: data, success: true });

      const result = await fetchBudgets();

      expect(mockApiFetch).toHaveBeenCalledWith('finance/budgets');
      expect(result.docs).toHaveLength(1);
    });

    it('should return empty result on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchBudgets();

      expect(result.docs).toEqual([]);
    });
  });

  describe('fetchBudgetById', () => {
    it('should return budget on success', async () => {
      const budget = { id: 1, name: 'Q1' };
      mockApiFetch.mockResolvedValue({ body: budget, success: true });

      const result = await fetchBudgetById(1);

      expect(result).toEqual(budget);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchBudgetById(999);

      expect(result).toBeNull();
    });
  });

  describe('createBudget', () => {
    it('should POST budget data', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createBudget({ name: 'Q2 Budget', amount: 10000 });

      expect(mockApiFetch).toHaveBeenCalledWith('finance/budgets', 'POST', { name: 'Q2 Budget', amount: 10000 });
    });
  });

  describe('deleteBudget', () => {
    it('should DELETE budget by id', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteBudget(1);

      expect(mockApiFetch).toHaveBeenCalledWith('finance/budgets/1', 'DELETE');
    });
  });
});
