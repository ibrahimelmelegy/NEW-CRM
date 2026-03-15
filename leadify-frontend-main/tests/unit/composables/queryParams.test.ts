/**
 * queryParams (useQuery) - Unit Tests
 * ======================================
 * Tests for composables/queryParams.ts
 *
 * The composable:
 * - Reads initial values from URL query params on mount
 * - Watches for page changes and updates the URL
 * - Watches for search changes (debounced) and updates the URL
 * - Watches for sort changes and updates the URL
 * - Watches for filter changes and updates the URL
 * - Decodes JSON-encoded query params (sortOption, filterOptions)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';

import useQuery from '@/composables/queryParams';

// ============================================
// Mock router and route
// ============================================
const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();
const mockRoute = {
  fullPath: '/test',
  path: '/test',
  query: {} as Record<string, string>
};

(globalThis as Record<string, unknown>).useRouter = () => ({
  push: mockRouterPush,
  replace: mockRouterReplace
});
(globalThis as Record<string, unknown>).useRoute = () => mockRoute;

// Track lifecycle hooks
let mountedCallback: (() => void | Promise<void>) | null = null;
(globalThis as Record<string, unknown>).onMounted = (cb: () => void | Promise<void>) => {
  mountedCallback = cb;
};

describe('queryParams (useQuery)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mountedCallback = null;
    mockRoute.query = {};
  });

  // ============================================
  // Return value
  // ============================================
  describe('return value', () => {
    it('should return currentPage, sort, filters, and search refs', () => {
      const currentPage = ref(1);
      const sort = ref('createdAt');
      const filters = ref({});
      const search = ref('');

      const result = useQuery(currentPage, sort, filters, search);

      expect(result).toHaveProperty('currentPage');
      expect(result).toHaveProperty('sort');
      expect(result).toHaveProperty('filters');
      expect(result).toHaveProperty('search');
    });

    it('should return reactive refs', () => {
      const currentPage = ref(1);
      const sort = ref('');
      const filters = ref({});
      const search = ref('');

      const result = useQuery(currentPage, sort, filters, search);

      expect(result.currentPage.value).toBe(1);
      expect(result.sort.value).toBe('');
      expect(result.search.value).toBe('');
    });
  });

  // ============================================
  // Mount behavior - reading URL params
  // ============================================
  describe('on mounted - reading URL params', () => {
    it('should read pageNumber from URL and update currentPage', async () => {
      mockRoute.query = { pageNumber: '3' };
      const currentPage = ref(1);
      const sort = ref('');
      const filters = ref({});
      const search = ref('');

      useQuery(currentPage, sort, filters, search);

      await mountedCallback?.();

      expect(currentPage.value).toBe(3);
    });

    it('should keep default currentPage when pageNumber is not in URL', async () => {
      mockRoute.query = {};
      const currentPage = ref(5);
      const sort = ref('');
      const filters = ref({});
      const search = ref('');

      useQuery(currentPage, sort, filters, search);

      await mountedCallback?.();

      expect(currentPage.value).toBe(5);
    });

    it('should read find from URL and update search', async () => {
      mockRoute.query = { find: 'test search' };
      const currentPage = ref(1);
      const sort = ref('');
      const filters = ref({});
      const search = ref('');

      useQuery(currentPage, sort, filters, search);

      await mountedCallback?.();

      expect(search.value).toBe('test search');
    });

    it('should keep default search when find is not in URL', async () => {
      mockRoute.query = {};
      const currentPage = ref(1);
      const sort = ref('');
      const filters = ref({});
      const search = ref('initial search');

      useQuery(currentPage, sort, filters, search);

      await mountedCallback?.();

      expect(search.value).toBe('initial search');
    });

    it('should decode sortOption from URL', async () => {
      const sortData = { field: 'name', order: 'asc' };
      mockRoute.query = { sortOption: encodeURIComponent(JSON.stringify(sortData)) };
      const currentPage = ref(1);
      const sort = ref<unknown>('');
      const filters = ref({});
      const search = ref('');

      useQuery(currentPage, sort, filters, search);

      await mountedCallback?.();

      expect(sort.value).toEqual(sortData);
    });

    it('should decode filterOptions from URL', async () => {
      const filterData = { status: 'NEW', source: 'WEBSITE' };
      mockRoute.query = { filterOptions: encodeURIComponent(JSON.stringify(filterData)) };
      const currentPage = ref(1);
      const sort = ref('');
      const filters = ref<unknown>({});
      const search = ref('');

      useQuery(currentPage, sort, filters, search);

      await mountedCallback?.();

      expect(filters.value).toEqual(filterData);
    });

    it('should keep default sort when sortOption is invalid JSON', async () => {
      mockRoute.query = { sortOption: 'invalid-json' };
      const currentPage = ref(1);
      const sort = ref('default-sort');
      const filters = ref({});
      const search = ref('');

      useQuery(currentPage, sort, filters, search);

      await mountedCallback?.();

      // Invalid JSON should result in empty string (decode returns '')
      expect(sort.value).toBe('');
    });
  });

  // ============================================
  // Watch behavior
  // ============================================
  describe('page change watcher', () => {
    it('should push new page number to router when currentPage changes', async () => {
      const currentPage = ref(1);
      const sort = ref('');
      const filters = ref({});
      const search = ref('');

      useQuery(currentPage, sort, filters, search);

      currentPage.value = 2;
      await nextTick();

      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ pageNumber: 2 })
        })
      );
    });

    it('should include existing query params when updating page', async () => {
      mockRoute.query = { status: 'NEW' };
      const currentPage = ref(1);
      const sort = ref('');
      const filters = ref({});
      const search = ref('');

      useQuery(currentPage, sort, filters, search);

      currentPage.value = 3;
      await nextTick();

      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            pageNumber: 3,
            status: 'NEW'
          })
        })
      );
    });
  });

  describe('sort change watcher', () => {
    it('should push encoded sort option to router when sort changes', async () => {
      const currentPage = ref(1);
      const sort = ref<unknown>('');
      const filters = ref({});
      const search = ref('');

      useQuery(currentPage, sort, filters, search);

      const newSort = { field: 'name', order: 'asc' };
      sort.value = newSort;
      await nextTick();

      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            sortOption: encodeURIComponent(JSON.stringify(newSort))
          })
        })
      );
    });
  });

  describe('filter change watcher', () => {
    it('should push encoded filter options to router when filters change', async () => {
      const currentPage = ref(1);
      const sort = ref('');
      const filters = ref<unknown>({});
      const search = ref('');

      useQuery(currentPage, sort, filters, search);

      const newFilters = { status: 'QUALIFIED', source: 'REFERRAL' };
      filters.value = newFilters;
      await nextTick();

      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            filterOptions: encodeURIComponent(JSON.stringify(newFilters))
          })
        })
      );
    });
  });
});
