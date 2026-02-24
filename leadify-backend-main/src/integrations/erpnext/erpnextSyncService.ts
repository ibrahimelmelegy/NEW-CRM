import { ERPNextClient, ERPNextApiError } from './erpnextClient';
import { ERPNextConfig, loadERPNextConfig, validateERPNextConfig } from './erpnextConfig';
import SyncLog, { SyncDirection, SyncStatus } from './syncLogModel';
import Invoice from '../../deal/model/invoiceMode';
import Deal from '../../deal/model/dealModel';
import Client from '../../client/clientModel';
import Vendor from '../../vendor/vendorModel';
import PurchaseOrder from '../../procurement/models/purchaseOrderModel';
import PurchaseOrderItem from '../../procurement/models/purchaseOrderItemModel';

// ---------------------------------------------------------------------------
// Sync Service
// ---------------------------------------------------------------------------

class ERPNextSyncService {
  private client: ERPNextClient | null = null;
  private config: ERPNextConfig | null = null;

  // ---- Initialization ----

  /**
   * Lazy-initialize the client from env config.
   * Throws a descriptive error if not configured.
   */
  private getClient(): ERPNextClient {
    if (!this.client) {
      const config = loadERPNextConfig();
      if (!config.enabled) {
        throw new Error('ERPNext integration is not enabled. Set ERPNEXT_ENABLED=true in environment variables.');
      }
      const missing = validateERPNextConfig(config);
      if (missing.length > 0) {
        throw new Error(`ERPNext integration misconfigured. Missing: ${missing.join(', ')}`);
      }
      this.config = config;
      this.client = new ERPNextClient(config);
    }
    return this.client;
  }

  private getConfig(): ERPNextConfig {
    this.getClient(); // ensure initialized
    return this.config!;
  }

  /**
   * Force re-initialization (useful after config change).
   */
  resetClient(): void {
    this.client = null;
    this.config = null;
  }

  // ---- Sync Log helpers ----

  private async createSyncLog(params: {
    direction: SyncDirection;
    entityType: string;
    entityId: string;
    requestData?: object;
  }): Promise<SyncLog> {
    return SyncLog.create({
      integration: 'erpnext',
      direction: params.direction,
      entityType: params.entityType,
      entityId: params.entityId,
      status: SyncStatus.PENDING,
      requestData: params.requestData || null,
    });
  }

  private async markSuccess(log: SyncLog, externalId: string, responseData?: object): Promise<void> {
    await log.update({
      status: SyncStatus.SUCCESS,
      externalId,
      responseData: responseData || null,
      syncedAt: new Date(),
    });
  }

  private async markFailed(log: SyncLog, errorMessage: string, responseData?: object): Promise<void> {
    await log.update({
      status: SyncStatus.FAILED,
      errorMessage,
      responseData: responseData || null,
      syncedAt: new Date(),
    });
  }

  // ---- Invoice -> ERPNext Sales Invoice ----

