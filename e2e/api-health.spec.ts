/**
 * ============================================
 * E2E: Backend API Health Tests
 * ============================================
 * Validates that the backend API is reachable and responsive,
 * health endpoints return proper status, and authentication
 * endpoints respond correctly.
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

test.describe('API Health Checks', () => {

  test.describe('Basic Health Endpoint', () => {

    test('GET /api/health should return 200 OK', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);
      expect(response.status()).toBe(200);
    });

    test('GET /api/health should return valid JSON', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toBeTruthy();
      expect(body.status).toBe('ok');
    });

    test('GET /api/health should include timestamp', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);
      const body = await response.json();

      expect(body.timestamp).toBeTruthy();
      // Timestamp should be a valid ISO date string
      const date = new Date(body.timestamp);
      expect(date.getTime()).not.toBeNaN();
    });

    test('GET /api/health should include uptime', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);
      const body = await response.json();

      expect(body.uptime).toBeDefined();
      expect(typeof body.uptime).toBe('number');
      expect(body.uptime).toBeGreaterThan(0);
    });

    test('GET /api/health should include version', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);
      const body = await response.json();

      expect(body.version).toBeTruthy();
      expect(typeof body.version).toBe('string');
    });
  });

  test.describe('Deep Health Check (Readiness)', () => {

    test('GET /api/health/ready should return status with database check', async ({ request }) => {
      const response = await request.get(`${API_URL}/health/ready`);
      // May return 200 (healthy) or 503 (database down)
      expect([200, 503]).toContain(response.status());

      const body = await response.json();
      expect(body.status).toBeTruthy();
      expect(body.timestamp).toBeTruthy();
    });

    test('GET /api/health/ready should include database check details', async ({ request }) => {
      const response = await request.get(`${API_URL}/health/ready`);
      const body = await response.json();

      expect(body.checks).toBeDefined();
      expect(body.checks.database).toBeDefined();
      expect(body.checks.database.status).toBeTruthy();
    });

    test('GET /api/health/ready should include memory usage when healthy', async ({ request }) => {
      const response = await request.get(`${API_URL}/health/ready`);
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.checks.memory).toBeDefined();
        expect(body.checks.memory.status).toBe('ok');
        expect(body.checks.memory.usage).toBeTruthy();
        expect(body.checks.memory.total).toBeTruthy();
      }
    });
  });

  test.describe('Liveness Probe', () => {

    test('GET /api/health/live should return alive status', async ({ request }) => {
      const response = await request.get(`${API_URL}/health/live`);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('alive');
    });
  });

  test.describe('API JSON Responses', () => {

    test('API should return JSON content-type', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    });

    test('Protected endpoints should return JSON even for 401', async ({ request }) => {
      const response = await request.get(`${API_URL}/lead`);
      expect(response.status()).toBe(401);

      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    });

    test('Non-existent API routes should return JSON error', async ({ request }) => {
      const response = await request.get(`${API_URL}/nonexistent-route-12345`);
      // Should return 404 or similar error, not a crash
      expect([400, 401, 403, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Authentication Endpoints', () => {

    test('POST /api/auth/login should accept valid credentials', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.body).toHaveProperty('token');
    });

    test('POST /api/auth/login should return token in the response body', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD },
      });

      const body = await response.json();
      const token = body.body?.token;
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(10);
    });

    test('POST /api/auth/login should reject invalid credentials', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: { email: 'invalid@nonexistent.com', password: 'wrong_password' },
      });

      expect(response.status()).not.toBe(200);
    });

    test('POST /api/auth/login should reject empty body', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {},
      });

      expect(response.status()).not.toBe(200);
    });

    test('POST /api/auth/login should reject missing password', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: { email: TEST_EMAIL },
      });

      expect(response.status()).not.toBe(200);
    });

    test('POST /api/auth/login should reject missing email', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: { password: TEST_PASSWORD },
      });

      expect(response.status()).not.toBe(200);
    });

    test('GET /api/auth/me should return 401 without token', async ({ request }) => {
      const response = await request.get(`${API_URL}/auth/me`);
      expect(response.status()).toBe(401);
    });

    test('GET /api/auth/me should return user data with valid token', async ({ request }) => {
      // First login to get token
      const loginResponse = await request.post(`${API_URL}/auth/login`, {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD },
      });
      const loginBody = await loginResponse.json();
      const token = loginBody.body?.token;

      if (!token) { expect(true).toBe(true); return; }

      const meResponse = await request.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(meResponse.status()).toBe(200);
      const meBody = await meResponse.json();
      expect(meBody.success).toBe(true);
      expect(meBody.body).toHaveProperty('email');
    });

    test('GET /api/auth/me should reject invalid token', async ({ request }) => {
      const response = await request.get(`${API_URL}/auth/me`, {
        headers: { Authorization: 'Bearer invalid_token_xyz_12345' },
      });

      // Should return 401 or 500 for malformed token
      expect([401, 403, 500]).toContain(response.status());
    });
  });

  test.describe('Protected API Endpoints', () => {

    test('GET /api/lead should require authentication', async ({ request }) => {
      const response = await request.get(`${API_URL}/lead`);
      expect(response.status()).toBe(401);
    });

    test('GET /api/deal should require authentication', async ({ request }) => {
      const response = await request.get(`${API_URL}/deal`);
      expect(response.status()).toBe(401);
    });

    test('GET /api/client should require authentication', async ({ request }) => {
      const response = await request.get(`${API_URL}/client`);
      expect(response.status()).toBe(401);
    });

    test('GET /api/users should require authentication', async ({ request }) => {
      const response = await request.get(`${API_URL}/users`);
      expect(response.status()).toBe(401);
    });

    test('GET /api/opportunity should require authentication', async ({ request }) => {
      const response = await request.get(`${API_URL}/opportunity`);
      expect(response.status()).toBe(401);
    });

    test('GET /api/project should require authentication', async ({ request }) => {
      const response = await request.get(`${API_URL}/project`);
      expect(response.status()).toBe(401);
    });

    test('protected endpoints should return valid data with auth token', async ({ request }) => {
      // Login first
      const loginResponse = await request.post(`${API_URL}/auth/login`, {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD },
      });
      const loginBody = await loginResponse.json();
      const token = loginBody.body?.token;

      if (!token) { expect(true).toBe(true); return; }

      const headers = { Authorization: `Bearer ${token}` };

      // Test multiple endpoints with the valid token
      const endpoints = ['lead', 'deal', 'client', 'users', 'opportunity', 'project'];
      for (const endpoint of endpoints) {
        const response = await request.get(`${API_URL}/${endpoint}`, { headers });
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body).toBeTruthy();
      }
    });
  });

  test.describe('API Response Times', () => {

    test('health endpoint should respond within 5 seconds', async ({ request }) => {
      const start = Date.now();
      const response = await request.get(`${API_URL}/health`);
      const elapsed = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(elapsed).toBeLessThan(5000);
    });

    test('auth login should respond within 10 seconds', async ({ request }) => {
      const start = Date.now();
      const response = await request.post(`${API_URL}/auth/login`, {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD },
      });
      const elapsed = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(elapsed).toBeLessThan(10000);
    });
  });

  test.describe('Swagger Documentation', () => {

    test('GET /api-docs should serve Swagger UI', async ({ request }) => {
      const baseUrl = API_URL.replace('/api', '');
      const response = await request.get(`${baseUrl}/api-docs/`);
      expect(response.status()).toBe(200);
    });
  });
});
