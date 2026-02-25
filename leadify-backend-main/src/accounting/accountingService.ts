import { Op } from 'sequelize';
import { clampPagination } from '../utils/pagination';
import ChartOfAccounts, { AccountType } from './models/chartOfAccountsModel';
import JournalEntry, { JournalEntryStatus, JournalEntrySourceType } from './models/journalEntryModel';
import JournalEntryLine from './models/journalEntryLineModel';
import FiscalYear from './models/fiscalYearModel';

class AccountingService {
  // ─── Chart of Accounts ────────────────────────────────────────────

  async seedDefaultCOA(tenantId?: string) {
    const existing = await ChartOfAccounts.findOne({ where: { tenantId: tenantId || null } });
    if (existing) {
      throw new Error('Chart of accounts already seeded for this tenant');
    }

    const groups = [
      { code: '1000', name: 'Assets', type: AccountType.ASSET },
      { code: '2000', name: 'Liabilities', type: AccountType.LIABILITY },
      { code: '3000', name: 'Equity', type: AccountType.EQUITY },
      { code: '4000', name: 'Revenue', type: AccountType.REVENUE },
      { code: '5000', name: 'Expenses', type: AccountType.EXPENSE }
    ];

    const createdGroups: Record<string, ChartOfAccounts> = {};
    for (const g of groups) {
      createdGroups[g.code] = await ChartOfAccounts.create({
        code: g.code,
        name: g.name,
        type: g.type,
        isGroup: true,
        tenantId
      });
    }

    const leafAccounts = [
      // Assets
      { code: '1100', name: 'Cash', type: AccountType.ASSET, parentId: createdGroups['1000'].id },
      { code: '1200', name: 'Accounts Receivable', type: AccountType.ASSET, parentId: createdGroups['1000'].id },
      { code: '1300', name: 'Inventory', type: AccountType.ASSET, parentId: createdGroups['1000'].id },
      // Liabilities
      { code: '2100', name: 'Accounts Payable', type: AccountType.LIABILITY, parentId: createdGroups['2000'].id },
      { code: '2200', name: 'VAT Payable', type: AccountType.LIABILITY, parentId: createdGroups['2000'].id },
      { code: '2300', name: 'Salaries Payable', type: AccountType.LIABILITY, parentId: createdGroups['2000'].id },
      // Equity
      { code: '3100', name: "Owner's Equity", type: AccountType.EQUITY, parentId: createdGroups['3000'].id },
      { code: '3200', name: 'Retained Earnings', type: AccountType.EQUITY, parentId: createdGroups['3000'].id },
      // Revenue
      { code: '4100', name: 'Sales Revenue', type: AccountType.REVENUE, parentId: createdGroups['4000'].id },
      { code: '4200', name: 'Service Revenue', type: AccountType.REVENUE, parentId: createdGroups['4000'].id },
      // Expenses
      { code: '5100', name: 'Cost of Goods Sold', type: AccountType.EXPENSE, parentId: createdGroups['5000'].id },
      { code: '5200', name: 'Salaries Expense', type: AccountType.EXPENSE, parentId: createdGroups['5000'].id },
      { code: '5300', name: 'Rent', type: AccountType.EXPENSE, parentId: createdGroups['5000'].id },
      { code: '5400', name: 'Utilities', type: AccountType.EXPENSE, parentId: createdGroups['5000'].id },
      { code: '5500', name: 'Marketing', type: AccountType.EXPENSE, parentId: createdGroups['5000'].id }
    ];

    for (const account of leafAccounts) {
      await ChartOfAccounts.create({ ...account, isGroup: false, tenantId });
    }

    return { message: 'Default chart of accounts seeded successfully' };
  }

  async getChartOfAccounts(tenantId?: string) {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const allAccounts = await ChartOfAccounts.findAll({
      where,
      order: [['code', 'ASC']],
      raw: true
    });

    // Build tree structure
    const accountMap: Record<string, any> = {};
    const tree: any[] = [];

    for (const account of allAccounts) {
      accountMap[account.id] = { ...account, children: [] };
    }

    for (const account of allAccounts) {
      if (account.parentId && accountMap[account.parentId]) {
        accountMap[account.parentId].children.push(accountMap[account.id]);
      } else {
        tree.push(accountMap[account.id]);
      }
    }

    return tree;
  }

  async createAccount(data: any) {
    if (data.parentId) {
      const parent = await ChartOfAccounts.findByPk(data.parentId);
      if (!parent) throw new Error('Parent account not found');
    }

    const existingCode = await ChartOfAccounts.findOne({ where: { code: data.code } });
    if (existingCode) throw new Error('Account code already exists');

    return ChartOfAccounts.create(data);
  }

