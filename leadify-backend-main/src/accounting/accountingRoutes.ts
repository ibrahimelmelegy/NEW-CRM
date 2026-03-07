import express from 'express';
import accountingController from './accountingController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { AccountingPermissionsEnum } from '../role/roleEnum';

/**
 * @swagger
 * tags:
 *   name: Accounting
 *   description: Double-entry accounting — chart of accounts, journal entries, financial reports
 */

const router = express.Router();

// ─── Chart of Accounts ────────────────────────────────────────────

/**
 * @swagger
 * /api/accounting/chart-of-accounts:
 *   get:
 *     summary: List chart of accounts
 *     description: Returns all accounts in hierarchical structure
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hierarchical chart of accounts
 *       500:
 *         description: Server error
 */
router.get('/', authenticateUser, HasPermission([AccountingPermissionsEnum.VIEW_CHART_OF_ACCOUNTS]), accountingController.getChartOfAccounts);
router.get(
  '/chart-of-accounts',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_CHART_OF_ACCOUNTS]),
  accountingController.getChartOfAccounts
);

/**
 * @swagger
 * /api/accounting/chart-of-accounts:
 *   post:
 *     summary: Create an account
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - type
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique account code
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE]
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Parent account for hierarchical nesting
 *               isGroup:
 *                 type: boolean
 *                 default: false
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created
 *       400:
 *         description: Duplicate code or validation error
 *       500:
 *         description: Server error
 */
router.post(
  '/chart-of-accounts',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.MANAGE_CHART_OF_ACCOUNTS]),
  accountingController.createAccount
);

/**
 * @swagger
 * /api/accounting/chart-of-accounts/{id}:
 *   put:
 *     summary: Update an account
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE]
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               isGroup:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account updated
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put(
  '/chart-of-accounts/:id',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.MANAGE_CHART_OF_ACCOUNTS]),
  accountingController.updateAccount
);

/**
 * @swagger
 * /api/accounting/chart-of-accounts/{id}:
 *   delete:
 *     summary: Delete an account
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Account deleted
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/chart-of-accounts/:id',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.MANAGE_CHART_OF_ACCOUNTS]),
  accountingController.deleteAccount
);

/**
 * @swagger
 * /api/accounting/chart-of-accounts/seed:
 *   post:
 *     summary: Seed default chart of accounts
 *     description: Creates a standard set of default accounts (assets, liabilities, equity, revenue, expenses)
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Default accounts created
 *       500:
 *         description: Server error
 */
router.post(
  '/chart-of-accounts/seed',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.MANAGE_CHART_OF_ACCOUNTS]),
  accountingController.seedDefaults
);

// ─── Journal Entries ──────────────────────────────────────────────

/**
 * @swagger
 * /api/accounting/journal-entries:
 *   post:
 *     summary: Create a journal entry
 *     description: Create a double-entry journal entry with debit/credit lines. Total debits must equal total credits.
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entryNumber
 *               - date
 *               - lines
 *             properties:
 *               entryNumber:
 *                 type: string
 *                 description: Unique entry number
 *               date:
 *                 type: string
 *                 format: date
 *               reference:
 *                 type: string
 *               description:
 *                 type: string
 *               sourceType:
 *                 type: string
 *                 enum: [MANUAL, INVOICE, PAYMENT, EXPENSE, PAYROLL]
 *                 default: MANUAL
 *               sourceId:
 *                 type: string
 *                 format: uuid
 *               lines:
 *                 type: array
 *                 minItems: 2
 *                 items:
 *                   type: object
 *                   required:
 *                     - accountId
 *                   properties:
 *                     accountId:
 *                       type: string
 *                       format: uuid
 *                     debit:
 *                       type: number
 *                       default: 0
 *                     credit:
 *                       type: number
 *                       default: 0
 *                     description:
 *                       type: string
 *     responses:
 *       201:
 *         description: Journal entry created in DRAFT status
 *       400:
 *         description: Debits and credits do not balance
 *       500:
 *         description: Server error
 */
