import express from 'express';
import financeController from './financeController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { FinancePermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Finance
 *   description: Finance management — expenses, budgets, expense categories
 */

const router = express.Router();

router.get('/', authenticateUser, HasPermission([FinancePermissionsEnum.VIEW_CATEGORIES]), financeController.getCategories);

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/finance/categories:
 *   get:
 *     summary: List expense categories
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expense categories
 *       500:
 *         description: Server error
 */
router.get('/categories', authenticateUser, HasPermission([FinancePermissionsEnum.VIEW_CATEGORIES]), financeController.getCategories);

/**
 * @swagger
 * /api/finance/categories:
 *   post:
 *     summary: Create expense category
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *               color:
 *                 type: string
 *                 maxLength: 7
 *                 description: Hex color code (e.g. #FF5733)
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Duplicate name or validation error
 *       500:
 *         description: Server error
 */
router.post('/categories', authenticateUser, HasPermission([FinancePermissionsEnum.MANAGE_CATEGORIES]), financeController.createCategory);

/**
 * @swagger
 * /api/finance/categories/{id}:
 *   put:
 *     summary: Update expense category
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/categories/:id', authenticateUser, HasPermission([FinancePermissionsEnum.MANAGE_CATEGORIES]), financeController.updateCategory);

/**
 * @swagger
 * /api/finance/categories/{id}:
 *   delete:
 *     summary: Delete expense category
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/categories/:id', authenticateUser, HasPermission([FinancePermissionsEnum.MANAGE_CATEGORIES]), financeController.deleteCategory);

// ─── Expenses ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/finance/expenses:
 *   get:
 *     summary: List expenses
 *     description: Returns paginated expenses with optional filters by status, category, date range
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: searchKey
 *         schema:
 *           type: string
 *         description: Search in description
 *       - in: query
 *         name: submittedBy
 *         schema:
 *           type: integer
 *         description: Filter by submitter user ID
 *     responses:
 *       200:
 *         description: Paginated expense list with category info
 *       500:
 *         description: Server error
 */
router.get('/expenses', authenticateUser, HasPermission([FinancePermissionsEnum.VIEW_EXPENSES]), financeController.getExpenses);

/**
 * @swagger
 * /api/finance/expenses/summary:
 *   get:
 *     summary: Get expense summary
 *     description: Returns total, approved, and pending expense amounts
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense summary with total, approved, and pending amounts
 *       500:
 *         description: Server error
 */
router.get('/expenses/summary', authenticateUser, HasPermission([FinancePermissionsEnum.VIEW_EXPENSES]), financeController.getExpenseSummary);

/**
 * @swagger
 * /api/finance/expenses/{id}:
 *   get:
 *     summary: Get expense by ID
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Expense details with category
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/expenses/:id', authenticateUser, HasPermission([FinancePermissionsEnum.VIEW_EXPENSES]), financeController.getExpenseById);

/**
 * @swagger
 * /api/finance/expenses:
 *   post:
 *     summary: Create an expense
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - amount
 *               - date
 *             properties:
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               categoryId:
 *                 type: integer
 *               vendor:
 *                 type: string
 *                 maxLength: 100
 *               receiptNumber:
 *                 type: string
 *                 maxLength: 100
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED]
 *                 default: PENDING
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Expense created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/expenses', authenticateUser, HasPermission([FinancePermissionsEnum.CREATE_EXPENSES]), financeController.createExpense);

/**
 * @swagger
 * /api/finance/expenses/{id}:
 *   put:
 *     summary: Update an expense
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               categoryId:
 *                 type: integer
 *               vendor:
 *                 type: string
 *               receiptNumber:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Expense updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/expenses/:id', authenticateUser, HasPermission([FinancePermissionsEnum.EDIT_EXPENSES]), financeController.updateExpense);

/**
 * @swagger
 * /api/finance/expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Expense deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/expenses/:id', authenticateUser, HasPermission([FinancePermissionsEnum.DELETE_EXPENSES]), financeController.deleteExpense);

/**
 * @swagger
 * /api/finance/expenses/{id}/approve:
 *   patch:
 *     summary: Approve an expense
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Expense approved
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/expenses/:id/approve', authenticateUser, HasPermission([FinancePermissionsEnum.APPROVE_EXPENSES]), financeController.approveExpense);

/**
 * @swagger
 * /api/finance/expenses/{id}/reject:
 *   patch:
 *     summary: Reject an expense
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Expense rejected
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch('/expenses/:id/reject', authenticateUser, HasPermission([FinancePermissionsEnum.APPROVE_EXPENSES]), financeController.rejectExpense);

// ─── Budgets ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/finance/budgets:
 *   get:
 *     summary: List budgets
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by budget name
 *     responses:
 *       200:
 *         description: Paginated budget list
 *       500:
 *         description: Server error
 */
router.get('/budgets', authenticateUser, HasPermission([FinancePermissionsEnum.VIEW_BUDGETS]), financeController.getBudgets);

/**
 * @swagger
 * /api/finance/budgets/{id}:
 *   get:
 *     summary: Get budget by ID
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Budget details with category info
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/budgets/:id', authenticateUser, HasPermission([FinancePermissionsEnum.VIEW_BUDGETS]), financeController.getBudgetById);

/**
 * @swagger
 * /api/finance/budgets:
 *   post:
 *     summary: Create a budget
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amount
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *               amount:
 *                 type: number
 *               spent:
 *                 type: number
 *                 default: 0
 *               categoryId:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Budget created
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/budgets', authenticateUser, HasPermission([FinancePermissionsEnum.CREATE_BUDGETS]), financeController.createBudget);

/**
 * @swagger
 * /api/finance/budgets/{id}:
 *   put:
 *     summary: Update a budget
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               spent:
 *                 type: number
 *               categoryId:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Budget updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/budgets/:id', authenticateUser, HasPermission([FinancePermissionsEnum.EDIT_BUDGETS]), financeController.updateBudget);

/**
 * @swagger
 * /api/finance/budgets/{id}:
 *   delete:
 *     summary: Delete a budget
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Budget deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/budgets/:id', authenticateUser, HasPermission([FinancePermissionsEnum.DELETE_BUDGETS]), financeController.deleteBudget);

export default router;
