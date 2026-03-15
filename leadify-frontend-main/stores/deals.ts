import { defineStore } from 'pinia';
import type { Deal } from '~/types/models';
import type { ApiListParams } from '~/types/api';
import type { DealStage } from '~/types/enums';
import logger from '~/utils/logger';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const useDealStore = defineStore('deals', {
  state: () => ({
    deals: [] as Deal[],
    currentDeal: null as Deal | null,
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
    dealsByStage(): Record<DealStage, Deal[]> {
      const grouped = {} as Record<DealStage, Deal[]>;
      for (const deal of this.deals) {
        if (!grouped[deal.stage]) {
          grouped[deal.stage] = [];
        }
        grouped[deal.stage].push(deal);
      }
      return grouped;
    },

    totalDeals(): number {
      return this.pagination.total;
    },

    totalValue(): number {
      return this.deals.reduce((sum, deal) => sum + (deal.price || 0), 0);
    }
  },

  actions: {
    async fetchDeals(params?: ApiListParams) {
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

        const response = await useApiFetch(`deal${query}`);

        if (response.success && response.body) {
          this.deals = response.body.docs || [];
          if (response.body.pagination) {
            this.pagination = response.body.pagination;
          }
        } else {
          this.error = response.message || 'Failed to fetch deals';
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch deals';
        this.error = message;
        logger.error('Error fetching deals:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchDeal(id: string) {
      this.loading = true;
      this.error = null;

      try {
        const response = await useApiFetch(`deal/${id}`);

        if (response.success && response.body) {
          this.currentDeal = response.body;
        } else {
          this.error = response.message || 'Failed to fetch deal';
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch deal';
        this.error = message;
        logger.error('Error fetching deal:', error);
      } finally {
        this.loading = false;
      }
    },

    async createDeal(data: Partial<Deal>) {
      this.loading = true;
      this.error = null;

      try {
        const response = await useApiFetch('deal', 'POST', data as Record<string, unknown>);

        if (response.success && response.body) {
          this.deals.unshift(response.body);
          return response.body;
        } else {
          this.error = response.message || 'Failed to create deal';
          return null;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create deal';
        this.error = message;
        logger.error('Error creating deal:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async updateDeal(id: string, data: Partial<Deal>) {
      this.loading = true;
      this.error = null;

      try {
        const response = await useApiFetch(`deal/${id}`, 'PUT', data as Record<string, unknown>);

        if (response.success && response.body) {
          const index = this.deals.findIndex(d => d.id === id);
          if (index !== -1) {
            this.deals[index] = response.body;
          }
          if (this.currentDeal?.id === id) {
            this.currentDeal = response.body;
          }
          return response.body;
        } else {
          this.error = response.message || 'Failed to update deal';
          return null;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update deal';
        this.error = message;
        logger.error('Error updating deal:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async deleteDeal(id: string) {
      this.loading = true;
      this.error = null;

      try {
        const response = await useApiFetch(`deal/${id}`, 'DELETE');

        if (response.success) {
          this.deals = this.deals.filter(d => d.id !== id);
          if (this.currentDeal?.id === id) {
            this.currentDeal = null;
          }
          return true;
        } else {
          this.error = response.message || 'Failed to delete deal';
          return false;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to delete deal';
        this.error = message;
        logger.error('Error deleting deal:', error);
        return false;
      } finally {
        this.loading = false;
      }
    }
  }
});
