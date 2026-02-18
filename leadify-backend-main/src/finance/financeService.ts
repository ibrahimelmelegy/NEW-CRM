import { Op } from 'sequelize';
import Expense from './expenseModel';
import Budget from './budgetModel';
import ExpenseCategory from './expenseCategoryModel';
import User from '../user/userModel';

class FinanceService {
  // Categories
  async getCategories() {
    return ExpenseCategory.findAll({ order: [['name', 'ASC']] });
  }

  async createCategory(data: any) {
    return ExpenseCategory.create(data);
  }

  async updateCategory(id: number, data: any) {
    const cat = await ExpenseCategory.findByPk(id);
    if (!cat) throw new Error('Category not found');
    return cat.update(data);
  }

  async deleteCategory(id: number) {
    const cat = await ExpenseCategory.findByPk(id);
    if (!cat) throw new Error('Category not found');
    await cat.destroy();
    return { deleted: true };
  }

  // Expenses
  async getExpenses(query: any) {
    const { page = 1, limit = 20, categoryId, status, startDate, endDate, search, searchKey, sortBy = 'date', sort = 'DESC', submittedBy } = query;
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (submittedBy) where.submittedBy = submittedBy;
    if (startDate && endDate) where.date = { [Op.between]: [startDate, endDate] };
    const searchTerm = search || searchKey;
    if (searchTerm) where.description = { [Op.iLike]: `%${searchTerm}%` };

    const offset = (Number(page) - 1) * Number(limit);
    const { rows, count } = await Expense.findAndCountAll({
      where,
      include: [
        { model: ExpenseCategory, attributes: ['id', 'name', 'color'] },
        { model: User, as: 'submitter', attributes: ['id', 'name', 'profilePicture'] }
      ],
      order: [[sortBy, sort]],
      limit: Number(limit),
      offset
    });

    return {
      docs: rows,
      pagination: { page: Number(page), limit: Number(limit), totalItems: count, totalPages: Math.ceil(count / Number(limit)) }
    };
  }

  async getExpenseById(id: number) {
    const expense = await Expense.findByPk(id, {
      include: [
        { model: ExpenseCategory, attributes: ['id', 'name', 'color'] },
        { model: User, as: 'submitter', attributes: ['id', 'name', 'profilePicture'] }
      ]
    });
    if (!expense) throw new Error('Expense not found');
    return expense;
  }

  async createExpense(data: any, submittedBy?: number) {
    return Expense.create({ ...data, submittedBy });
  }

  async updateExpense(id: number, data: any) {
    const expense = await Expense.findByPk(id);
    if (!expense) throw new Error('Expense not found');
    return expense.update(data);
  }

  async deleteExpense(id: number) {
    const expense = await Expense.findByPk(id);
    if (!expense) throw new Error('Expense not found');
    await expense.destroy();
    return { deleted: true };
  }

  async approveExpense(id: number) {
    const expense = await Expense.findByPk(id);
    if (!expense) throw new Error('Expense not found');
    return expense.update({ status: 'APPROVED' });
  }

  async rejectExpense(id: number) {
    const expense = await Expense.findByPk(id);
    if (!expense) throw new Error('Expense not found');
    return expense.update({ status: 'REJECTED' });
  }

  async getExpenseSummary() {
    const [total, approved, pending] = await Promise.all([
      Expense.sum('amount'),
      Expense.sum('amount', { where: { status: 'APPROVED' } }),
      Expense.sum('amount', { where: { status: 'PENDING' } })
    ]);
    return { total: total || 0, approved: approved || 0, pending: pending || 0 };
  }

  // Budgets
  async getBudgets(query: any) {
    const { page = 1, limit = 20, search, sortBy = 'startDate', sort = 'DESC' } = query;
    const where: any = {};
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const offset = (Number(page) - 1) * Number(limit);
    const { rows, count } = await Budget.findAndCountAll({
      where,
      include: [{ model: ExpenseCategory, attributes: ['id', 'name', 'color'] }],
      order: [[sortBy, sort]],
      limit: Number(limit),
      offset
    });

    return {
      docs: rows,
      pagination: { page: Number(page), limit: Number(limit), totalItems: count, totalPages: Math.ceil(count / Number(limit)) }
    };
  }

  async getBudgetById(id: number) {
    const budget = await Budget.findByPk(id, {
      include: [{ model: ExpenseCategory, attributes: ['id', 'name', 'color'] }]
    });
    if (!budget) throw new Error('Budget not found');
    return budget;
  }

  async createBudget(data: any) {
    return Budget.create(data);
  }

  async updateBudget(id: number, data: any) {
    const budget = await Budget.findByPk(id);
    if (!budget) throw new Error('Budget not found');
    return budget.update(data);
  }

  async deleteBudget(id: number) {
    const budget = await Budget.findByPk(id);
    if (!budget) throw new Error('Budget not found');
    await budget.destroy();
    return { deleted: true };
  }
}

export default new FinanceService();
