import { defineStore } from 'pinia';
import type { Client } from '~/types/models';
import type { ApiListParams } from '~/types/api';
import type { ClientIndustry } from '~/types/enums';
import logger from '~/utils/logger'

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const useClientStore = defineStore('clients', {
  state: () => ({
    clients: [] as Client[],
    currentClient: null as Client | null,
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
    activeClients(): Client[] {
      return this.clients.filter(c => c.clientStatus === 'ACTIVE');
    },

    clientsByIndustry(): Record<ClientIndustry, Client[]> {
      const grouped = {} as Record<ClientIndustry, Client[]>;
      for (const client of this.clients) {
        if (client.industry) {
          if (!grouped[client.industry]) {
            grouped[client.industry] = [];
          }
          grouped[client.industry].push(client);
        }
      }
      return grouped;
    }
  },

  actions: {
    async fetchClients(params?: ApiListParams) {
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

        const response = await useApiFetch(`client${query}`);

        if (response.success && response.body) {
          this.clients = response.body.docs || [];
          if (response.body.pagination) {
            this.pagination = response.body.pagination;
          }
        } else {
          this.error = response.message || 'Failed to fetch clients';
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch clients';
        this.error = message;
        logger.error('Error fetching clients:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchClient(id: string) {
      this.loading = true;
      this.error = null;

      try {
        const response = await useApiFetch(`client/${id}`);

        if (response.success && response.body) {
          this.currentClient = response.body;
        } else {
          this.error = response.message || 'Failed to fetch client';
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch client';
        this.error = message;
        logger.error('Error fetching client:', error);
      } finally {
        this.loading = false;
      }
    },

    async createClient(data: Partial<Client>) {
      this.loading = true;
      this.error = null;

      try {
        const response = await useApiFetch('client', 'POST', data as Record<string, unknown>);

        if (response.success && response.body) {
          this.clients.unshift(response.body);
          return response.body;
        } else {
          this.error = response.message || 'Failed to create client';
          return null;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create client';
        this.error = message;
        logger.error('Error creating client:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async updateClient(id: string, data: Partial<Client>) {
      this.loading = true;
      this.error = null;

      try {
        const response = await useApiFetch(`client/${id}`, 'PUT', data as Record<string, unknown>);

        if (response.success && response.body) {
          const index = this.clients.findIndex(c => c.id === id);
          if (index !== -1) {
            this.clients[index] = response.body;
          }
          if (this.currentClient?.id === id) {
            this.currentClient = response.body;
          }
          return response.body;
        } else {
          this.error = response.message || 'Failed to update client';
          return null;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update client';
        this.error = message;
        logger.error('Error updating client:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    async deleteClient(id: string) {
      this.loading = true;
      this.error = null;

      try {
        const response = await useApiFetch(`client/${id}`, 'DELETE');

        if (response.success) {
          this.clients = this.clients.filter(c => c.id !== id);
          if (this.currentClient?.id === id) {
            this.currentClient = null;
          }
          return true;
        } else {
          this.error = response.message || 'Failed to delete client';
          return false;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to delete client';
        this.error = message;
        logger.error('Error deleting client:', error);
        return false;
      } finally {
        this.loading = false;
      }
    }
  }
});
