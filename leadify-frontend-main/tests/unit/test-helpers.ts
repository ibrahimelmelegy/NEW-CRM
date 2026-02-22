/**
 * Test Utilities for High Point Technology CRM Frontend
 * ====================================
 * Common mocks, helpers, and factories for unit testing
 */

import { vi } from 'vitest';

// ============================================
// Mock Factories
// ============================================

/**
 * Create a mock user object
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    roleId: 'test-role-id',
    tenantId: 'test-tenant-id',
    permissions: ['read', 'write'],
    ...overrides
  };
}

/**
 * Create a mock API response
 */
export function createMockApiResponse<T>(data: T, success = true) {
  return {
    body: data,
    success,
    message: success ? 'Success' : 'Error',
    code: success ? 200 : 500
  };
}

/**
 * Create a mock lead object
 */
export function createMockLead(overrides: Partial<any> = {}) {
  return {
    id: 'lead-123',
    name: 'Test Lead',
    email: 'lead@example.com',
    phone: '+966501234567',
    source: 'website',
    status: 'new',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Create a mock deal object
 */
export function createMockDeal(overrides: Partial<any> = {}) {
  return {
    id: 'deal-123',
    title: 'Test Deal',
    value: 50000,
    stage: 'proposal',
    clientId: 'client-123',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

// ============================================
// Mock Functions
// ============================================

/**
 * Mock useRuntimeConfig for Nuxt
 */
export function mockUseRuntimeConfig() {
  return {
    public: {
      API_BASE_URL: 'http://localhost:3001/api/v1/'
    }
  };
}

/**
 * Mock useCookie for Nuxt
 */
export function mockUseCookie(value: string | null = 'mock-token') {
  return { value };
}

/**
 * Mock $fetch function
 */
export function mockFetch(response: any) {
  return vi.fn().mockResolvedValue(response);
}

/**
 * Mock $fetch with error
 */
export function mockFetchError(status: number, message: string) {
  const error = new Error(message) as any;
  error.response = {
    status,
    _data: { message }
  };
  return vi.fn().mockRejectedValue(error);
}

// ============================================
// Test Helpers
// ============================================

/**
 * Wait for next tick (Vue reactivity)
 */
export function nextTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Flush all pending promises
 */
export function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Create a date string for testing
 */
export function createTestDate(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

/**
 * Create a timestamp for testing
 */
export function createTestTimestamp(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.getTime();
}
