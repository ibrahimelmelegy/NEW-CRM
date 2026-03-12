// ─── HubSpot CRM Sync Provider ───────────────────────────────────────────────
import logger from '../config/logger';
// Uses HubSpot API when HUBSPOT_API_KEY is configured, otherwise returns mock data.

export interface HubSpotSyncResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
  mock: boolean;
  syncedAt: string;
}

export interface HubSpotRecord {
  id: string;
  properties: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export class HubSpotProvider {
  private client: any = null;

  static isConfigured(): boolean {
    return !!process.env.HUBSPOT_API_KEY;
  }

  private getClient() {
    if (!this.client && HubSpotProvider.isConfigured()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const hubspot = require('@hubspot/api-client');
        this.client = new hubspot.Client({ accessToken: process.env.HUBSPOT_API_KEY });
      } catch (err) {
        logger.error('[HubSpotProvider] Failed to initialize HubSpot SDK:', err);
      }
    }
    return this.client;
  }

  async syncContacts(
    contacts: Array<{ email: string; firstName: string; lastName: string; phone?: string }>
  ): Promise<HubSpotSyncResult<{ synced: number; failed: number }>> {
    try {
      const client = this.getClient();
      if (client) {
        const inputs = contacts.map(c => ({ properties: { email: c.email, firstname: c.firstName, lastname: c.lastName, phone: c.phone || '' } }));
        const response = await client.crm.contacts.batchApi.create({ inputs });
        return {
          success: true,
          data: { synced: response.results.length, failed: contacts.length - response.results.length },
          mock: false,
          syncedAt: new Date().toISOString()
        };
      }
      return { success: true, data: { synced: contacts.length, failed: 0 }, mock: true, syncedAt: new Date().toISOString() };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[HubSpotProvider] syncContacts error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !HubSpotProvider.isConfigured(), syncedAt: new Date().toISOString() };
    }
  }

  async syncDeals(
    deals: Array<{ name: string; amount: number; stage: string; closeDate: string }>
  ): Promise<HubSpotSyncResult<{ synced: number; failed: number }>> {
    try {
      const client = this.getClient();
      if (client) {
        const inputs = deals.map(d => ({ properties: { dealname: d.name, amount: String(d.amount), dealstage: d.stage, closedate: d.closeDate } }));
        const response = await client.crm.deals.batchApi.create({ inputs });
        return {
          success: true,
          data: { synced: response.results.length, failed: deals.length - response.results.length },
          mock: false,
          syncedAt: new Date().toISOString()
        };
      }
      return { success: true, data: { synced: deals.length, failed: 0 }, mock: true, syncedAt: new Date().toISOString() };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[HubSpotProvider] syncDeals error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !HubSpotProvider.isConfigured(), syncedAt: new Date().toISOString() };
    }
  }

  async syncCompanies(
    companies: Array<{ name: string; domain?: string; industry?: string }>
  ): Promise<HubSpotSyncResult<{ synced: number; failed: number }>> {
    try {
      const client = this.getClient();
      if (client) {
        const inputs = companies.map(c => ({ properties: { name: c.name, domain: c.domain || '', industry: c.industry || '' } }));
        const response = await client.crm.companies.batchApi.create({ inputs });
        return {
          success: true,
          data: { synced: response.results.length, failed: companies.length - response.results.length },
          mock: false,
          syncedAt: new Date().toISOString()
        };
      }
      return { success: true, data: { synced: companies.length, failed: 0 }, mock: true, syncedAt: new Date().toISOString() };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[HubSpotProvider] syncCompanies error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !HubSpotProvider.isConfigured(), syncedAt: new Date().toISOString() };
    }
  }

  async importFromHubspot(objectType: 'contacts' | 'deals' | 'companies', limit = 100): Promise<HubSpotSyncResult<HubSpotRecord[]>> {
    try {
      const client = this.getClient();
      if (client) {
        const apiMap: Record<string, unknown> = {
          contacts: client.crm.contacts,
          deals: client.crm.deals,
          companies: client.crm.companies
        };
        const response = await apiMap[objectType].basicApi.getPage(limit);
        const records: HubSpotRecord[] = response.results.map((r: any) => ({
          id: r.id,
          properties: r.properties,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }));
        return { success: true, data: records, mock: false, syncedAt: new Date().toISOString() };
      }
      const mockRecords: HubSpotRecord[] = [
        { id: 'hs_001', properties: { firstname: 'Mock', lastname: 'Contact', email: 'mock@example.com' } },
        { id: 'hs_002', properties: { firstname: 'Test', lastname: 'User', email: 'test@example.com' } }
      ];
      return { success: true, data: mockRecords, mock: true, syncedAt: new Date().toISOString() };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[HubSpotProvider] importFromHubspot error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !HubSpotProvider.isConfigured(), syncedAt: new Date().toISOString() };
    }
  }

  async exportToHubspot(
    objectType: 'contacts' | 'deals' | 'companies',
    records: Array<Record<string, unknown>>
  ): Promise<HubSpotSyncResult<{ exported: number; failed: number }>> {
    try {
      const client = this.getClient();
      if (client) {
        const inputs = records.map(r => ({ properties: r }));
        const apiMap: Record<string, unknown> = {
          contacts: client.crm.contacts,
          deals: client.crm.deals,
          companies: client.crm.companies
        };
        const response = await apiMap[objectType].batchApi.create({ inputs });
        return {
          success: true,
          data: { exported: response.results.length, failed: records.length - response.results.length },
          mock: false,
          syncedAt: new Date().toISOString()
        };
      }
      return { success: true, data: { exported: records.length, failed: 0 }, mock: true, syncedAt: new Date().toISOString() };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[HubSpotProvider] exportToHubspot error:', errMsg);
      return { success: false, data: null, error: errMsg, mock: !HubSpotProvider.isConfigured(), syncedAt: new Date().toISOString() };
    }
  }
}

export default new HubSpotProvider();
