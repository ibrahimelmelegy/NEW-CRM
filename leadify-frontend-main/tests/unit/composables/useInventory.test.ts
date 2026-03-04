/**
 * useInventory - Unit Tests
 * ===========================
 * Tests for composables/useInventory.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useInventory } from '~/composables/useInventory';

const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: any[]) => mockApiFetch(...args)
}));

describe('useInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchProducts
  // ============================================
  describe('fetchProducts', () => {
    it('should fetch products without params', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [] }, success: true });
      const { fetchProducts } = useInventory();

      await fetchProducts();

      expect(mockApiFetch).toHaveBeenCalledWith('inventory/products');
    });

    it('should fetch products with query params', async () => {
      mockApiFetch.mockResolvedValue({ body: { docs: [] }, success: true });
      const { fetchProducts } = useInventory();

      await fetchProducts({ category: 'electronics' });

      expect(mockApiFetch).toHaveBeenCalledWith('inventory/products?category=electronics');
    });
  });

  // ============================================
  // fetchProduct
  // ============================================
  describe('fetchProduct', () => {
    it('should fetch single product by id', async () => {
      mockApiFetch.mockResolvedValue({ body: { id: 1, name: 'Widget' }, success: true });
      const { fetchProduct } = useInventory();

      await fetchProduct(1);

      expect(mockApiFetch).toHaveBeenCalledWith('inventory/products/1');
    });
  });

  // ============================================
  // createProduct
  // ============================================
  describe('createProduct', () => {
    it('should POST product data', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const { createProduct } = useInventory();

      await createProduct({ name: 'New Widget', sku: 'WDG-001', price: 29.99 });

      expect(mockApiFetch).toHaveBeenCalledWith('inventory/products', 'POST', { name: 'New Widget', sku: 'WDG-001', price: 29.99 });
    });
  });

  // ============================================
  // updateProduct
  // ============================================
  describe('updateProduct', () => {
    it('should PUT product update', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const { updateProduct } = useInventory();

      await updateProduct(1, { name: 'Updated Widget' });

      expect(mockApiFetch).toHaveBeenCalledWith('inventory/products/1', 'PUT', { name: 'Updated Widget' });
    });
  });

  // ============================================
  // deleteProduct
  // ============================================
  describe('deleteProduct', () => {
    it('should DELETE product by id', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const { deleteProduct } = useInventory();

      await deleteProduct(1);

      expect(mockApiFetch).toHaveBeenCalledWith('inventory/products/1', 'DELETE');
    });
  });

  // ============================================
  // fetchLowStock
  // ============================================
  describe('fetchLowStock', () => {
    it('should fetch low-stock products', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });
      const { fetchLowStock } = useInventory();

      await fetchLowStock();

      expect(mockApiFetch).toHaveBeenCalledWith('inventory/products/low-stock');
    });
  });

  // ============================================
  // fetchCategories
  // ============================================
  describe('fetchCategories', () => {
    it('should fetch product categories', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });
      const { fetchCategories } = useInventory();

      await fetchCategories();

      expect(mockApiFetch).toHaveBeenCalledWith('inventory/products/categories');
    });
  });

  // ============================================
  // fetchWarehouses
  // ============================================
  describe('fetchWarehouses', () => {
    it('should fetch warehouses', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });
      const { fetchWarehouses } = useInventory();

      await fetchWarehouses();

      expect(mockApiFetch).toHaveBeenCalledWith('inventory/products/warehouses');
    });
  });

  // ============================================
  // fetchMovements
  // ============================================
  describe('fetchMovements', () => {
    it('should fetch movements for a product', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });
      const { fetchMovements } = useInventory();

      await fetchMovements(1);

      expect(mockApiFetch).toHaveBeenCalledWith('inventory/products/1/movements');
    });
  });

  // ============================================
  // addMovement
  // ============================================
  describe('addMovement', () => {
    it('should POST movement data', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const { addMovement } = useInventory();

      await addMovement({ productId: 1, type: 'IN', quantity: 50 });

      expect(mockApiFetch).toHaveBeenCalledWith('inventory/movements', 'POST', { productId: 1, type: 'IN', quantity: 50 });
    });
  });
});