router.post(
  '/journal-entries',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.CREATE_JOURNAL_ENTRIES]),
  accountingController.createJournalEntry
);

/**
 * @swagger
 * /api/accounting/journal-entries:
 *   get:
 *     summary: List journal entries
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, POSTED, VOIDED]
 *       - in: query
 *         name: sourceType
 *         schema:
 *           type: string
 *           enum: [MANUAL, INVOICE, PAYMENT, EXPENSE, PAYROLL]
 *     responses:
 *       200:
 *         description: Journal entries with line items
 *       500:
 *         description: Server error
 */
router.get(
  '/journal-entries',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_JOURNAL_ENTRIES]),
  accountingController.getJournalEntries
);

/**
 * @swagger
 * /api/accounting/journal-entries/{id}:
 *   get:
 *     summary: Get journal entry by ID
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Journal entry with line items and account details
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get(
  '/journal-entries/:id',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_JOURNAL_ENTRIES]),
  accountingController.getJournalEntryById
);

/**
 * @swagger
 * /api/accounting/journal-entries/{id}/post:
 *   patch:
 *     summary: Post a journal entry
 *     description: Changes entry status from DRAFT to POSTED, making it permanent
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Entry posted
 *       400:
 *         description: Entry is not in DRAFT status
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/journal-entries/:id/post',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.POST_JOURNAL_ENTRIES]),
  accountingController.postEntry
);

/**
 * @swagger
 * /api/accounting/journal-entries/{id}/void:
 *   patch:
 *     summary: Void a journal entry
 *     description: Marks entry as VOIDED, reversing its effect on account balances
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Entry voided
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/journal-entries/:id/void',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.POST_JOURNAL_ENTRIES]),
  accountingController.voidEntry
);

// ─── Reports ────────────────────────────────────────────────────

/**
 * @swagger
 * /api/accounting/reports/trial-balance:
 *   get:
 *     summary: Get trial balance
 *     description: Returns trial balance report showing all accounts with their debit/credit balances as of a given date
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: As-of date for the report
 *     responses:
 *       200:
 *         description: Trial balance report
 *       500:
 *         description: Server error
 */
router.get(
  '/reports/trial-balance',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_FINANCIAL_REPORTS]),
  accountingController.getTrialBalance
);

/**
 * @swagger
 * /api/accounting/reports/profit-loss:
 *   get:
 *     summary: Get profit & loss statement
 *     description: Returns income statement showing revenue, expenses, and net income for a date range
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Period start date
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Period end date
 *     responses:
 *       200:
 *         description: Profit & loss statement
 *       500:
 *         description: Server error
 */
router.get(
  '/reports/profit-loss',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_FINANCIAL_REPORTS]),
  accountingController.getProfitAndLoss
);

/**
 * @swagger
 * /api/accounting/reports/balance-sheet:
 *   get:
 *     summary: Get balance sheet
 *     description: Returns balance sheet showing assets, liabilities, and equity as of a given date
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: As-of date for the report
 *     responses:
 *       200:
 *         description: Balance sheet report
 *       500:
 *         description: Server error
 */
router.get(
  '/reports/balance-sheet',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_FINANCIAL_REPORTS]),
  accountingController.getBalanceSheet
);

// ─── General Ledger ─────────────────────────────────────────────

/**
 * @swagger
 * /api/accounting/general-ledger/{accountId}:
 *   get:
 *     summary: Get general ledger for an account
 *     description: Returns all journal entry lines for a specific account with running balances
 *     tags: [Accounting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Period start date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Period end date
 *     responses:
 *       200:
 *         description: General ledger entries with running balance
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */
router.get(
  '/general-ledger/:accountId',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_FINANCIAL_REPORTS]),
  accountingController.getGeneralLedger
);

export default router;
