export interface ExpenseCategory {
  id: number;
  name: string;
  color?: string;
  description?: string;
}

export interface ExpenseItem {
  id: number;
  description: string;
  amount: number;
  date: string;
  categoryId?: number;
  category?: ExpenseCategory;
  vendor?: string;
  receiptNumber?: string;
  status: string;
  notes?: string;
  submittedBy?: number;
  submitter?: { id: number; name: string; profilePicture?: string };
  createdAt: string;
}

export interface BudgetItem {
  id: number;
  name: string;
  amount: number;
  spent: number;
  categoryId?: number;
  category?: ExpenseCategory;
  startDate: string;
  endDate: string;
  notes?: string;
}

// Expense statuses for filters
export const expenseStatuses = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' }
];

export async function fetchExpenseCategories(): Promise<ExpenseCategory[]> {
  const { body, success } = await useApiFetch('finance/categories');
  return success && body ? (body as ExpenseCategory[]) : [];
}

export async function createExpenseCategory(data: Partial<ExpenseCategory>) {
  return useApiFetch('finance/categories', 'POST', data);
}

export async function updateExpenseCategory(id: number, data: Partial<ExpenseCategory>) {
  return useApiFetch(`finance/categories/${id}`, 'PUT', data);
}

export async function deleteExpenseCategory(id: number) {
  return useApiFetch(`finance/categories/${id}`, 'DELETE');
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export async function fetchExpenses(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`finance/expenses${query}`);
  if (success && body) return body as { docs: ExpenseItem[]; pagination: PaginationMeta };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchExpenseById(id: number | string): Promise<ExpenseItem | null> {
  const { body, success } = await useApiFetch(`finance/expenses/${id}`);
  return success && body ? (body as ExpenseItem) : null;
}

export async function fetchExpenseSummary() {
  const { body, success } = await useApiFetch('finance/expenses/summary');
  return success && body ? (body as { total: number; approved: number; pending: number }) : { total: 0, approved: 0, pending: 0 };
}

export async function createExpense(data: Record<string, unknown>) {
  return useApiFetch('finance/expenses', 'POST', data);
}

export async function updateExpense(id: number, data: Record<string, unknown>) {
  return useApiFetch(`finance/expenses/${id}`, 'PUT', data);
}

export async function deleteExpense(id: number) {
  return useApiFetch(`finance/expenses/${id}`, 'DELETE');
}

export async function approveExpense(id: number) {
  return useApiFetch(`finance/expenses/${id}/approve`, 'PATCH');
}

export async function rejectExpense(id: number) {
  return useApiFetch(`finance/expenses/${id}/reject`, 'PATCH');
}

export async function fetchBudgets(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`finance/budgets${query}`);
  if (success && body) return body as { docs: BudgetItem[]; pagination: PaginationMeta };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchBudgetById(id: number | string): Promise<BudgetItem | null> {
  const { body, success } = await useApiFetch(`finance/budgets/${id}`);
  return success && body ? (body as BudgetItem) : null;
}

export async function createBudget(data: Record<string, unknown>) {
  return useApiFetch('finance/budgets', 'POST', data);
}

export async function updateBudget(id: number, data: Record<string, unknown>) {
  return useApiFetch(`finance/budgets/${id}`, 'PUT', data);
}

export async function deleteBudget(id: number) {
  return useApiFetch(`finance/budgets/${id}`, 'DELETE');
}
