import { defineStore } from 'pinia';
import type { Lead } from '~/types/models';
import type { ApiListParams } from '~/types/api';
import type { LeadStatus } from '~/types/enums';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const useLeadStore = defineStore('leads', {
  state: () => ({
    leads: [] as Lead[],
    currentLead: null as Lead | null,
    loading: false,
    error: null as string | null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    } as Pagination
  }),

  getters: {
    leadsByStatus(): Record<LeadStatus, Lead[]> {
      const grouped = {} as Record<LeadStatus, Lead[]>;
      for (const lead of this.leads) {
        if (!grouped[lead.status]) {
          grouped[lead.status] = [];
        }
        grouped[lead.status].push(lead);
      }
      return grouped;
    },

    totalLeads(): number {
      return this.pagination.total;
    }
  },

  actions: {
    async fetchLeads(params?: ApiListParams) {
      this.loading = true;
      this.error = null;

      try {
        const query = params
          ? '?' +
            new URLSearchParams(
              Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== '')
                .map(([k, v]) => [k, String(v)])
            ).toString()
          : '';

        const response: any = await useApiFetch(`lead${query}`);

        if (response.success && response.body) {
          this.leads = response.body.docs || [];
          if (response.body.pagination) {
            this.pagination = response.body.pagination;
          }
        } else {
          this.error = response.message || 'Failed to fetch leads';
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch leads';
        this.error = message;
        console.error('Error fetching leads:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchLead(id: string) {
      this.loading = true;
      this.error = null;

      try {
        const response: any = await useApiFetch(`lead/${id}`);

        if (response.success && response.body) {
          this.currentLead = response.body;
        } else {
          this.error = response.message || 'Failed to fetch lead';
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch lead';
        this.error = message;
        console.error('Error fetching lead:', error);
      } finally {
        this.loading = false;
      }
    },

    async createLead(data: Partial<Lead>) {
      this.loading = true;
      this.error = null;

      try {
        const response: any = await useApiFetch('lead', 'POST', data as Record<string, unknown>);

        if (response.success && response.body) {
          this.leads.unshift(response.body);
          return response.body;
        } else {
          this.error = response.message || 'Failed to create lead';
          return null;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create lead';
        this.error = message;
        console.error('Error creating lead:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async updateLead(id: string, data: Partial<Lead>) {
      this.loading = true;
      this.error = null;

      try {
        const response: any = await useApiFetch(`lead/${id}`, 'PUT', data as Record<string, unknown>);

        if (response.success && response.body) {
          const index = this.leads.findIndex(l => l.id === id);
          if (index !== -1) {
            this.leads[index] = response.body;
          }
          if (this.currentLead?.id === id) {
            this.currentLead = response.body;
          }
          return response.body;
        } else {
          this.error = response.message || 'Failed to update lead';
          return null;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update lead';
        this.error = message;
        console.error('Error updating lead:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async deleteLead(id: string) {
      this.loading = true;
      this.error = null;

      try {
        const response = await useApiFetch(`lead/${id}`, 'DELETE');

        if (response.success) {
          this.leads = this.leads.filter(l => l.id !== id);
          if (this.currentLead?.id === id) {
            this.currentLead = null;
          }
          return true;
        } else {
          this.error = response.message || 'Failed to delete lead';
          return false;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to delete lead';
        this.error = message;
        console.error('Error deleting lead:', error);
        return false;
      } finally {
        this.loading = false;
      }
    }
  }
});
