import { defineStore } from 'pinia';
import type { Opportunity } from '~/types/models';
import type { ApiListParams } from '~/types/api';
import type { OpportunityStage } from '~/types/enums';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const useOpportunityStore = defineStore('opportunities', {
  state: () => ({
    opportunities: [] as Opportunity[],
    currentOpportunity: null as Opportunity | null,
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
    opportunitiesByStage(): Record<OpportunityStage, Opportunity[]> {
      const grouped = {} as Record<OpportunityStage, Opportunity[]>;
      for (const opp of this.opportunities) {
        if (!grouped[opp.stage]) {
          grouped[opp.stage] = [];
        }
        grouped[opp.stage].push(opp);
      }
      return grouped;
    },

    totalEstimatedValue(): number {
      return this.opportunities.reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0);
    }
  },

  actions: {
    async fetchOpportunities(params?: ApiListParams) {
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

        const response: any = await useApiFetch(`opportunity${query}`);

        if (response.success && response.body) {
          this.opportunities = response.body.docs || [];
          if (response.body.pagination) {
            this.pagination = response.body.pagination;
          }
        } else {
          this.error = response.message || 'Failed to fetch opportunities';
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch opportunities';
        this.error = message;
        console.error('Error fetching opportunities:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchOpportunity(id: string) {
      this.loading = true;
      this.error = null;

      try {
        const response: any = await useApiFetch(`opportunity/${id}`);

        if (response.success && response.body) {
          this.currentOpportunity = response.body;
        } else {
          this.error = response.message || 'Failed to fetch opportunity';
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch opportunity';
        this.error = message;
        console.error('Error fetching opportunity:', error);
      } finally {
        this.loading = false;
      }
    },

    async createOpportunity(data: Partial<Opportunity>) {
      this.loading = true;
      this.error = null;

      try {
        const response: any = await useApiFetch('opportunity', 'POST', data as Record<string, unknown>);

        if (response.success && response.body) {
          this.opportunities.unshift(response.body);
          return response.body;
        } else {
          this.error = response.message || 'Failed to create opportunity';
          return null;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create opportunity';
        this.error = message;
        console.error('Error creating opportunity:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async updateOpportunity(id: string, data: Partial<Opportunity>) {
      this.loading = true;
      this.error = null;

      try {
        const response: any = await useApiFetch(`opportunity/${id}`, 'PUT', data as Record<string, unknown>);

        if (response.success && response.body) {
          const index = this.opportunities.findIndex(o => o.id === id);
          if (index !== -1) {
            this.opportunities[index] = response.body;
          }
          if (this.currentOpportunity?.id === id) {
            this.currentOpportunity = response.body;
          }
          return response.body;
        } else {
          this.error = response.message || 'Failed to update opportunity';
          return null;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update opportunity';
        this.error = message;
        console.error('Error updating opportunity:', error);
        return null;
      } finally {
        this.loading = false;
      }
    }
  }
});
