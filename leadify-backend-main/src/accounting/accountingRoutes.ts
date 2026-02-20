import express from 'express';
import accountingController from './accountingController';
import { authenticateUser, HasPermission } from '../middleware/authMiddleware';
import { AccountingPermissionsEnum } from '../role/roleEnum';

const router = express.Router();

// ─── Chart of Accounts ────────────────────────────────────────────
router.get(
  '/chart-of-accounts',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_CHART_OF_ACCOUNTS]),
  accountingController.getChartOfAccounts
);

router.post(
  '/chart-of-accounts',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.MANAGE_CHART_OF_ACCOUNTS]),
  accountingController.createAccount
);

router.put(
  '/chart-of-accounts/:id',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.MANAGE_CHART_OF_ACCOUNTS]),
  accountingController.updateAccount
);

router.delete(
  '/chart-of-accounts/:id',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.MANAGE_CHART_OF_ACCOUNTS]),
  accountingController.deleteAccount
);

router.post(
  '/chart-of-accounts/seed',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.MANAGE_CHART_OF_ACCOUNTS]),
  accountingController.seedDefaults
);

// ─── Journal Entries ──────────────────────────────────────────────
router.post(
  '/journal-entries',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.CREATE_JOURNAL_ENTRIES]),
  accountingController.createJournalEntry
);

router.get(
  '/journal-entries',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_JOURNAL_ENTRIES]),
  accountingController.getJournalEntries
);

router.get(
  '/journal-entries/:id',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_JOURNAL_ENTRIES]),
  accountingController.getJournalEntryById
);

router.patch(
  '/journal-entries/:id/post',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.POST_JOURNAL_ENTRIES]),
  accountingController.postEntry
);

router.patch(
  '/journal-entries/:id/void',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.POST_JOURNAL_ENTRIES]),
  accountingController.voidEntry
);

// ─── Reports ────────────────────────────────────────────────────
router.get(
  '/reports/trial-balance',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_FINANCIAL_REPORTS]),
  accountingController.getTrialBalance
);

router.get(
  '/reports/profit-loss',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_FINANCIAL_REPORTS]),
  accountingController.getProfitAndLoss
);

router.get(
  '/reports/balance-sheet',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_FINANCIAL_REPORTS]),
  accountingController.getBalanceSheet
);

// ─── General Ledger ─────────────────────────────────────────────
router.get(
  '/general-ledger/:accountId',
  authenticateUser,
  HasPermission([AccountingPermissionsEnum.VIEW_FINANCIAL_REPORTS]),
  accountingController.getGeneralLedger
);

export default router;
