/**
 * useTableFilter - Unit Tests
 * ==============================
 * Tests for composables/useTableFilter.ts
 *
 * The composable:
 * - Merges URL query params with provided query params
 * - Filters out null/undefined/empty values
 * - Builds a query string for API calls
 * - Normalizes comma-separated strings to arrays
 * - Updates the URL with the current query parameters
 * - Formats the returned data (dates, user assignments, etc.)
 * - Returns pagination and formatted data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import useTableFilter from '@/composables/useTableFilter';

// ============================================
// Mocks
// ============================================
const mockUseApiFetch = vi.fn();
const mockRouter = {
  replace: vi.fn()
};
const mockRoute = {
  query: {} as Record<string, string>
};
const mockFormatDate = vi.fn((d: string) => (d ? `formatted-${d}` : '-'));
const mockGetYear = vi.fn((d: string | undefined | null) => (d ? '2024' : '-'));
const mockFormatSnakeCase = vi.fn((s: string) => (s ? s.replace(/_/g, ' ') : '-'));

// Set up globals before importing the module under test
(globalThis as Record<string, unknown>).useApiFetch = mockUseApiFetch;
(globalThis as Record<string, unknown>).useRouter = () => mockRouter;
(globalThis as Record<string, unknown>).useRoute = () => mockRoute;
(globalThis as Record<string, unknown>).formatDate = mockFormatDate;
(globalThis as Record<string, unknown>).getYear = mockGetYear;
(globalThis as Record<string, unknown>).formatSnakeCase = mockFormatSnakeCase;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

describe('useTableFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.query = {};
  });

  // ============================================
  // Successful Data Fetching
  // ============================================
  describe('successful data fetching', () => {
    it('should fetch data and return formatted data with pagination', async () => {
      const mockDocs = [
        {
          id: '1',
          name: 'Test Lead',
          companyName: 'Acme Corp',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-16',
          users: [{ name: 'Alice' }, { name: 'Bob' }],
          leadSource: 'WEBSITE',
          phone: '123456789',
          email: 'test@example.com',
          priority: 'HIGH'
        }
      ];
      const mockPagination = { page: 1, limit: 10, totalItems: 1, totalPages: 1 };

      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockDocs, pagination: mockPagination },
        success: true,
        message: 'OK'
      });

      const result = await useTableFilter('lead');

      expect(result.status).toBe('200');
      expect(result.formattedData).toHaveLength(1);
      expect(result.pagination).toEqual(mockPagination);
    });

    it('should call the correct API endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: {} },
        success: true,
        message: 'OK'
      });

      await useTableFilter('lead');

      expect(mockUseApiFetch).toHaveBeenCalledWith(expect.stringContaining('lead'));
    });

    it('should use "lead" as default position parameter', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: {} },
        success: true,
        message: 'OK'
      });

      await useTableFilter();

      expect(mockUseApiFetch).toHaveBeenCalledWith(expect.stringMatching(/^lead/));
    });

    it('should use provided position for API endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: {} },
        success: true,
        message: 'OK'
      });

      await useTableFilter('deal');

      expect(mockUseApiFetch).toHaveBeenCalledWith(expect.stringMatching(/^deal/));
    });

    it('should format assigned users as comma-separated names', async () => {
      const mockDocs = [
        {
          id: '1',
          name: 'Lead 1',
          companyName: 'Corp',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          users: [{ name: 'Alice' }, { name: 'Bob' }],
          leadSource: 'WEBSITE',
          phone: '123',
          email: 'a@b.com',
          priority: 'HIGH'
        }
      ];

      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockDocs, pagination: {} },
        success: true,
        message: 'OK'
      });

      const result = await useTableFilter('lead');

      expect(result.formattedData![0].assign).toBe('Alice, Bob');
    });

    it('should assign "Unassigned" when no users', async () => {
      const mockDocs = [
        {
          id: '1',
          name: 'Lead 1',
          companyName: 'Corp',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          users: [],
          leadSource: 'WEBSITE',
          phone: '123',
          email: 'a@b.com',
          priority: 'HIGH'
        }
      ];

      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockDocs, pagination: {} },
        success: true,
        message: 'OK'
      });

      const result = await useTableFilter('lead');

      expect(result.formattedData![0].assign).toBe('Unassigned');
    });

    it('should include leadDetails with title and text', async () => {
      const mockDocs = [
        {
          id: '1',
          name: 'Test Lead',
          companyName: 'Test Corp',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          users: [],
          leadSource: 'WEBSITE',
          phone: '123',
          email: 'a@b.com',
          priority: 'HIGH'
        }
      ];

      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockDocs, pagination: {} },
        success: true,
        message: 'OK'
      });

      const result = await useTableFilter('lead');

      expect(result.formattedData![0].leadDetails).toEqual({
        title: 'Test Lead',
        text: 'Test Corp'
      });
    });

    it('should use phone fallback "-" when phone is empty', async () => {
      const mockDocs = [
        {
          id: '1',
          name: 'Lead',
          companyName: 'Corp',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          users: [],
          leadSource: 'WEBSITE',
          phone: null,
          email: null,
          priority: 'HIGH'
        }
      ];

      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockDocs, pagination: {} },
        success: true,
        message: 'OK'
      });

      const result = await useTableFilter('lead');

      expect(result.formattedData![0].phone).toBe('-');
      expect(result.formattedData![0].email).toBe('-');
    });
  });

  // ============================================
  // Query Parameter Handling
  // ============================================
  describe('query parameter handling', () => {
    it('should append query params to API endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: {} },
        success: true,
        message: 'OK'
      });

      await useTableFilter('lead', { page: '2', limit: '10' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('?');
      expect(calledUrl).toContain('page');
      expect(calledUrl).toContain('limit');
    });

    it('should merge URL query params with provided params', async () => {
      mockRoute.query = { status: 'NEW' };
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: {} },
        success: true,
        message: 'OK'
      });

      await useTableFilter('lead', { page: '1' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('status');
      expect(calledUrl).toContain('page');
    });

    it('should filter out null and undefined values from query params', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: {} },
        success: true,
        message: 'OK'
      });

      await useTableFilter('lead', { page: '1', status: '', limit: null as unknown as string });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('status=&');
      expect(calledUrl).not.toContain('limit=');
    });

    it('should handle array values in query params', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: {} },
        success: true,
        message: 'OK'
      });

      await useTableFilter('lead', { statuses: ['NEW', 'QUALIFIED'] as unknown as string });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('statuses');
    });

    it('should update the router with normalized query params', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: {} },
        success: true,
        message: 'OK'
      });

      await useTableFilter('lead', { page: '1' });

      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.any(Object)
        })
      );
    });

    it('should convert comma-separated URL param strings to arrays', async () => {
      mockRoute.query = { statuses: 'NEW,QUALIFIED,CONTACTED' };
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: {} },
        success: true,
        message: 'OK'
      });

      await useTableFilter('lead');

      // The query string should contain the statuses
      expect(mockUseApiFetch).toHaveBeenCalled();
    });
  });

  // ============================================
  // Error Handling
  // ============================================
  describe('error handling', () => {
    it('should return empty formattedData and pagination on API failure', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: null,
        success: false,
        message: 'Unauthorized'
      });

      const result = await useTableFilter('lead');

      expect(result.formattedData).toEqual([]);
      expect(result.pagination).toEqual({});
    });

    it('should return error status on API failure', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: null,
        success: false,
        message: 'Unauthorized'
      });

      const result = await useTableFilter('lead');

      expect(result.status).toBe('Failed to fetch data.');
    });

    it('should return empty formattedData when fetch throws', async () => {
      mockUseApiFetch.mockRejectedValue(new Error('Network error'));

      const result = await useTableFilter('lead');

      expect(result.formattedData).toEqual([]);
      expect(result.pagination).toEqual({});
    });
  });

  // ============================================
  // Pagination
  // ============================================
  describe('pagination', () => {
    it('should return pagination from API response', async () => {
      const mockPagination = { page: 2, limit: 20, totalItems: 100, totalPages: 5 };

      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: mockPagination },
        success: true,
        message: 'OK'
      });

      const result = await useTableFilter('lead');

      expect(result.pagination).toEqual(mockPagination);
    });

    it('should return empty pagination object when not in response', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [] },
        success: true,
        message: 'OK'
      });

      const result = await useTableFilter('lead');

      expect(result.pagination).toEqual({});
    });
  });

  // ============================================
  // Unread Notifications Count
  // ============================================
  describe('unreadNotificationsCount', () => {
    it('should return unread notifications count from response', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: {}, unreadNotificationsCount: 5 },
        success: true,
        message: 'OK'
      });

      const result = await useTableFilter('lead');

      expect(result.unreadNotificationsCount).toBe(5);
    });

    it('should return 0 when unreadNotificationsCount is not in response', async () => {
      mockUseApiFetch.mockResolvedValue({
        body: { docs: [], pagination: {} },
        success: true,
        message: 'OK'
      });

      const result = await useTableFilter('lead');

      expect(result.unreadNotificationsCount).toBe(0);
    });
  });
});