  async updateAccount(id: string, data: any) {
    const account = await ChartOfAccounts.findByPk(id);
    if (!account) throw new Error('Account not found');

    if (data.code && data.code !== account.code) {
      const existingCode = await ChartOfAccounts.findOne({ where: { code: data.code, id: { [Op.ne]: id } } });
      if (existingCode) throw new Error('Account code already exists');
    }

    return account.update(data);
  }

  async deleteAccount(id: string) {
    const account = await ChartOfAccounts.findByPk(id);
    if (!account) throw new Error('Account not found');

    // Check for transactions
    const lineCount = await JournalEntryLine.count({ where: { accountId: id } });
    if (lineCount > 0) throw new Error('Cannot delete account with existing transactions');

    // Check for children
    const childCount = await ChartOfAccounts.count({ where: { parentId: id } });
    if (childCount > 0) throw new Error('Cannot delete account with child accounts');

    await account.destroy();
    return { deleted: true };
  }

  // ─── Journal Entries ──────────────────────────────────────────────

  async generateEntryNumber(): Promise<string> {
    const lastEntry = await JournalEntry.findOne({
      order: [['createdAt', 'DESC']]
    });

    if (!lastEntry) return 'JE-0001';

    const lastNumber = parseInt(lastEntry.entryNumber.replace('JE-', ''), 10);
    const nextNumber = lastNumber + 1;
    return `JE-${String(nextNumber).padStart(4, '0')}`;
  }

  async createJournalEntry(data: any) {
    const { lines, ...entryData } = data;

    if (!lines || lines.length === 0) {
      throw new Error('Journal entry must have at least one line');
    }

    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
      totalDebit += Number(line.debit) || 0;
      totalCredit += Number(line.credit) || 0;
    }

