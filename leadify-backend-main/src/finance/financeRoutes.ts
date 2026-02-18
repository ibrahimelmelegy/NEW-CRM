import express from 'express';
import financeController from './financeController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = express.Router();

// Categories
router.get('/categories', authenticateUser, financeController.getCategories);
router.post('/categories', authenticateUser, financeController.createCategory);
router.put('/categories/:id', authenticateUser, financeController.updateCategory);
router.delete('/categories/:id', authenticateUser, financeController.deleteCategory);

// Expenses
router.get('/expenses', authenticateUser, financeController.getExpenses);
router.get('/expenses/summary', authenticateUser, financeController.getExpenseSummary);
router.get('/expenses/:id', authenticateUser, financeController.getExpenseById);
router.post('/expenses', authenticateUser, financeController.createExpense);
router.put('/expenses/:id', authenticateUser, financeController.updateExpense);
router.delete('/expenses/:id', authenticateUser, financeController.deleteExpense);
router.patch('/expenses/:id/approve', authenticateUser, financeController.approveExpense);
router.patch('/expenses/:id/reject', authenticateUser, financeController.rejectExpense);

// Budgets
router.get('/budgets', authenticateUser, financeController.getBudgets);
router.get('/budgets/:id', authenticateUser, financeController.getBudgetById);
router.post('/budgets', authenticateUser, financeController.createBudget);
router.put('/budgets/:id', authenticateUser, financeController.updateBudget);
router.delete('/budgets/:id', authenticateUser, financeController.deleteBudget);

export default router;
