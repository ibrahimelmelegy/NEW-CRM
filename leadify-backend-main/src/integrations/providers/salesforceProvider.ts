// ─── Salesforce CRM Sync Provider ────────────────────────────────────────────
import logger from '../../config/logger';
// Uses Salesforce REST API via jsforce when SALESFORCE_CLIENT_ID is configured.
// Falls back to mock data when credentials are not present.

export interface SalesforceCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  loginUrl?: string;
}

export interface SyncResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  mock: boolean;
  syncedAt: string;
}

export interface SalesforceRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export class SalesforceProvider {
  private connection: unknown = null;

  static isConfigured(): boolean {
    return !!(process.env.SALESFORCE_CLIENT_ID && process.env.SALESFORCE_CLIENT_SECRET);
  }

  private async getConnection() {
    if (!this.connection && SalesforceProvider.isConfigured()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const jsforce = require('jsforce');
        this.connection = new jsforce.Connection({
          oauth2: {
            clientId: process.env.SALESFORCE_CLIENT_ID,
            clientSecret: process.env.SALESFORCE_CLIENT_SECRET,
            loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com'
          }
        });
        await (this.connection as Record<string, unknown> & { login: Function }).login(process.env.SALESFORCE_USERNAME!, process.env.SALESFORCE_PASSWORD!);
        // Connected to Salesforce
      } catch (err) {
        logger.error('[SalesforceProvider] Failed to connect:', err);
        this.connection = null;
      }
    }
    return this.connection;
  }

  async syncLeads(
    leads: Array<{ name: string; email: string; company?: string; phone?: string }>
  ): Promise<SyncResult<{ synced: number; failed: number }>> {
    try {
      const conn = await this.getConnection();
      if (conn) {
        const records = leads.map(l => ({ LastName: l.name, Email: l.email, Company: l.company || 'Unknown', Phone: l.phone }));
        const results = await conn.sobject('Lead').create(records);
        const synced = (results as unknown[]).filter((r: Record<string, unknown>) => r.success).length;
        return { success: true, data: { synced, failed: leads.length - synced }, mock: false, syncedAt: new Date().toISOString() };
      }
      return { success: true, data: { synced: leads.length, failed: 0 }, mock: true, syncedAt: new Date().toISOString() };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[SalesforceProvider] syncLeads error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SalesforceProvider.isConfigured(), syncedAt: new Date().toISOString() };
    }
  }

  async syncContacts(contacts: Array<{ name: string; email: string; phone?: string }>): Promise<SyncResult<{ synced: number; failed: number }>> {
    try {
      const conn = await this.getConnection();
      if (conn) {
        const records = contacts.map(c => ({ LastName: c.name, Email: c.email, Phone: c.phone }));
        const results = await conn.sobject('Contact').create(records);
        const synced = (results as unknown[]).filter((r: Record<string, unknown>) => r.success).length;
        return { success: true, data: { synced, failed: contacts.length - synced }, mock: false, syncedAt: new Date().toISOString() };
      }
      return { success: true, data: { synced: contacts.length, failed: 0 }, mock: true, syncedAt: new Date().toISOString() };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[SalesforceProvider] syncContacts error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SalesforceProvider.isConfigured(), syncedAt: new Date().toISOString() };
    }
  }

  async syncDeals(
    deals: Array<{ name: string; amount: number; stage: string; closeDate: string }>
  ): Promise<SyncResult<{ synced: number; failed: number }>> {
    try {
      const conn = await this.getConnection();
      if (conn) {
        const records = deals.map(d => ({ Name: d.name, Amount: d.amount, StageName: d.stage, CloseDate: d.closeDate }));
        const results = await conn.sobject('Opportunity').create(records);
        const synced = (results as unknown[]).filter((r: Record<string, unknown>) => r.success).length;
        return { success: true, data: { synced, failed: deals.length - synced }, mock: false, syncedAt: new Date().toISOString() };
      }
      return { success: true, data: { synced: deals.length, failed: 0 }, mock: true, syncedAt: new Date().toISOString() };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[SalesforceProvider] syncDeals error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SalesforceProvider.isConfigured(), syncedAt: new Date().toISOString() };
    }
  }

  async importFromSalesforce(objectType: 'Lead' | 'Contact' | 'Opportunity', limit = 100): Promise<SyncResult<SalesforceRecord[]>> {
    try {
      const conn = await this.getConnection();
      if (conn) {
        const fieldMap: Record<string, string> = {
          Lead: 'Id, Name, Email, Phone, Company, Status',
          Contact: 'Id, Name, Email, Phone, AccountId',
          Opportunity: 'Id, Name, Amount, StageName, CloseDate'
        };
        const records = await conn.sobject(objectType).find({}, fieldMap[objectType]).limit(limit).execute();
        const mapped = records.map((r: Record<string, unknown>) => ({ id: r.Id, name: r.Name, email: r.Email, phone: r.Phone, ...r }));
        return { success: true, data: mapped, mock: false, syncedAt: new Date().toISOString() };
      }
      const mockRecords: SalesforceRecord[] = [
        { id: 'sf_001', name: 'Mock Lead A', email: 'leada@example.com' },
        { id: 'sf_002', name: 'Mock Lead B', email: 'leadb@example.com' }
      ];
      return { success: true, data: mockRecords, mock: true, syncedAt: new Date().toISOString() };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[SalesforceProvider] importFromSalesforce error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SalesforceProvider.isConfigured(), syncedAt: new Date().toISOString() };
    }
  }

  async exportToSalesforce(
    objectType: 'Lead' | 'Contact' | 'Opportunity',
    records: Record<string, unknown>[]
  ): Promise<SyncResult<{ exported: number; failed: number }>> {
    try {
      const conn = await this.getConnection();
      if (conn) {
        const results = await conn.sobject(objectType).create(records);
        const exported = (results as unknown[]).filter((r: Record<string, unknown>) => r.success).length;
        return { success: true, data: { exported, failed: records.length - exported }, mock: false, syncedAt: new Date().toISOString() };
      }
      return { success: true, data: { exported: records.length, failed: 0 }, mock: true, syncedAt: new Date().toISOString() };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[SalesforceProvider] exportToSalesforce error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !SalesforceProvider.isConfigured(), syncedAt: new Date().toISOString() };
    }
  }
}

export default new SalesforceProvider();
