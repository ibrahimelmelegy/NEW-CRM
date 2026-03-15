/* eslint-disable no-use-before-define */
import { ElNotification } from 'element-plus';
import logger from '~/utils/logger';

function handleError(message: string) {
  const t = useNuxtApp().$i18n.t;
  ElNotification({
    type: 'error',
    title: t('common.error'),
    message
  });
}

function handleSuccess(message: string) {
  const t = useNuxtApp().$i18n.t;
  ElNotification({
    type: 'success',
    title: t('common.success'),
    message
  });
}

// =====================
// Enums
// =====================

export enum BillingCycleEnum {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL'
}

export enum SubscriptionStatusEnum {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum SubscriptionEventTypeEnum {
  CREATED = 'CREATED',
  RENEWED = 'RENEWED',
  UPGRADED = 'UPGRADED',
  DOWNGRADED = 'DOWNGRADED',
  CANCELLED = 'CANCELLED',
  PAYMENT_FAILED = 'PAYMENT_FAILED'
}

export const billingCycleOptions = [
  { label: 'Monthly', value: BillingCycleEnum.MONTHLY },
  { label: 'Quarterly', value: BillingCycleEnum.QUARTERLY },
  { label: 'Annual', value: BillingCycleEnum.ANNUAL }
];

export const subscriptionStatusOptions = [
  { label: 'Trial', value: SubscriptionStatusEnum.TRIAL, type: 'warning' },
  { label: 'Active', value: SubscriptionStatusEnum.ACTIVE, type: 'success' },
  { label: 'Past Due', value: SubscriptionStatusEnum.PAST_DUE, type: 'danger' },
  { label: 'Cancelled', value: SubscriptionStatusEnum.CANCELLED, type: 'info' },
  { label: 'Expired', value: SubscriptionStatusEnum.EXPIRED, type: 'info' }
];

export const eventTypeOptions = [
  { label: 'Created', value: SubscriptionEventTypeEnum.CREATED, icon: 'ph:plus-circle-bold', color: '#67c23a' },
  { label: 'Renewed', value: SubscriptionEventTypeEnum.RENEWED, icon: 'ph:arrows-clockwise-bold', color: '#409eff' },
  { label: 'Upgraded', value: SubscriptionEventTypeEnum.UPGRADED, icon: 'ph:arrow-up-bold', color: '#7849ff' },
  { label: 'Downgraded', value: SubscriptionEventTypeEnum.DOWNGRADED, icon: 'ph:arrow-down-bold', color: '#e6a23c' },
  { label: 'Cancelled', value: SubscriptionEventTypeEnum.CANCELLED, icon: 'ph:x-circle-bold', color: '#f56c6c' },
  { label: 'Payment Failed', value: SubscriptionEventTypeEnum.PAYMENT_FAILED, icon: 'ph:warning-bold', color: '#f56c6c' }
];

// =====================
// Interfaces
// =====================

export interface SubscriptionPlan {
  id?: string;
  name: string;
  description?: string;
  billingCycle: string;
  price: number;
  currency?: string;
  features?: string[];
  trialDays?: number;
  isActive?: boolean;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
  subscriptions?: CustomerSubscription[];
}

export interface CustomerSubscription {
  id?: string;
  clientId: string;
  planId: string;
  status?: string;
  startDate?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextBillingDate?: string;
  cancelledAt?: string;
  cancelReason?: string;
  tenantId?: string;
  client?: unknown;
  plan?: SubscriptionPlan;
  events?: SubscriptionEvent[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionEvent {
  id?: string;
  subscriptionId: string;
  type: string;
  metadata?: Record<string, unknown>;
  date: string;
  createdAt?: string;
}

export interface SubscriptionMetrics {
  mrr: number;
  arr: number;
  churnRate: number;
  activeCount: number;
  trialCount: number;
  totalRevenue: number;
  netRevenueGrowth: number;
  mrrTrend: Array<{ month: string; amount: number }>;
}

interface Pagination {
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SubscriptionListResult {
  subscriptions: CustomerSubscription[];
  pagination: Pagination;
}

// =====================
// Helpers
// =====================

export function getSubscriptionStatusType(status: string): string {
  return subscriptionStatusOptions.find(s => s.value === status)?.type || 'info';
}

export function getSubscriptionStatusLabel(status: string): string {
  return subscriptionStatusOptions.find(s => s.value === status)?.label || status;
}

export function getBillingCycleLabel(cycle: string): string {
  return billingCycleOptions.find(c => c.value === cycle)?.label || cycle;
}

export function getEventTypeInfo(type: string) {
  return eventTypeOptions.find(e => e.value === type) || { label: type, icon: 'ph:info-bold', color: '#909399' };
}

export function formatSubscriptionCurrency(amount: number, currency: string = 'SAR'): string {
  return `${currency} ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// =====================
// Plan API
// =====================

export async function fetchPlans(includeInactive: boolean = false): Promise<SubscriptionPlan[]> {
  const query = includeInactive ? '?includeInactive=true' : '';
  const { body, success } = await useApiFetch(`subscriptions/plans${query}`);
  return success && body ? body : [];
}

export async function createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> {
  try {
    const response = await useApiFetch('subscriptions/plans', 'POST', data as unknown);
    if (response?.success) {
      handleSuccess(useNuxtApp().$i18n.t('common.created'));
      return response.body;
    } else {
      handleError(response?.message || 'Failed to create plan');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function updatePlan(id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> {
  try {
    const response = await useApiFetch(`subscriptions/plans/${id}`, 'PUT', data as unknown);
    if (response?.success) {
      handleSuccess(useNuxtApp().$i18n.t('common.saved'));
      return response.body;
    } else {
      handleError(response?.message || 'Failed to update plan');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function deletePlan(id: string): Promise<boolean> {
  try {
    const response = await useApiFetch(`subscriptions/plans/${id}`, 'DELETE');
    if (response?.success) {
      handleSuccess(useNuxtApp().$i18n.t('common.deleted'));
      return true;
    } else {
      handleError(response?.message || 'Failed to deactivate plan');
      return false;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

// =====================
// Subscription API
// =====================

export async function fetchSubscriptions(query?: string): Promise<SubscriptionListResult> {
  const endpoint = query ? `subscriptions?${query}` : 'subscriptions';
  const { body, success } = await useApiFetch(endpoint);
  if (success && body) {
    return {
      subscriptions: body.docs || [],
      pagination: body.pagination || { totalItems: 0, page: 1, limit: 10, totalPages: 1 }
    };
  }
  return { subscriptions: [], pagination: { totalItems: 0, page: 1, limit: 10, totalPages: 1 } };
}

export async function fetchSubscriptionById(id: string): Promise<CustomerSubscription | null> {
  const { body, success } = await useApiFetch(`subscriptions/${id}`);
  if (success && body) return body;
  return null;
}

export async function createSubscription(data: unknown): Promise<CustomerSubscription | null> {
  try {
    const response = await useApiFetch('subscriptions', 'POST', data);
    if (response?.success) {
      handleSuccess(useNuxtApp().$i18n.t('common.created'));
      return response.body;
    } else {
      handleError(response?.message || 'Failed to create subscription');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function cancelSubscription(id: string, reason?: string): Promise<CustomerSubscription | null> {
  try {
    const response = await useApiFetch(`subscriptions/${id}/cancel`, 'PATCH', { reason });
    if (response?.success) {
      handleSuccess(useNuxtApp().$i18n.t('common.deleted'));
      return response.body;
    } else {
      handleError(response?.message || 'Failed to cancel subscription');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function changeSubscriptionPlan(id: string, newPlanId: string): Promise<CustomerSubscription | null> {
  try {
    const response = await useApiFetch(`subscriptions/${id}/change-plan`, 'PATCH', { newPlanId });
    if (response?.success) {
      handleSuccess(useNuxtApp().$i18n.t('common.saved'));
      return response.body;
    } else {
      handleError(response?.message || 'Failed to change plan');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// =====================
// Metrics API
// =====================

export async function fetchSubscriptionMetrics(): Promise<SubscriptionMetrics | null> {
  try {
    const { body, success } = await useApiFetch('subscriptions/metrics');
    if (success && body) {
      return body;
    }
    return null;
  } catch (error) {
    logger.error('Error fetching metrics:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function processAutoRenewals(): Promise<{ renewed: number; failed: number } | null> {
  try {
    const response = await useApiFetch('subscriptions/process-renewals', 'POST', {});
    if (response?.success) {
      handleSuccess(`Renewals processed: ${response.body?.renewed} renewed, ${response.body?.failed} failed`);
      return response.body;
    } else {
      handleError(response?.message || 'Failed to process renewals');
      return null;
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}
