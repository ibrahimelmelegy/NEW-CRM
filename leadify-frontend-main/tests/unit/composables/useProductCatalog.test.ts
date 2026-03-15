/**
 * useProductCatalog - Unit Tests
 * ================================
 * Tests for composables/useProductCatalog.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Mock useApiFetch
// ============================================
const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

import {
  fetchProducts,
  fetchProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchQuoteLines,
  addQuoteLine,
  updateQuoteLine,
  removeQuoteLine,
  fetchLowStockProducts,
  updateProductStock,
  bulkImportProducts,
  fetchProductAnalytics,
  type CatalogProduct,
  type QuoteLine
} from '@/composables/useProductCatalog';

const mockProduct = (overrides: Partial<CatalogProduct> = {}): CatalogProduct => ({
  id: 'prod-1',
  name: 'Test Product',
  unitPrice: 99.99,
  currency: 'USD',
  isActive: true,
  ...overrides
});

describe('useProductCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchProducts
  // ============================================
  describe('fetchProducts', () => {
    it('should fetch products from correct endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchProducts();

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/products');
    });

    it('should append query params when provided', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchProducts({ category: 'electronics', isActive: 'true' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('catalog/products?');
      expect(calledUrl).toContain('category=electronics');
    });

    it('should return products and pagination', async () => {
      const products = [mockProduct()];
      const pagination = { page: 1, limit: 20, totalItems: 1, totalPages: 1 };

      mockUseApiFetch.mockResolvedValue({ body: { docs: products, pagination }, success: true });

      const result = await fetchProducts();

      expect(result.docs).toEqual(products);
      expect(result.pagination).toEqual(pagination);
    });

    it('should return empty docs when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchProducts();

      expect(result.docs).toEqual([]);
    });
  });

  // ============================================
  // fetchProductById
  // ============================================
  describe('fetchProductById', () => {
    it('should fetch product by ID', async () => {
      const product = mockProduct({ id: 'prod-123' });
      mockUseApiFetch.mockResolvedValue({ body: product, success: true });

      const result = await fetchProductById('prod-123');

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/products/prod-123');
      expect(result).toEqual(product);
    });

    it('should return null when product not found', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchProductById('prod-999');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // createProduct
  // ============================================
  describe('createProduct', () => {
    it('should create product with POST method', async () => {
      const newProduct: Partial<CatalogProduct> = {
        name: 'New Product',
        unitPrice: 49.99,
        currency: 'USD',
        isActive: true
      };

      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 'prod-new', ...newProduct } });

      await createProduct(newProduct);

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/products', 'POST', newProduct);
    });
  });

  // ============================================
  // updateProduct
  // ============================================
  describe('updateProduct', () => {
    it('should update product with PUT method and ID', async () => {
      const updateData = { unitPrice: 79.99, isActive: false };
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await updateProduct('prod-1', updateData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/products/prod-1', 'PUT', updateData);
    });
  });

  // ============================================
  // deleteProduct
  // ============================================
  describe('deleteProduct', () => {
    it('should delete product with DELETE method', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await deleteProduct('prod-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/products/prod-1', 'DELETE');
    });
  });

  // ============================================
  // fetchQuoteLines
  // ============================================
  describe('fetchQuoteLines', () => {
    it('should fetch quote lines for specific quote', async () => {
      const mockLines: QuoteLine[] = [
        {
          id: 'line-1',
          quoteId: 'quote-1',
          productId: 'prod-1',
          quantity: 2,
          unitPrice: 99.99,
          discount: 0,
          total: 199.98
        }
      ];

      mockUseApiFetch.mockResolvedValue({ body: { docs: mockLines }, success: true });

      const result = await fetchQuoteLines('quote-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/quotes/quote-1/lines');
      expect(result).toEqual(mockLines);
    });

    it('should return empty array when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchQuoteLines('quote-99');

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // addQuoteLine
  // ============================================
  describe('addQuoteLine', () => {
    it('should add quote line with POST method', async () => {
      const newLine: Partial<QuoteLine> = {
        quoteId: 'quote-1',
        productId: 'prod-1',
        quantity: 3,
        unitPrice: 99.99,
        discount: 10,
        total: 269.97
      };

      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 'line-new', ...newLine } });

      await addQuoteLine(newLine);

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/quotes/lines', 'POST', newLine);
    });
  });

  // ============================================
  // updateQuoteLine
  // ============================================
  describe('updateQuoteLine', () => {
    it('should update quote line with PUT method', async () => {
      const updateData = { quantity: 5, total: 449.95 };
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await updateQuoteLine('line-1', updateData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/quotes/lines/line-1', 'PUT', updateData);
    });
  });

  // ============================================
  // removeQuoteLine
  // ============================================
  describe('removeQuoteLine', () => {
    it('should remove quote line with DELETE method', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await removeQuoteLine('line-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/quotes/lines/line-1', 'DELETE');
    });
  });

  // ============================================
  // fetchLowStockProducts
  // ============================================
  describe('fetchLowStockProducts', () => {
    it('should fetch low stock products', async () => {
      const products = [mockProduct({ stockQuantity: 2, lowStockThreshold: 5 })];
      mockUseApiFetch.mockResolvedValue({ body: { docs: products, pagination: {} }, success: true });

      const result = await fetchLowStockProducts();

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/products/low-stock');
      expect(result.docs).toEqual(products);
    });

    it('should return empty docs when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchLowStockProducts();

      expect(result.docs).toEqual([]);
    });
  });

  // ============================================
  // updateProductStock
  // ============================================
  describe('updateProductStock', () => {
    it('should update stock with default set operation', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await updateProductStock('prod-1', 100);

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/products/prod-1/stock', 'PATCH', {
        quantity: 100,
        operation: 'set'
      });
    });

    it('should update stock with add operation', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await updateProductStock('prod-1', 20, 'add');

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/products/prod-1/stock', 'PATCH', {
        quantity: 20,
        operation: 'add'
      });
    });

    it('should update stock with subtract operation', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await updateProductStock('prod-1', 5, 'subtract');

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/products/prod-1/stock', 'PATCH', {
        quantity: 5,
        operation: 'subtract'
      });
    });
  });

  // ============================================
  // bulkImportProducts
  // ============================================
  describe('bulkImportProducts', () => {
    it('should bulk import products with POST method', async () => {
      const products = [
        { name: 'Product A', unitPrice: 10, currency: 'USD', isActive: true },
        { name: 'Product B', unitPrice: 20, currency: 'USD', isActive: true }
      ];

      mockUseApiFetch.mockResolvedValue({ success: true, body: { imported: 2 } });

      await bulkImportProducts(products);

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/products/bulk-import', 'POST', { products });
    });
  });

  // ============================================
  // fetchProductAnalytics
  // ============================================
  describe('fetchProductAnalytics', () => {
    it('should fetch product analytics', async () => {
      const mockAnalytics = { topSellingProducts: [], revenue: 0 };
      mockUseApiFetch.mockResolvedValue({ body: mockAnalytics, success: true });

      const result = await fetchProductAnalytics();

      expect(mockUseApiFetch).toHaveBeenCalledWith('catalog/products/analytics');
      expect(result).toEqual(mockAnalytics);
    });

    it('should return null when API fails', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchProductAnalytics();

      expect(result).toBeNull();
    });
  });
});
