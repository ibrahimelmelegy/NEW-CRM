// E-Commerce Module Composable
// Provides API functions for categories, coupons, reviews, and carts

import { useApiFetch } from './useApiFetch';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EcCategory {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string
  parent?: EcCategory
  children?: EcCategory[]
  sortOrder: number
  isActive: boolean
  productCount: number
  createdAt: string
  updatedAt: string
}

export enum CouponTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  FREE_SHIPPING = 'FREE_SHIPPING'
}

export enum CouponStatusEnum {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED'
}

export interface EcCoupon {
  id: string
  code: string
  description?: string
  type: CouponTypeEnum
  value: number
  minOrderAmount: number
  maxDiscountAmount?: number
  maxUses: number
  usedCount: number
  maxUsesPerCustomer: number
  validFrom?: string
  validTo?: string
  status: CouponStatusEnum
  applicableProducts?: string[]
  applicableCategories?: string[]
  createdAt: string
  updatedAt: string
}

export enum ReviewStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface EcReview {
  id: string
  productId: string
  product?: any
  clientId: string
  client?: any
  rating: number
  title?: string
  comment?: string
  isVerifiedPurchase: boolean
  status: ReviewStatusEnum
  merchantResponse?: string
  respondedAt?: string
  createdAt: string
  updatedAt: string
}

export interface EcCartItem {
  id: string
  cartId: string
  productId: string
  product?: any
  quantity: number
  unitPrice: number
  notes?: string
}

export enum CartStatusEnum {
  ACTIVE = 'ACTIVE',
  ABANDONED = 'ABANDONED',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED'
}

export interface EcCart {
  id: string
  clientId: string
  client?: any
  status: CartStatusEnum
  currency: string
  couponCode?: string
  discountAmount: number
  notes?: string
  items: EcCartItem[]
  createdAt: string
  updatedAt: string
}

// Coupon type options for UI
export const couponTypeOptions = [
  { value: CouponTypeEnum.PERCENTAGE, label: 'Percentage' },
  { value: CouponTypeEnum.FIXED, label: 'Fixed Amount' },
  { value: CouponTypeEnum.FREE_SHIPPING, label: 'Free Shipping' }
]

export const couponStatusOptions = [
  { value: CouponStatusEnum.ACTIVE, label: 'Active' },
  { value: CouponStatusEnum.EXPIRED, label: 'Expired' },
  { value: CouponStatusEnum.DISABLED, label: 'Disabled' }
]

export const reviewStatusOptions = [
  { value: ReviewStatusEnum.PENDING, label: 'Pending' },
  { value: ReviewStatusEnum.APPROVED, label: 'Approved' },
  { value: ReviewStatusEnum.REJECTED, label: 'Rejected' }
]

export const cartStatusOptions = [
  { value: CartStatusEnum.ACTIVE, label: 'Active' },
  { value: CartStatusEnum.ABANDONED, label: 'Abandoned' },
  { value: CartStatusEnum.CONVERTED, label: 'Converted' },
  { value: CartStatusEnum.EXPIRED, label: 'Expired' }
]

// ─── Category API ───────────────────────────────────────────────────────────

