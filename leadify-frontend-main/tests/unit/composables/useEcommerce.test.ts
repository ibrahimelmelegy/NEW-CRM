/**
 * useEcommerce - Unit Tests
 * ===========================
 * Tests for composables/useEcommerce.ts
 *
 * The module provides:
 * - Category: fetchEcCategories, fetchEcCategoryTree, fetchEcCategoryById, createEcCategory, updateEcCategory, deleteEcCategory
 * - Coupon: fetchCoupons, fetchCouponById, validateCoupon, applyCoupon, createCoupon, updateCoupon, deleteCoupon
 * - Review: fetchReviews, fetchReviewById, approveReview, rejectReview, respondToReview, deleteReview
 * - Cart: fetchCarts, fetchCartById, fetchActiveCart, addCartItem, updateCartItem, removeCartItem, clearCart, convertCartToOrder
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  fetchEcCategories,
  fetchEcCategoryTree,
  fetchEcCategoryById,
  createEcCategory,
  updateEcCategory,
  deleteEcCategory,
  fetchCoupons,
  fetchCouponById,
  validateCoupon,
  applyCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  fetchReviews,
  fetchReviewById,
  approveReview,
  rejectReview,
  respondToReview,
  deleteReview,
  fetchCarts,
  fetchCartById,
  fetchActiveCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  convertCartToOrder,
  CouponTypeEnum,
  CouponStatusEnum,
  ReviewStatusEnum,
  CartStatusEnum,
  couponTypeOptions,
  reviewStatusOptions
} from '@/composables/useEcommerce';

const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

(globalThis as Record<string, unknown>).useApiFetch = (...args: unknown[]) => mockUseApiFetch(...args);

describe('useEcommerce', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Category API
  // ============================================
  describe('fetchEcCategories', () => {
    it('should fetch categories and return docs format', async () => {
      const mockDocs = [
        {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          sortOrder: 1,
          isActive: true,
          productCount: 50,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ];
      mockUseApiFetch.mockResolvedValue({
        body: { docs: mockDocs, pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 } },
        success: true
      });

      const result = await fetchEcCategories();

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/categories');
      expect(result.docs).toHaveLength(1);
    });

    it('should include query params', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchEcCategories({ isActive: 'true' });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('isActive=true');
    });

    it('should return empty docs on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchEcCategories();
      expect(result.docs).toEqual([]);
    });
  });

  describe('fetchEcCategoryTree', () => {
    it('should fetch category tree', async () => {
      const mockTree = [
        {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          sortOrder: 1,
          isActive: true,
          productCount: 50,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          children: []
        }
      ];
      mockUseApiFetch.mockResolvedValue({ body: mockTree, success: true });

      const result = await fetchEcCategoryTree();

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/categories/tree');
      expect(result).toHaveLength(1);
    });

    it('should return empty array on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchEcCategoryTree();
      expect(result).toEqual([]);
    });
  });

  describe('fetchEcCategoryById', () => {
    it('should return null on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchEcCategoryById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createEcCategory', () => {
    it('should call POST with category data', async () => {
      const data = { name: 'Books', slug: 'books', sortOrder: 2, isActive: true, productCount: 0 };
      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 'cat-2', ...data, createdAt: '2024-01-01', updatedAt: '2024-01-01' } });

      await createEcCategory(data);

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/categories', 'POST', data);
    });
  });

  // ============================================
  // Coupon API
  // ============================================
  describe('fetchCoupons', () => {
    it('should fetch coupons', async () => {
      const mockCoupon = {
        id: 'coup-1',
        code: 'SAVE10',
        type: CouponTypeEnum.PERCENTAGE,
        value: 10,
        minOrderAmount: 50,
        maxUses: 100,
        usedCount: 5,
        maxUsesPerCustomer: 1,
        status: CouponStatusEnum.ACTIVE,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };
      mockUseApiFetch.mockResolvedValue({ body: { docs: [mockCoupon], pagination: {} }, success: true });

      const result = await fetchCoupons();

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/coupons');
      expect(result.docs).toHaveLength(1);
    });

    it('should return empty docs on failure', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchCoupons();
      expect(result.docs).toEqual([]);
    });
  });

  describe('validateCoupon', () => {
    it('should call validate endpoint with code and amount', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { valid: true, discount: 10 } });

      await validateCoupon('SAVE10', 100);

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/coupons/validate', 'POST', { code: 'SAVE10', orderAmount: 100, productIds: undefined });
    });

    it('should include product IDs when provided', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { valid: true } });

      await validateCoupon('SAVE10', 100, ['prod-1', 'prod-2']);

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/coupons/validate', 'POST', {
        code: 'SAVE10',
        orderAmount: 100,
        productIds: ['prod-1', 'prod-2']
      });
    });
  });

  // ============================================
  // Review API
  // ============================================
  describe('fetchReviews', () => {
    it('should fetch reviews', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchReviews();

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/reviews');
    });

    it('should include query params for filtering', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchReviews({ status: ReviewStatusEnum.PENDING });

      const calledUrl = mockUseApiFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain(`status=${ReviewStatusEnum.PENDING}`);
    });
  });

  describe('approveReview', () => {
    it('should call approve endpoint with PATCH', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await approveReview('rev-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/reviews/rev-1/approve', 'PATCH');
    });
  });

  describe('rejectReview', () => {
    it('should call reject endpoint with PATCH', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await rejectReview('rev-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/reviews/rev-1/reject', 'PATCH');
    });
  });

  describe('respondToReview', () => {
    it('should call respond endpoint with merchant response', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await respondToReview('rev-1', 'Thank you for your feedback!');

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/reviews/rev-1/respond', 'PATCH', { response: 'Thank you for your feedback!' });
    });
  });

  // ============================================
  // Cart API
  // ============================================
  describe('fetchCarts', () => {
    it('should fetch all carts', async () => {
      mockUseApiFetch.mockResolvedValue({ body: { docs: [], pagination: {} }, success: true });

      await fetchCarts();

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/cart');
    });
  });

  describe('fetchActiveCart', () => {
    it('should fetch active cart for a client', async () => {
      const mockCart = {
        id: 'cart-1',
        clientId: 'client-1',
        status: CartStatusEnum.ACTIVE,
        currency: 'SAR',
        discountAmount: 0,
        items: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };
      mockUseApiFetch.mockResolvedValue({ body: mockCart, success: true });

      const result = await fetchActiveCart('client-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/cart/active/client-1');
      expect(result).toEqual(mockCart);
    });

    it('should return null when no active cart', async () => {
      mockUseApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchActiveCart('client-1');
      expect(result).toBeNull();
    });
  });

  describe('addCartItem', () => {
    it('should add item to cart', async () => {
      const payload = { productId: 'prod-1', quantity: 2 };
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await addCartItem('cart-1', payload);

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/cart/cart-1/items', 'POST', payload);
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await updateCartItem('item-1', { quantity: 3 });

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/cart/items/item-1', 'PUT', { quantity: 3 });
    });
  });

  describe('removeCartItem', () => {
    it('should delete a cart item', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await removeCartItem('item-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/cart/items/item-1', 'DELETE');
    });
  });

  describe('clearCart', () => {
    it('should clear all items from a cart', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await clearCart('cart-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/cart/cart-1/clear', 'DELETE');
    });
  });

  describe('convertCartToOrder', () => {
    it('should convert cart to order', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { orderId: 'order-1' } });

      await convertCartToOrder('cart-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('ecommerce/cart/cart-1/convert', 'POST');
    });
  });

  // ============================================
  // Constants
  // ============================================
  describe('constants', () => {
    it('should have correct coupon type options', () => {
      expect(couponTypeOptions).toHaveLength(3);
      const values = couponTypeOptions.map(o => o.value);
      expect(values).toContain(CouponTypeEnum.PERCENTAGE);
      expect(values).toContain(CouponTypeEnum.FIXED);
      expect(values).toContain(CouponTypeEnum.FREE_SHIPPING);
    });

    it('should have correct review status options', () => {
      expect(reviewStatusOptions).toHaveLength(3);
      const values = reviewStatusOptions.map(o => o.value);
      expect(values).toContain(ReviewStatusEnum.PENDING);
      expect(values).toContain(ReviewStatusEnum.APPROVED);
      expect(values).toContain(ReviewStatusEnum.REJECTED);
    });
  });
});
