
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import financeService from '../../src/finance/financeService';
import Expense from '../../src/finance/expenseModel';
import Budget from '../../src/finance/budgetModel';
import ExpenseCategory from '../../src/finance/expenseCategoryModel';

// Mocks
jest.mock('../../src/finance/expenseModel');
jest.mock('../../src/finance/budgetModel');
jest.mock('../../src/finance/expenseCategoryModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

describe('FinanceService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. Categories
    // --------------------------------------------------------------------------
    describe('getCategories', () => {
        it('should return all categories sorted by name', async () => {
            const mockCategories = [{ id: 1, name: 'Travel' }, { id: 2, name: 'Office' }];
            (ExpenseCategory.findAll as jest.Mock<any>).mockResolvedValue(mockCategories);

            const result = await financeService.getCategories();

            expect(result).toEqual(mockCategories);
            expect(ExpenseCategory.findAll).toHaveBeenCalledWith({
                order: [['name', 'ASC']]
            });
        });
    });

    describe('createCategory', () => {
        it('should create a new category', async () => {
            const mockCategory = { id: 1, name: 'Travel', color: '#blue' };
            (ExpenseCategory.create as jest.Mock<any>).mockResolvedValue(mockCategory);

            const result = await financeService.createCategory({ name: 'Travel', color: '#blue' });

            expect(result).toEqual(mockCategory);
            expect(ExpenseCategory.create).toHaveBeenCalledWith({ name: 'Travel', color: '#blue' });
        });
    });

    describe('updateCategory', () => {
        it('should update an existing category', async () => {
            const mockCategory = {
                id: 1,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (ExpenseCategory.findByPk as jest.Mock<any>).mockResolvedValue(mockCategory);

            await financeService.updateCategory(1, { name: 'Updated' });

            expect(mockCategory.update).toHaveBeenCalledWith({ name: 'Updated' });
        });

        it('should throw when category not found', async () => {
            (ExpenseCategory.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(financeService.updateCategory(999, {}))
                .rejects.toThrow('Category not found');
        });
    });

    describe('deleteCategory', () => {
        it('should delete an existing category', async () => {
            const mockCategory = { id: 1, destroy: jest.fn() };
            (ExpenseCategory.findByPk as jest.Mock<any>).mockResolvedValue(mockCategory);

            const result = await financeService.deleteCategory(1);

            expect(mockCategory.destroy).toHaveBeenCalled();
            expect(result).toEqual({ deleted: true });
        });

        it('should throw when category not found', async () => {
            (ExpenseCategory.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(financeService.deleteCategory(999))
                .rejects.toThrow('Category not found');
        });
    });

    // --------------------------------------------------------------------------
    // 2. Expenses
    // --------------------------------------------------------------------------
    describe('getExpenses', () => {
        it('should return paginated expenses with defaults', async () => {
            const mockRows = [{ id: 1, description: 'Lunch', amount: 50 }];
            (Expense.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 1 });

            const result = await financeService.getExpenses({});

            expect(result.docs).toEqual(mockRows);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 20,
                totalItems: 1,
                totalPages: 1,
            });
        });

        it('should filter by categoryId', async () => {
            (Expense.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await financeService.getExpenses({ categoryId: 5 });

            expect(Expense.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ categoryId: 5 })
                })
            );
        });

        it('should filter by status', async () => {
            (Expense.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await financeService.getExpenses({ status: 'PENDING' });

            expect(Expense.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: 'PENDING' })
                })
            );
        });

        it('should filter by date range', async () => {
            (Expense.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await financeService.getExpenses({ startDate: '2026-01-01', endDate: '2026-01-31' });

            expect(Expense.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        date: expect.anything() // Op.between
                    })
                })
            );
        });

        it('should search by description', async () => {
            (Expense.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await financeService.getExpenses({ search: 'office' });

            expect(Expense.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        description: expect.anything() // Op.iLike
                    })
                })
            );
        });
    });

    describe('createExpense', () => {
        it('should create expense with submittedBy', async () => {
            const mockExpense = { id: 1, description: 'Lunch', amount: 50, submittedBy: 1 };
            (Expense.create as jest.Mock<any>).mockResolvedValue(mockExpense);

            const result = await financeService.createExpense({ description: 'Lunch', amount: 50 }, 1);

            expect(Expense.create).toHaveBeenCalledWith(
                expect.objectContaining({ description: 'Lunch', submittedBy: 1 })
            );
        });
    });

    describe('approveExpense', () => {
        it('should set status to APPROVED', async () => {
            const mockExpense = {
                id: 1,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Expense.findByPk as jest.Mock<any>).mockResolvedValue(mockExpense);

            await financeService.approveExpense(1);

            expect(mockExpense.update).toHaveBeenCalledWith({ status: 'APPROVED' });
        });

        it('should throw when expense not found', async () => {
            (Expense.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(financeService.approveExpense(999))
                .rejects.toThrow('Expense not found');
        });
    });

    describe('rejectExpense', () => {
        it('should set status to REJECTED', async () => {
            const mockExpense = {
                id: 1,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Expense.findByPk as jest.Mock<any>).mockResolvedValue(mockExpense);

            await financeService.rejectExpense(1);

            expect(mockExpense.update).toHaveBeenCalledWith({ status: 'REJECTED' });
        });
    });

    // --------------------------------------------------------------------------
    // 3. Expense Summary
    // --------------------------------------------------------------------------
    describe('getExpenseSummary', () => {
        it('should return aggregated totals', async () => {
            (Expense.sum as jest.Mock<any>)
                .mockResolvedValueOnce(10000) // total
                .mockResolvedValueOnce(7000)  // approved
                .mockResolvedValueOnce(3000); // pending

            const result = await financeService.getExpenseSummary();

            expect(result).toEqual({ total: 10000, approved: 7000, pending: 3000 });
        });

        it('should handle null sums (no data)', async () => {
            (Expense.sum as jest.Mock<any>)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);

            const result = await financeService.getExpenseSummary();

            expect(result).toEqual({ total: 0, approved: 0, pending: 0 });
        });
    });

    // --------------------------------------------------------------------------
    // 4. Budgets
    // --------------------------------------------------------------------------
    describe('getBudgets', () => {
        it('should return paginated budgets', async () => {
            const mockRows = [{ id: 1, name: 'Q1 Budget' }];
            (Budget.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 1 });

            const result = await financeService.getBudgets({});

            expect(result.docs).toEqual(mockRows);
            expect(result.pagination.totalItems).toBe(1);
        });

        it('should search budgets by name', async () => {
            (Budget.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await financeService.getBudgets({ search: 'Q1' });

            expect(Budget.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        name: expect.anything()
                    })
                })
            );
        });
    });

    describe('createBudget', () => {
        it('should create budget', async () => {
            const mockBudget = { id: 1, name: 'Q1 Budget', amount: 50000 };
            (Budget.create as jest.Mock<any>).mockResolvedValue(mockBudget);

            const result = await financeService.createBudget({ name: 'Q1 Budget', amount: 50000 });
            expect(result).toEqual(mockBudget);
        });
    });

    describe('deleteBudget', () => {
        it('should delete existing budget', async () => {
            const mockBudget = { id: 1, destroy: jest.fn() };
            (Budget.findByPk as jest.Mock<any>).mockResolvedValue(mockBudget);

            const result = await financeService.deleteBudget(1);

            expect(mockBudget.destroy).toHaveBeenCalled();
            expect(result).toEqual({ deleted: true });
        });

        it('should throw when budget not found', async () => {
            (Budget.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(financeService.deleteBudget(999))
                .rejects.toThrow('Budget not found');
        });
    });
});