export async function fetchEcCategories(query?: Record<string, string>) {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`ecommerce/categories${qs}`);
  if (success && body) {
    return body as { docs: EcCategory[]; pagination: any };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchEcCategoryTree() {
  const { body, success } = await useApiFetch('ecommerce/categories/tree');
  if (success && body) {
    return body as EcCategory[];
  }
  return [];
}

export async function fetchEcCategoryById(id: string) {
  const { body, success } = await useApiFetch(`ecommerce/categories/${id}`);
  if (success && body) {
    return body as EcCategory;
  }
  return null;
}

export async function createEcCategory(data: Partial<EcCategory>) {
  return useApiFetch('ecommerce/categories', 'POST', data as Record<string, any>);
}

export async function updateEcCategory(id: string, data: Partial<EcCategory>) {
  return useApiFetch(`ecommerce/categories/${id}`, 'PUT', data as Record<string, any>);
}

export async function deleteEcCategory(id: string) {
  return useApiFetch(`ecommerce/categories/${id}`, 'DELETE');
}

// ─── Coupon API ─────────────────────────────────────────────────────────────

export async function fetchCoupons(query?: Record<string, string>) {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`ecommerce/coupons${qs}`);
  if (success && body) {
    return body as { docs: EcCoupon[]; pagination: any };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchCouponById(id: string) {
  const { body, success } = await useApiFetch(`ecommerce/coupons/${id}`);
  if (success && body) {
    return body as EcCoupon;
  }
  return null;
}

export async function validateCoupon(code: string, orderAmount: number, productIds?: string[]) {
  return useApiFetch('ecommerce/coupons/validate', 'POST', { code, orderAmount, productIds });
}

export async function applyCoupon(code: string, orderAmount: number) {
  return useApiFetch('ecommerce/coupons/apply', 'POST', { code, orderAmount });
}

export async function createCoupon(data: Partial<EcCoupon>) {
  return useApiFetch('ecommerce/coupons', 'POST', data as Record<string, any>);
}

export async function updateCoupon(id: string, data: Partial<EcCoupon>) {
  return useApiFetch(`ecommerce/coupons/${id}`, 'PUT', data as Record<string, any>);
}

export async function deleteCoupon(id: string) {
  return useApiFetch(`ecommerce/coupons/${id}`, 'DELETE');
}

// ─── Review API ─────────────────────────────────────────────────────────────

export async function fetchReviews(query?: Record<string, string>) {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`ecommerce/reviews${qs}`);
  if (success && body) {
    return body as { docs: EcReview[]; pagination: any };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchReviewById(id: string) {
  const { body, success } = await useApiFetch(`ecommerce/reviews/${id}`);
  if (success && body) {
    return body as EcReview;
  }
  return null;
}

export async function fetchProductReviewStats(productId: string) {
  const { body, success } = await useApiFetch(`ecommerce/reviews/stats/${productId}`);
  if (success && body) {
    return body;
  }
  return null;
}

export async function createReview(data: Partial<EcReview>) {
  return useApiFetch('ecommerce/reviews', 'POST', data as Record<string, any>);
}

export async function approveReview(id: string) {
  return useApiFetch(`ecommerce/reviews/${id}/approve`, 'PATCH');
}

export async function rejectReview(id: string) {
  return useApiFetch(`ecommerce/reviews/${id}/reject`, 'PATCH');
}

export async function respondToReview(id: string, response: string) {
  return useApiFetch(`ecommerce/reviews/${id}/respond`, 'PATCH', { response });
}

export async function deleteReview(id: string) {
  return useApiFetch(`ecommerce/reviews/${id}`, 'DELETE');
}

// ─── Cart API ───────────────────────────────────────────────────────────────

export async function fetchCarts(query?: Record<string, string>) {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`ecommerce/cart${qs}`);
  if (success && body) {
    return body as { docs: EcCart[]; pagination: any };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchCartById(id: string) {
  const { body, success } = await useApiFetch(`ecommerce/cart/${id}`);
  if (success && body) {
    return body as EcCart;
  }
  return null;
}

export async function fetchActiveCart(clientId: string) {
  const { body, success } = await useApiFetch(`ecommerce/cart/active/${clientId}`);
  if (success && body) {
    return body as EcCart;
  }
  return null;
}

export async function fetchAbandonedCarts(query?: Record<string, string>) {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`ecommerce/cart/abandoned${qs}`);
  if (success && body) {
    return body as { docs: EcCart[]; pagination: any };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function addCartItem(cartId: string, payload: { productId: string; quantity: number; notes?: string }) {
  return useApiFetch(`ecommerce/cart/${cartId}/items`, 'POST', payload as Record<string, any>);
}

export async function updateCartItem(itemId: string, payload: { quantity?: number; notes?: string }) {
  return useApiFetch(`ecommerce/cart/items/${itemId}`, 'PUT', payload as Record<string, any>);
}

export async function removeCartItem(itemId: string) {
  return useApiFetch(`ecommerce/cart/items/${itemId}`, 'DELETE');
}

export async function clearCart(cartId: string) {
  return useApiFetch(`ecommerce/cart/${cartId}/clear`, 'DELETE');
}

export async function applyCartCoupon(cartId: string, couponCode: string) {
  return useApiFetch(`ecommerce/cart/${cartId}/apply-coupon`, 'POST', { couponCode });
}

export async function convertCartToOrder(cartId: string) {
  return useApiFetch(`ecommerce/cart/${cartId}/convert`, 'POST');
}