  async syncInvoiceToERPNext(invoiceId: number): Promise<{ success: boolean; erpnextName?: string; error?: string }> {
    const client = this.getClient();
    const config = this.getConfig();

    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{ model: Deal, as: 'deal', include: [{ model: Client, as: 'client' }] }],
    });
    if (!invoice) {
      throw new Error(`Invoice #${invoiceId} not found`);
    }

    const deal = (invoice as any).deal as Deal | undefined;
    const crmClient = deal ? (deal as any).client as Client | undefined : undefined;

    // Map CRM invoice -> ERPNext Sales Invoice
    const customerName = crmClient?.clientName || crmClient?.companyName || deal?.companyName || 'Walk-in Customer';

    const erpnextData: Record<string, any> = {
      doctype: 'Sales Invoice',
      naming_series: 'SINV-.YYYY.-',
      customer: customerName,
      company: config.company,
      currency: config.defaultCurrency,
      posting_date: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      due_date: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      is_pos: 0,
      crm_invoice_id: String(invoice.id),
      items: [
        {
          item_code: 'Services', // Default item; can be refined based on deal details
          item_name: deal?.name || `Invoice ${invoice.invoiceNumber}`,
          description: deal?.name || `CRM Invoice ${invoice.invoiceNumber}`,
          qty: 1,
          rate: Number(invoice.amount),
          amount: Number(invoice.amount),
        },
      ],
    };

    const syncLog = await this.createSyncLog({
      direction: SyncDirection.PUSH,
      entityType: 'invoice',
      entityId: String(invoiceId),
      requestData: erpnextData,
    });

    try {
      // Check if we already synced this invoice (by searching for custom field)
      const existing = await this.findExistingSyncedDoc('Sales Invoice', 'invoice', String(invoiceId));

      let result: any;
      if (existing) {
        result = await client.update('Sales Invoice', existing, erpnextData);
      } else {
        result = await client.create('Sales Invoice', erpnextData);
      }

      const erpnextName = result.name;
      await this.markSuccess(syncLog, erpnextName, result);
      return { success: true, erpnextName };
    } catch (err: any) {
      const message = err instanceof ERPNextApiError
        ? `ERPNext API Error (${err.httpCode}): ${err.message}`
        : err.message || 'Unknown error';
      await this.markFailed(syncLog, message, err instanceof ERPNextApiError ? { serverMessages: err.serverMessages } : undefined);
      return { success: false, error: message };
    }
  }

  // ---- Payment pull from ERPNext ----

  async syncPaymentFromERPNext(erpnextPaymentName: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const client = this.getClient();

    const syncLog = await this.createSyncLog({
      direction: SyncDirection.PULL,
      entityType: 'payment',
      entityId: erpnextPaymentName,
    });

    try {
      const payment = await client.get('Payment Entry', erpnextPaymentName);
      await this.markSuccess(syncLog, erpnextPaymentName, payment);
      return { success: true, data: payment };
    } catch (err: any) {
      const message = err instanceof ERPNextApiError
        ? `ERPNext API Error (${err.httpCode}): ${err.message}`
        : err.message || 'Unknown error';
      await this.markFailed(syncLog, message);
      return { success: false, error: message };
    }
  }

  // ---- Client -> ERPNext Customer ----

  async syncCustomerToERPNext(clientId: string): Promise<{ success: boolean; erpnextName?: string; error?: string }> {
    const client = this.getClient();

    const crmClient = await Client.findByPk(clientId);
    if (!crmClient) {
      throw new Error(`Client ${clientId} not found`);
    }

    const erpnextData: Record<string, any> = {
      doctype: 'Customer',
      customer_name: crmClient.clientName,
      customer_type: crmClient.clientType === 'Individual' ? 'Individual' : 'Company',
      customer_group: 'All Customer Groups',
      territory: 'All Territories',
      crm_client_id: clientId,
    };

    // Map address fields if available
    if (crmClient.email) {
      erpnextData.email_id = crmClient.email;
    }
    if (crmClient.phoneNumber) {
      erpnextData.mobile_no = crmClient.phoneNumber;
    }

    const syncLog = await this.createSyncLog({
      direction: SyncDirection.PUSH,
      entityType: 'client',
      entityId: clientId,
      requestData: erpnextData,
    });

    try {
      const existing = await this.findExistingSyncedDoc('Customer', 'client', clientId);

      let result: any;
      if (existing) {
        result = await client.update('Customer', existing, erpnextData);
      } else {
        result = await client.create('Customer', erpnextData);
      }

      const erpnextName = result.name;
      await this.markSuccess(syncLog, erpnextName, result);
      return { success: true, erpnextName };
    } catch (err: any) {
      const message = err instanceof ERPNextApiError
        ? `ERPNext API Error (${err.httpCode}): ${err.message}`
        : err.message || 'Unknown error';
      await this.markFailed(syncLog, message, err instanceof ERPNextApiError ? { serverMessages: err.serverMessages } : undefined);
      return { success: false, error: message };
    }
  }

  // ---- Vendor -> ERPNext Supplier ----

  async syncSupplierToERPNext(vendorId: number): Promise<{ success: boolean; erpnextName?: string; error?: string }> {
    const client = this.getClient();

    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      throw new Error(`Vendor #${vendorId} not found`);
    }

    const erpnextData: Record<string, any> = {
      doctype: 'Supplier',
      supplier_name: vendor.name,
      supplier_group: 'All Supplier Groups',
      supplier_type: 'Company',
      crm_vendor_id: String(vendorId),
    };

    if (vendor.email) {
      erpnextData.email_id = vendor.email;
    }
    if (vendor.phone) {
      erpnextData.mobile_no = vendor.phone;
    }
    if (vendor.taxId) {
      erpnextData.tax_id = vendor.taxId;
    }

    const syncLog = await this.createSyncLog({
      direction: SyncDirection.PUSH,
      entityType: 'vendor',
      entityId: String(vendorId),
      requestData: erpnextData,
    });

    try {
      const existing = await this.findExistingSyncedDoc('Supplier', 'vendor', String(vendorId));

      let result: any;
      if (existing) {
        result = await client.update('Supplier', existing, erpnextData);
      } else {
        result = await client.create('Supplier', erpnextData);
      }

      const erpnextName = result.name;
      await this.markSuccess(syncLog, erpnextName, result);
      return { success: true, erpnextName };
    } catch (err: any) {
      const message = err instanceof ERPNextApiError
        ? `ERPNext API Error (${err.httpCode}): ${err.message}`
        : err.message || 'Unknown error';
      await this.markFailed(syncLog, message, err instanceof ERPNextApiError ? { serverMessages: err.serverMessages } : undefined);
      return { success: false, error: message };
    }
  }

  // ---- Purchase Order -> ERPNext Purchase Order ----

  async syncPurchaseOrderToERPNext(poId: number): Promise<{ success: boolean; erpnextName?: string; error?: string }> {
    const client = this.getClient();
    const config = this.getConfig();

    const po = await PurchaseOrder.findByPk(poId, {
      include: [
        { model: Vendor, as: 'vendor' },
        { model: PurchaseOrderItem, as: 'items' },
      ],
    });
    if (!po) {
      throw new Error(`Purchase Order #${poId} not found`);
    }

    const vendor = (po as any).vendor as Vendor | undefined;
    const items = ((po as any).items || []) as PurchaseOrderItem[];

    const erpnextItems = items.map((item) => ({
      item_code: 'Services', // Default; can be mapped if product catalog synced
      item_name: item.description,
      description: item.description,
      qty: item.quantity,
      rate: Number(item.unitPrice),
      amount: Number(item.unitPrice) * item.quantity,
    }));

    const erpnextData: Record<string, any> = {
      doctype: 'Purchase Order',
      naming_series: 'PO-.YYYY.-',
      supplier: vendor?.name || 'Unknown Supplier',
      company: config.company,
      currency: config.defaultCurrency,
      transaction_date: new Date().toISOString().split('T')[0],
      schedule_date: po.dueDate ? new Date(po.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      crm_po_id: String(poId),
      crm_po_number: po.poNumber,
      items: erpnextItems,
    };

    const syncLog = await this.createSyncLog({
      direction: SyncDirection.PUSH,
      entityType: 'po',
      entityId: String(poId),
      requestData: erpnextData,
    });

    try {
      const existing = await this.findExistingSyncedDoc('Purchase Order', 'po', String(poId));

      let result: any;
      if (existing) {
        result = await client.update('Purchase Order', existing, erpnextData);
      } else {
        result = await client.create('Purchase Order', erpnextData);
      }

      const erpnextName = result.name;
      await this.markSuccess(syncLog, erpnextName, result);
      return { success: true, erpnextName };
    } catch (err: any) {
      const message = err instanceof ERPNextApiError
        ? `ERPNext API Error (${err.httpCode}): ${err.message}`
        : err.message || 'Unknown error';
      await this.markFailed(syncLog, message, err instanceof ERPNextApiError ? { serverMessages: err.serverMessages } : undefined);
      return { success: false, error: message };
    }
  }

  // ---- Pull Chart of Accounts from ERPNext ----

  async pullChartOfAccounts(): Promise<any[]> {
    const client = this.getClient();
    const config = this.getConfig();

    try {
      const accounts = await client.getList(
        'Account',
        { company: config.company },
        ['name', 'account_name', 'account_type', 'root_type', 'parent_account', 'is_group', 'balance'],
        'root_type asc, account_name asc',
        0 // 0 = no limit in ERPNext
      );
      return accounts;
    } catch (err: any) {
      throw new Error(`Failed to pull Chart of Accounts: ${err.message}`);
    }
  }

  // ---- Pull Account Balances ----

  async pullAccountBalances(): Promise<any> {
    const client = this.getClient();
    const config = this.getConfig();

    try {
      const result = await client.getMethod('erpnext.accounts.utils.get_balance_on', {
        company: config.company,
        date: new Date().toISOString().split('T')[0],
      });
      return result.message;
    } catch (err: any) {
      // Fallback: pull accounts with balances from resource API
      try {
        const accounts = await client.getList(
          'GL Entry',
          { company: config.company, is_cancelled: 0 },
          ['account', 'sum(debit) as total_debit', 'sum(credit) as total_credit'],
          'account asc',
          0
        );
        return accounts;
      } catch (fallbackErr: any) {
        throw new Error(`Failed to pull account balances: ${err.message}`);
      }
    }
  }

  // ---- Pull Profit & Loss Report ----

  async pullProfitAndLoss(fromDate: string, toDate: string): Promise<any> {
    const client = this.getClient();
    const config = this.getConfig();

    try {
      const result = await client.getMethod('erpnext.accounts.report.profit_and_loss_statement.profit_and_loss_statement.execute', {
        company: config.company,
        from_fiscal_year: fromDate.substring(0, 4),
        to_fiscal_year: toDate.substring(0, 4),
        period_start_date: fromDate,
        period_end_date: toDate,
        filter_based_on: 'Date Range',
        periodicity: 'Monthly',
      });
      return result.message;
    } catch (err: any) {
      throw new Error(`Failed to pull Profit & Loss report: ${err.message}`);
    }
  }

  // ---- Pull Balance Sheet ----

  async pullBalanceSheet(date: string): Promise<any> {
    const client = this.getClient();
    const config = this.getConfig();

    try {
      const result = await client.getMethod('erpnext.accounts.report.balance_sheet.balance_sheet.execute', {
        company: config.company,
        from_fiscal_year: date.substring(0, 4),
        to_fiscal_year: date.substring(0, 4),
        period_start_date: `${date.substring(0, 4)}-01-01`,
        period_end_date: date,
        periodicity: 'Yearly',
      });
      return result.message;
    } catch (err: any) {
      throw new Error(`Failed to pull Balance Sheet: ${err.message}`);
    }
  }

  // ---- Pull Payment Entries ----

  async pullPaymentEntries(filters?: Record<string, any>): Promise<any[]> {
    const client = this.getClient();
    const config = this.getConfig();

    try {
      const defaultFilters: Record<string, any> = {
        company: config.company,
        docstatus: 1, // submitted entries only
      };
      const mergedFilters = { ...defaultFilters, ...filters };

      const payments = await client.getList(
        'Payment Entry',
        mergedFilters,
        ['name', 'payment_type', 'party_type', 'party', 'paid_amount', 'received_amount', 'posting_date', 'reference_no', 'status', 'mode_of_payment'],
        'posting_date desc',
        100
      );
      return payments;
    } catch (err: any) {
      throw new Error(`Failed to pull payment entries: ${err.message}`);
    }
  }

  // ---- Connection Status ----

  async getERPNextStatus(): Promise<{
    connected: boolean;
    enabled: boolean;
    user?: string;
    company?: string;
    baseUrl?: string;
    error?: string;
    lastSync?: Date | null;
  }> {
    const config = loadERPNextConfig();

    if (!config.enabled) {
      return { connected: false, enabled: false, error: 'ERPNext integration is disabled' };
    }

    const missing = validateERPNextConfig(config);
    if (missing.length > 0) {
      return { connected: false, enabled: true, error: `Missing configuration: ${missing.join(', ')}` };
    }

    try {
      const erpClient = new ERPNextClient(config);
      const pingResult = await erpClient.ping();

      // Get last successful sync
      const lastLog = await SyncLog.findOne({
        where: { integration: 'erpnext', status: SyncStatus.SUCCESS },
        order: [['syncedAt', 'DESC']],
      });

      return {
        connected: true,
        enabled: true,
        user: pingResult.user,
        company: config.company,
        baseUrl: config.baseUrl,
        lastSync: lastLog?.syncedAt || null,
      };
    } catch (err: any) {
      return {
        connected: false,
        enabled: true,
        baseUrl: config.baseUrl,
        company: config.company,
        error: err.message || 'Connection failed',
      };
    }
  }

  // ---- Sync Logs ----

  async getSyncLogs(filters?: {
    entityType?: string;
    status?: string;
    direction?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: SyncLog[]; total: number }> {
    const where: Record<string, any> = { integration: 'erpnext' };
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.status) where.status = filters.status;
    if (filters?.direction) where.direction = filters.direction;

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const { rows, count } = await SyncLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { logs: rows, total: count };
  }

  // ---- Helpers ----

  /**
   * Look up the last successfully synced ERPNext document name for a CRM entity.
   */
  private async findExistingSyncedDoc(erpnextDoctype: string, entityType: string, entityId: string): Promise<string | null> {
    const lastSync = await SyncLog.findOne({
      where: {
        integration: 'erpnext',
        direction: SyncDirection.PUSH,
        entityType,
        entityId,
        status: SyncStatus.SUCCESS,
      },
      order: [['syncedAt', 'DESC']],
    });

    return lastSync?.externalId || null;
  }
}

export default new ERPNextSyncService();
