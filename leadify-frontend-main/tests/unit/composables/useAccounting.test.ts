/**
 * useAccounting - Unit Tests
 * ============================
 * Tests for composables/useAccounting.ts
 *
 * The module provides:
 * - fetchChartOfAccounts, createAccount, updateAccount, deleteAccount
 * - fetchJournalEntries, fetchJournalEntryById, createJournalEntry, postJournalEntry, voidJournalEntry
 * - fetchTrialBalance, fetchProfitAndLoss, fetchBalanceSheet, fetchGeneralLedger
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  fetchChartOfAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  seedDefaultAccounts,
  fetchJournalEntries,
  fetchJournalEntryById,
  createJournalEntry,
  postJournalEntry,
  voidJournalEntry,
  fetchTrialBalance,
  fetchProfitAndLoss,
  fetchBalanceSheet,
  fetchGeneralLedger,
  AccountType,
  JournalEntryStatus,
  JournalEntrySourceType,
  accountTypeColors,
  accountTypeTagType,
  sourceTypeOptions,
  journalStatusOptions
} from '@/composables/useAccounting';

const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);

describe('useAccounting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchChartOfAccounts
  // ============================================
  describe('fetchChartOfAccounts', () => {
    it('should return array of accounts on success', async () => {
      const mockAccounts = [
        { id: '1', code: '1000', name: 'Cash', type: AccountType.ASSET, isGroup: false, balance: 5000 },
        { id: '2', code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY, isGroup: false, balance: 1000 }
      ];
      mockUseApiFetch.mockResolvedValue({ body: mockAccounts, success: true });

      const result = await fetchChartOfAccounts();

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/chart-of-accounts');
      expect(result).toEqual(mockAccounts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchChartOfAccounts();

      expect(result).toEqual([]);
    });

    it('should return empty array when body is null but success is true', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: true });

      const result = await fetchChartOfAccounts();

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // createAccount
  // ============================================
  describe('createAccount', () => {
    it('should call the correct API endpoint with POST method', async () => {
      const data = { code: '1100', name: 'Bank', type: AccountType.ASSET, isGroup: false, balance: 0 };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: '3', ...data } });

      await createAccount(data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/chart-of-accounts', 'POST', data);
    });

    it('should return the API response', async () => {
      const response = { success: true, body: { id: '3', code: '1100', name: 'Bank' } };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await createAccount({ code: '1100', name: 'Bank' });

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // updateAccount
  // ============================================
  describe('updateAccount', () => {
    it('should call API with PUT method and correct ID', async () => {
      const data = { name: 'Updated Account Name' };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: '1', ...data } });

      await updateAccount('1', data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/chart-of-accounts/1', 'PUT', data);
    });
  });

  // ============================================
  // deleteAccount
  // ============================================
  describe('deleteAccount', () => {
    it('should call API with DELETE method and correct ID', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await deleteAccount('1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/chart-of-accounts/1', 'DELETE');
    });
  });

  // ============================================
  // seedDefaultAccounts
  // ============================================
  describe('seedDefaultAccounts', () => {
    it('should call the seed endpoint with POST', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await seedDefaultAccounts();

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/chart-of-accounts/seed', 'POST');
    });
  });

  // ============================================
  // fetchJournalEntries
  // ============================================
  describe('fetchJournalEntries', () => {
    it('should fetch journal entries without params', async () => {
      const mockDocs = [
        {
          id: 'je-1',
          entryNumber: 'JE-001',
          date: '2024-01-01',
          status: JournalEntryStatus.POSTED,
          totalDebit: 1000,
          totalCredit: 1000,
          sourceType: JournalEntrySourceType.MANUAL,
          createdAt: '2024-01-01'
        }
      ];
      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockDocs, pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 } },
        success: true
      });

      const result = await fetchJournalEntries();

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/journal-entries');
      expect(result.docs).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
    });

    it('should build correct query string from params', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } }, success: true });

      await fetchJournalEntries({ status: 'POSTED', page: '2' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('status=POSTED');
      expect(calledUrl).toContain('page=2');
    });

    it('should return default empty result on API failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchJournalEntries();

      expect(result.docs).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  // ============================================
  // fetchJournalEntryById
  // ============================================
  describe('fetchJournalEntryById', () => {
    it('should fetch a single journal entry by ID', async () => {
      const mockEntry = {
        id: 'je-1',
        entryNumber: 'JE-001',
        date: '2024-01-01',
        status: JournalEntryStatus.POSTED,
        totalDebit: 1000,
        totalCredit: 1000,
        sourceType: JournalEntrySourceType.MANUAL,
        createdAt: '2024-01-01'
      };
      mockUseApiFetch.mockResolvedValue({ body: mockEntry, success: true });

      const result = await fetchJournalEntryById('je-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/journal-entries/je-1');
      expect(result).toEqual(mockEntry);
    });

    it('should return null when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchJournalEntryById('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // createJournalEntry
  // ============================================
  describe('createJournalEntry', () => {
    it('should call API with POST and journal entry data', async () => {
      const data = {
        date: '2024-01-15',
        description: 'Test entry',
        sourceType: JournalEntrySourceType.MANUAL,
        lines: [
          { accountId: '1', debit: 500, credit: 0 },
          { accountId: '2', debit: 0, credit: 500 }
        ]
      };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 'je-2', ...data } });

      await createJournalEntry(data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/journal-entries', 'POST', data);
    });
  });

  // ============================================
  // postJournalEntry / voidJournalEntry
  // ============================================
  describe('postJournalEntry', () => {
    it('should call PATCH endpoint to post a draft entry', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await postJournalEntry('je-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/journal-entries/je-1/post', 'PATCH');
    });
  });

  describe('voidJournalEntry', () => {
    it('should call PATCH endpoint to void a posted entry', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await voidJournalEntry('je-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/journal-entries/je-1/void', 'PATCH');
    });
  });

  // ============================================
  // fetchTrialBalance
  // ============================================
  describe('fetchTrialBalance', () => {
    it('should fetch trial balance without date', async () => {
      const mockTB = { accounts: [], totalDebits: 10000, totalCredits: 10000, isBalanced: true };
      mockUseApiFetch.mockResolvedValue({ body: mockTB, success: true });

      const result = await fetchTrialBalance();

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/reports/trial-balance');
      expect(result.isBalanced).toBe(true);
    });

    it('should include date in query string when provided', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { accounts: [], totalDebits: 0, totalCredits: 0, isBalanced: true }, success: true });

      await fetchTrialBalance('2024-12-31');

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/reports/trial-balance?date=2024-12-31');
    });

    it('should return default empty result on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchTrialBalance();

      expect(result.accounts).toEqual([]);
      expect(result.isBalanced).toBe(true);
    });
  });

  // ============================================
  // fetchProfitAndLoss
  // ============================================
  describe('fetchProfitAndLoss', () => {
    it('should fetch P&L for given date range', async () => {
      const mockPL = {
        period: { from: '2024-01-01', to: '2024-12-31' },
        revenue: [],
        totalRevenue: 50000,
        expenses: [],
        totalExpenses: 30000,
        netIncome: 20000
      };
      mockUseApiFetch.mockResolvedValue({ body: mockPL, success: true });

      const result = await fetchProfitAndLoss('2024-01-01', '2024-12-31');

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/reports/profit-loss?from=2024-01-01&to=2024-12-31');
      expect(result.netIncome).toBe(20000);
    });

    it('should return default empty result on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchProfitAndLoss('2024-01-01', '2024-12-31');

      expect(result.netIncome).toBe(0);
      expect(result.revenue).toEqual([]);
    });
  });

  // ============================================
  // fetchBalanceSheet
  // ============================================
  describe('fetchBalanceSheet', () => {
    it('should fetch balance sheet for given date', async () => {
      const mockBS = {
        asOfDate: '2024-12-31',
        assets: [],
        totalAssets: 100000,
        liabilities: [],
        totalLiabilities: 40000,
        equity: [],
        netIncome: 20000,
        totalEquity: 60000,
        totalLiabilitiesAndEquity: 100000,
        isBalanced: true
      };
      mockUseApiFetch.mockResolvedValue({ body: mockBS, success: true });

      const result = await fetchBalanceSheet('2024-12-31');

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/reports/balance-sheet?date=2024-12-31');
      expect(result.isBalanced).toBe(true);
      expect(result.totalAssets).toBe(100000);
    });

    it('should return default empty balance sheet on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchBalanceSheet('2024-12-31');

      expect(result.assets).toEqual([]);
      expect(result.isBalanced).toBe(true);
    });
  });

  // ============================================
  // fetchGeneralLedger
  // ============================================
  describe('fetchGeneralLedger', () => {
    it('should fetch general ledger for an account', async () => {
      const mockGL = { account: { id: '1', code: '1000', name: 'Cash', type: 'ASSET' }, entries: [], closingBalance: 5000 };
      mockUseApiFetch.mockResolvedValue({ body: mockGL, success: true });

      const result = await fetchGeneralLedger('1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('accounting/general-ledger/1');
      expect(result.closingBalance).toBe(5000);
    });

    it('should include date range when provided', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { account: { id: '1', code: '1000', name: 'Cash', type: 'ASSET' }, entries: [], closingBalance: 0 },
        success: true
      });

      await fetchGeneralLedger('1', '2024-01-01', '2024-12-31');

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('from=2024-01-01');
      expect(calledUrl).toContain('to=2024-12-31');
    });

    it('should return default empty result on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchGeneralLedger('nonexistent');

      expect(result.entries).toEqual([]);
      expect(result.closingBalance).toBe(0);
    });
  });

  // ============================================
  // Constants and Enums
  // ============================================
  describe('constants and enums', () => {
    it('should have correct AccountType values', () => {
      expect(AccountType.ASSET).toBe('ASSET');
      expect(AccountType.LIABILITY).toBe('LIABILITY');
      expect(AccountType.EQUITY).toBe('EQUITY');
      expect(AccountType.REVENUE).toBe('REVENUE');
      expect(AccountType.EXPENSE).toBe('EXPENSE');
    });

    it('should have correct JournalEntryStatus values', () => {
      expect(JournalEntryStatus.DRAFT).toBe('DRAFT');
      expect(JournalEntryStatus.POSTED).toBe('POSTED');
      expect(JournalEntryStatus.VOIDED).toBe('VOIDED');
    });

    it('should have accountTypeColors for all types', () => {
      expect(accountTypeColors[AccountType.ASSET]).toBeDefined();
      expect(accountTypeColors[AccountType.LIABILITY]).toBeDefined();
      expect(accountTypeColors[AccountType.REVENUE]).toBeDefined();
    });

    it('should have correct sourceTypeOptions labels', () => {
      expect(sourceTypeOptions).toHaveLength(5);
      const labels = sourceTypeOptions.map(o => o.label);
      expect(labels).toContain('Manual');
      expect(labels).toContain('Invoice');
    });

    it('should have correct journalStatusOptions', () => {
      expect(journalStatusOptions).toHaveLength(3);
      const values = journalStatusOptions.map(o => o.value);
      expect(values).toContain(JournalEntryStatus.DRAFT);
      expect(values).toContain(JournalEntryStatus.POSTED);
    });

    it('should have accountTypeTagType for all types', () => {
      expect(accountTypeTagType[AccountType.LIABILITY]).toBe('danger');
      expect(accountTypeTagType[AccountType.REVENUE]).toBe('success');
    });
  });
});
