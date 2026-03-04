/* eslint-disable require-await */
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

export enum JournalEntryStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  VOIDED = 'VOIDED'
}

export enum JournalEntrySourceType {
  MANUAL = 'MANUAL',
  INVOICE = 'INVOICE',
  PAYMENT = 'PAYMENT',
  EXPENSE = 'EXPENSE',
  PAYROLL = 'PAYROLL'
}

export interface ChartOfAccountsItem {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  isGroup: boolean;
  balance: number;
  description?: string;
  tenantId?: string;
  children?: ChartOfAccountsItem[];
}

export interface JournalEntryLineItem {
  id?: string;
  journalEntryId?: string;
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  account?: { id: string; code: string; name: string; type: string };
}

export interface JournalEntryItem {
  id: string;
  entryNumber: string;
  date: string;
  reference?: string;
  description?: string;
  sourceType: JournalEntrySourceType;
  sourceId?: string;
  status: JournalEntryStatus;
  totalDebit: number;
  totalCredit: number;
  tenantId?: string;
  lines?: JournalEntryLineItem[];
  createdAt: string;
}

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceResult {
  accounts: TrialBalanceRow[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

export interface ProfitLossResult {
  period: { from: string; to: string };
  revenue: { code: string; name: string; amount: number }[];
  totalRevenue: number;
  expenses: { code: string; name: string; amount: number }[];
  totalExpenses: number;
  netIncome: number;
}

export interface BalanceSheetResult {
  asOfDate: string;
  assets: { code: string; name: string; type: string; amount: number }[];
  totalAssets: number;
  liabilities: { code: string; name: string; type: string; amount: number }[];
  totalLiabilities: number;
  equity: { code: string; name: string; type: string; amount: number }[];
  netIncome: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface GeneralLedgerResult {
  account: { id: string; code: string; name: string; type: string };
  entries: {
    date: string;
    entryNumber: string;
    reference?: string;
    description?: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  closingBalance: number;
}

// Account type color mapping
export const accountTypeColors: Record<AccountType, string> = {
  [AccountType.ASSET]: '#409EFF',
  [AccountType.LIABILITY]: '#F56C6C',
  [AccountType.EQUITY]: '#9B59B6',
  [AccountType.REVENUE]: '#67C23A',
  [AccountType.EXPENSE]: '#E6A23C'
};

export const accountTypeTagType: Record<AccountType, string> = {
  [AccountType.ASSET]: '',
  [AccountType.LIABILITY]: 'danger',
  [AccountType.EQUITY]: 'warning',
  [AccountType.REVENUE]: 'success',
  [AccountType.EXPENSE]: 'warning'
};

export const sourceTypeOptions = [
  { label: 'Manual', value: JournalEntrySourceType.MANUAL },
  { label: 'Invoice', value: JournalEntrySourceType.INVOICE },
  { label: 'Payment', value: JournalEntrySourceType.PAYMENT },
  { label: 'Expense', value: JournalEntrySourceType.EXPENSE },
  { label: 'Payroll', value: JournalEntrySourceType.PAYROLL }
];

export const journalStatusOptions = [
  { label: 'Draft', value: JournalEntryStatus.DRAFT },
  { label: 'Posted', value: JournalEntryStatus.POSTED },
  { label: 'Voided', value: JournalEntryStatus.VOIDED }
];

// ─── Chart of Accounts API ──────────────────────────────────────

export async function fetchChartOfAccounts(): Promise<ChartOfAccountsItem[]> {
  const { body, success } = await useApiFetch('accounting/chart-of-accounts');
  return success && body ? (body as ChartOfAccountsItem[]) : [];
}

export async function createAccount(data: Partial<ChartOfAccountsItem>) {
  return useApiFetch('accounting/chart-of-accounts', 'POST', data);
}

export async function updateAccount(id: string, data: Partial<ChartOfAccountsItem>) {
  return useApiFetch(`accounting/chart-of-accounts/${id}`, 'PUT', data);
}

export async function deleteAccount(id: string) {
  return useApiFetch(`accounting/chart-of-accounts/${id}`, 'DELETE');
}

export async function seedDefaultAccounts() {
  return useApiFetch('accounting/chart-of-accounts/seed', 'POST');
}

// ─── Journal Entries API ────────────────────────────────────────

export async function fetchJournalEntries(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`accounting/journal-entries${query}`);
  if (success && body)
    return body as { docs: JournalEntryItem[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchJournalEntryById(id: string): Promise<JournalEntryItem | null> {
  const { body, success } = await useApiFetch(`accounting/journal-entries/${id}`);
  return success && body ? (body as JournalEntryItem) : null;
}

export interface JournalEntryCreateData {
  date: string;
  reference?: string;
  description?: string;
  sourceType?: JournalEntrySourceType;
  lines: { accountId: string; debit: number; credit: number; description?: string }[];
}

export async function createJournalEntry(data: JournalEntryCreateData) {
  return useApiFetch('accounting/journal-entries', 'POST', data as unknown as Record<string, unknown>);
}

export async function postJournalEntry(id: string) {
  return useApiFetch(`accounting/journal-entries/${id}/post`, 'PATCH');
}

export async function voidJournalEntry(id: string) {
  return useApiFetch(`accounting/journal-entries/${id}/void`, 'PATCH');
}

// ─── Reports API ────────────────────────────────────────────────

export async function fetchTrialBalance(date?: string): Promise<TrialBalanceResult> {
  const query = date ? `?date=${date}` : '';
  const { body, success } = await useApiFetch(`accounting/reports/trial-balance${query}`);
  return success && body ? (body as TrialBalanceResult) : { accounts: [], totalDebits: 0, totalCredits: 0, isBalanced: true };
}

export async function fetchProfitAndLoss(from: string, to: string): Promise<ProfitLossResult> {
  const { body, success } = await useApiFetch(`accounting/reports/profit-loss?from=${from}&to=${to}`);
  return success && body
    ? (body as ProfitLossResult)
    : { period: { from, to }, revenue: [], totalRevenue: 0, expenses: [], totalExpenses: 0, netIncome: 0 };
}

export async function fetchBalanceSheet(date: string): Promise<BalanceSheetResult> {
  const { body, success } = await useApiFetch(`accounting/reports/balance-sheet?date=${date}`);
  return success && body
    ? (body as BalanceSheetResult)
    : {
        asOfDate: date,
        assets: [],
        totalAssets: 0,
        liabilities: [],
        totalLiabilities: 0,
        equity: [],
        netIncome: 0,
        totalEquity: 0,
        totalLiabilitiesAndEquity: 0,
        isBalanced: true
      };
}

export async function fetchGeneralLedger(accountId: string, from?: string, to?: string): Promise<GeneralLedgerResult> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString() ? `?${params.toString()}` : '';
  const { body, success } = await useApiFetch(`accounting/general-ledger/${accountId}${query}`);
  return success && body ? (body as GeneralLedgerResult) : { account: { id: '', code: '', name: '', type: '' }, entries: [], closingBalance: 0 };
}