    // Validate balanced entry
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error('Journal entry must be balanced: total debits must equal total credits');
    }

    // Validate all account IDs exist
    const accountIds = lines.map((l: any) => l.accountId);
    const accounts = await ChartOfAccounts.findAll({ where: { id: accountIds } });
    if (accounts.length !== new Set(accountIds).size) {
      throw new Error('One or more account IDs are invalid');
    }

    // Generate entry number
    const entryNumber = await this.generateEntryNumber();

    const entry = await JournalEntry.create({
      ...entryData,
      entryNumber,
      totalDebit,
      totalCredit,
      status: JournalEntryStatus.DRAFT
    });

    // Create lines
    for (const line of lines) {
      await JournalEntryLine.create({
        journalEntryId: entry.id,
        accountId: line.accountId,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
        description: line.description
      });
    }

    return this.getJournalEntryById(entry.id);
  }

  async getJournalEntries(query: any) {
    const { page, limit, offset } = clampPagination(query, 20);
    const { status, sourceType, startDate, endDate, search } = query;
    const where: any = {};

    if (status) where.status = status;
    if (sourceType) where.sourceType = sourceType;
    if (startDate && endDate) {
      where.date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    } else if (startDate) {
      where.date = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.date = { [Op.lte]: new Date(endDate) };
    }
    if (search) {
      where[Op.or as any] = [
        { entryNumber: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { reference: { [Op.iLike]: `%${search}%` } }
      ];
    }
    const { rows, count } = await JournalEntry.findAndCountAll({
      where,
      include: [
        {
          model: JournalEntryLine,
          as: 'lines',
          include: [{ model: ChartOfAccounts, as: 'account', attributes: ['id', 'code', 'name', 'type'] }]
        }
      ],
      order: [
        ['date', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getJournalEntryById(id: string) {
    const entry = await JournalEntry.findByPk(id, {
      include: [
        {
          model: JournalEntryLine,
          as: 'lines',
          include: [{ model: ChartOfAccounts, as: 'account', attributes: ['id', 'code', 'name', 'type'] }]
        }
      ]
    });

    if (!entry) throw new Error('Journal entry not found');
    return entry;
  }

  async postEntry(id: string) {
    const entry = await JournalEntry.findByPk(id, {
      include: [
        {
          model: JournalEntryLine,
          as: 'lines',
          include: [{ model: ChartOfAccounts, as: 'account' }]
        }
      ]
    });

    if (!entry) throw new Error('Journal entry not found');
    if (entry.status === JournalEntryStatus.POSTED) throw new Error('Journal entry is already posted');
    if (entry.status === JournalEntryStatus.VOIDED) throw new Error('Cannot post a voided journal entry');

    // Update account balances
    for (const line of entry.lines || []) {
      const account = await ChartOfAccounts.findByPk(line.accountId);
      if (!account) continue;

      let balanceChange = 0;
      // Debit-normal accounts: ASSET, EXPENSE (debits increase, credits decrease)
      if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
        balanceChange = Number(line.debit) - Number(line.credit);
      }
      // Credit-normal accounts: LIABILITY, EQUITY, REVENUE (credits increase, debits decrease)
      else {
        balanceChange = Number(line.credit) - Number(line.debit);
      }

      await account.update({ balance: Number(account.balance) + balanceChange });
    }

    await entry.update({ status: JournalEntryStatus.POSTED });
    return this.getJournalEntryById(id);
  }

  async voidEntry(id: string) {
    const entry = await JournalEntry.findByPk(id, {
      include: [
        {
          model: JournalEntryLine,
          as: 'lines',
          include: [{ model: ChartOfAccounts, as: 'account' }]
        }
      ]
    });

    if (!entry) throw new Error('Journal entry not found');
    if (entry.status === JournalEntryStatus.VOIDED) throw new Error('Journal entry is already voided');

    // Reverse balance changes only if it was posted
    if (entry.status === JournalEntryStatus.POSTED) {
      for (const line of entry.lines || []) {
        const account = await ChartOfAccounts.findByPk(line.accountId);
        if (!account) continue;

        let balanceChange = 0;
        // Reverse: debit-normal accounts
        if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
          balanceChange = Number(line.credit) - Number(line.debit);
        }
        // Reverse: credit-normal accounts
        else {
          balanceChange = Number(line.debit) - Number(line.credit);
        }

        await account.update({ balance: Number(account.balance) + balanceChange });
      }
    }

    await entry.update({ status: JournalEntryStatus.VOIDED });
    return this.getJournalEntryById(id);
  }

  // ─── Financial Reports ────────────────────────────────────────────

  async getTrialBalance(date?: string) {
    const whereEntry: any = { status: JournalEntryStatus.POSTED };
    if (date) {
      whereEntry.date = { [Op.lte]: new Date(date) };
    }

    const accounts = await ChartOfAccounts.findAll({
      where: { isGroup: false },
      order: [['code', 'ASC']],
      raw: true
    });

    const entries = await JournalEntry.findAll({
      where: whereEntry,
      include: [{ model: JournalEntryLine, as: 'lines' }]
    });

    // Aggregate debits/credits per account
    const accountTotals: Record<string, { debit: number; credit: number }> = {};
    for (const entry of entries) {
      for (const line of entry.lines || []) {
        if (!accountTotals[line.accountId]) {
          accountTotals[line.accountId] = { debit: 0, credit: 0 };
        }
        accountTotals[line.accountId].debit += Number(line.debit);
        accountTotals[line.accountId].credit += Number(line.credit);
      }
    }

    const trialBalance = accounts
      .map(account => {
        const totals = accountTotals[account.id] || { debit: 0, credit: 0 };
        const netDebit = totals.debit - totals.credit;
        return {
          accountId: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          debit: netDebit > 0 ? netDebit : 0,
          credit: netDebit < 0 ? Math.abs(netDebit) : 0
        };
      })
      .filter(row => row.debit !== 0 || row.credit !== 0);

    const totalDebits = trialBalance.reduce((sum, row) => sum + row.debit, 0);
    const totalCredits = trialBalance.reduce((sum, row) => sum + row.credit, 0);

    return {
      accounts: trialBalance,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
    };
  }

  async getProfitAndLoss(from: string, to: string) {
    const whereEntry: any = {
      status: JournalEntryStatus.POSTED,
      date: { [Op.between]: [new Date(from), new Date(to)] }
    };

    const entries = await JournalEntry.findAll({
      where: whereEntry,
      include: [
        {
          model: JournalEntryLine,
          as: 'lines',
          include: [{ model: ChartOfAccounts, as: 'account' }]
        }
      ]
    });

    const revenueAccounts: Record<string, { code: string; name: string; amount: number }> = {};
    const expenseAccounts: Record<string, { code: string; name: string; amount: number }> = {};

    for (const entry of entries) {
      for (const line of entry.lines || []) {
        const account = line.account;
        if (!account) continue;

        if (account.type === AccountType.REVENUE) {
          if (!revenueAccounts[account.id]) {
            revenueAccounts[account.id] = { code: account.code, name: account.name, amount: 0 };
          }
          // Revenue is credit-normal: credits increase, debits decrease
          revenueAccounts[account.id].amount += Number(line.credit) - Number(line.debit);
        } else if (account.type === AccountType.EXPENSE) {
          if (!expenseAccounts[account.id]) {
            expenseAccounts[account.id] = { code: account.code, name: account.name, amount: 0 };
          }
          // Expense is debit-normal: debits increase, credits decrease
          expenseAccounts[account.id].amount += Number(line.debit) - Number(line.credit);
        }
      }
    }

    const revenue = Object.values(revenueAccounts).sort((a, b) => a.code.localeCompare(b.code));
    const expenses = Object.values(expenseAccounts).sort((a, b) => a.code.localeCompare(b.code));
    const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
      period: { from, to },
      revenue,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      expenses,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100
    };
  }

  async getBalanceSheet(date: string) {
    const whereEntry: any = {
      status: JournalEntryStatus.POSTED,
      date: { [Op.lte]: new Date(date) }
    };

    const entries = await JournalEntry.findAll({
      where: whereEntry,
      include: [
        {
          model: JournalEntryLine,
          as: 'lines',
          include: [{ model: ChartOfAccounts, as: 'account' }]
        }
      ]
    });

    const accountBalances: Record<string, { code: string; name: string; type: string; amount: number }> = {};

    for (const entry of entries) {
      for (const line of entry.lines || []) {
        const account = line.account;
        if (!account) continue;

        if (!accountBalances[account.id]) {
          accountBalances[account.id] = { code: account.code, name: account.name, type: account.type, amount: 0 };
        }

        // Calculate based on normal balance
        if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
          accountBalances[account.id].amount += Number(line.debit) - Number(line.credit);
        } else {
          accountBalances[account.id].amount += Number(line.credit) - Number(line.debit);
        }
      }
    }

    const allBalances = Object.values(accountBalances);
    const assets = allBalances.filter(a => a.type === AccountType.ASSET).sort((a, b) => a.code.localeCompare(b.code));
    const liabilities = allBalances.filter(a => a.type === AccountType.LIABILITY).sort((a, b) => a.code.localeCompare(b.code));
    const equity = allBalances.filter(a => a.type === AccountType.EQUITY).sort((a, b) => a.code.localeCompare(b.code));

    // Calculate net income from revenue/expenses to include in equity section
    const revenueTotal = allBalances.filter(a => a.type === AccountType.REVENUE).reduce((sum, a) => sum + a.amount, 0);
    const expenseTotal = allBalances.filter(a => a.type === AccountType.EXPENSE).reduce((sum, a) => sum + a.amount, 0);
    const netIncome = revenueTotal - expenseTotal;

    const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.amount, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.amount, 0) + netIncome;

    return {
      asOfDate: date,
      assets,
      totalAssets: Math.round(totalAssets * 100) / 100,
      liabilities,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100,
      equity,
      netIncome: Math.round(netIncome * 100) / 100,
      totalEquity: Math.round(totalEquity * 100) / 100,
      totalLiabilitiesAndEquity: Math.round((totalLiabilities + totalEquity) * 100) / 100,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    };
  }

  async getGeneralLedger(accountId: string, from?: string, to?: string) {
    const account = await ChartOfAccounts.findByPk(accountId);
    if (!account) throw new Error('Account not found');

    const whereEntry: any = { status: JournalEntryStatus.POSTED };
    if (from && to) {
      whereEntry.date = { [Op.between]: [new Date(from), new Date(to)] };
    } else if (from) {
      whereEntry.date = { [Op.gte]: new Date(from) };
    } else if (to) {
      whereEntry.date = { [Op.lte]: new Date(to) };
    }

    const lines = await JournalEntryLine.findAll({
      where: { accountId },
      include: [
        {
          model: JournalEntry,
          as: 'journalEntry',
          where: whereEntry,
          attributes: ['id', 'entryNumber', 'date', 'description', 'reference']
        }
      ],
      order: [[{ model: JournalEntry, as: 'journalEntry' }, 'date', 'ASC']]
    });

    // Build running balance
    let runningBalance = 0;
    const isDebitNormal = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE;

    const ledgerEntries = lines.map(line => {
      if (isDebitNormal) {
        runningBalance += Number(line.debit) - Number(line.credit);
      } else {
        runningBalance += Number(line.credit) - Number(line.debit);
      }

      return {
        date: (line.journalEntry as any)?.date,
        entryNumber: (line.journalEntry as any)?.entryNumber,
        reference: (line.journalEntry as any)?.reference,
        description: line.description || (line.journalEntry as any)?.description,
        debit: Number(line.debit),
        credit: Number(line.credit),
        balance: Math.round(runningBalance * 100) / 100
      };
    });

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type
      },
      entries: ledgerEntries,
      closingBalance: Math.round(runningBalance * 100) / 100
    };
  }
}

export default new AccountingService();
