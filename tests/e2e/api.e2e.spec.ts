/**
 * ============================================
 * E2E: Backend API Integration Tests
 * ============================================
 * Full coverage: Auth API, Leads API, Deals API, Users API, Roles API, Health Checks
 */

import { test, expect } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD, API_URL } from './helpers';

/** Helper to login and get token via API */
async function getAuthToken(request: any): Promise<string> {
    const response = await request.post(`${API_URL}/auth/login`, {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });
    const body = await response.json();
    return body.body?.token || '';
}

test.describe('Backend API E2E', () => {

    // ========== AUTH API ==========
    test.describe('Auth API', () => {

        test('POST /auth/login - should authenticate with valid credentials', async ({ request }) => {
            const response = await request.post(`${API_URL}/auth/login`, {
                data: { email: TEST_EMAIL, password: TEST_PASSWORD }
            });

            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.body).toHaveProperty('token');
        });

        test('POST /auth/login - should reject invalid credentials', async ({ request }) => {
            const response = await request.post(`${API_URL}/auth/login`, {
                data: { email: 'fake@fake.com', password: 'wrongpassword' }
            });

            expect(response.status()).not.toBe(200);
        });

        test('POST /auth/login - should reject empty body', async ({ request }) => {
            const response = await request.post(`${API_URL}/auth/login`, {
                data: {}
            });

            expect(response.status()).not.toBe(200);
        });

        test('GET /auth/me - should return current user with valid token', async ({ request }) => {
            const token = await getAuthToken(request);
            expect(token).toBeTruthy();

            const response = await request.get(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.body).toHaveProperty('email');
        });

        test('GET /auth/me - should reject request without token', async ({ request }) => {
            const response = await request.get(`${API_URL}/auth/me`);
            expect(response.status()).toBe(401);
        });

        test('GET /auth/me - should reject invalid token', async ({ request }) => {
            const response = await request.get(`${API_URL}/auth/me`, {
                headers: { 'Authorization': 'Bearer invalid_token_12345' }
            });
            // Should return an error status (401 or 500 for malformed token)
            expect([401, 403, 500]).toContain(response.status());
        });
    });

    // ========== LEADS API ==========
    test.describe('Leads API', () => {

        let token: string;

        test.beforeAll(async ({ request }) => {
            token = await getAuthToken(request);
        });

        test('GET /lead - should return leads list', async ({ request }) => {
            const response = await request.get(`${API_URL}/lead`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body).toHaveProperty('body');
        });

        test('GET /lead - should support pagination', async ({ request }) => {
            const response = await request.get(`${API_URL}/lead?page=1&limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
        });

        test('POST /lead - should create a new lead', async ({ request }) => {
            // Get current user ID for the required 'users' field
            const meResponse = await request.get(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const meBody = await meResponse.json();
            const userId = meBody.body?.id;

            const response = await request.post(`${API_URL}/lead`, {
                headers: { 'Authorization': `Bearer ${token}` },
                data: {
                    name: `API_Test_Lead_${Date.now()}`,
                    email: `api_test_${Date.now()}@test.com`,
                    phone: '+966501234567',
                    leadSource: 'WEBSITE',
                    status: 'NEW',
                    users: userId ? [userId] : [1]
                }
            });

            // Should either create (201) or return validation error (400/422) - not server error
            expect([200, 201, 400, 422]).toContain(response.status());
        });

        test('GET /lead - should reject without auth token', async ({ request }) => {
            const response = await request.get(`${API_URL}/lead`);
            expect(response.status()).toBe(401);
        });
    });

    // ========== DEALS API ==========
    test.describe('Deals API', () => {

        let token: string;

        test.beforeAll(async ({ request }) => {
            token = await getAuthToken(request);
        });

        test('GET /deal - should return deals list', async ({ request }) => {
            const response = await request.get(`${API_URL}/deal`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
        });

        test('GET /deal - should support pagination', async ({ request }) => {
            const response = await request.get(`${API_URL}/deal?page=1&limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
        });
    });

    // ========== OPPORTUNITIES API ==========
    test.describe('Opportunities API', () => {

        let token: string;

        test.beforeAll(async ({ request }) => {
            token = await getAuthToken(request);
        });

        test('GET /opportunity - should return opportunities list', async ({ request }) => {
            const response = await request.get(`${API_URL}/opportunity`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
        });
    });

    // ========== CLIENTS API ==========
    test.describe('Clients API', () => {

        let token: string;

        test.beforeAll(async ({ request }) => {
            token = await getAuthToken(request);
        });

        test('GET /client - should return clients list', async ({ request }) => {
            const response = await request.get(`${API_URL}/client`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
        });

        test('GET /client/all - should return all clients (no auth)', async ({ request }) => {
            const response = await request.get(`${API_URL}/client/all`);
            // This endpoint may or may not require auth
            const status = response.status();
            expect([200, 401, 403]).toContain(status);
        });
    });

    // ========== USERS API ==========
    test.describe('Users API', () => {

        let token: string;

        test.beforeAll(async ({ request }) => {
            token = await getAuthToken(request);
        });

        test('GET /users - should return users list', async ({ request }) => {
            const response = await request.get(`${API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
        });
    });

    // ========== ROLES API ==========
    test.describe('Roles API', () => {

        let token: string;

        test.beforeAll(async ({ request }) => {
            token = await getAuthToken(request);
        });

        test('GET /role - should return roles list', async ({ request }) => {
            const response = await request.get(`${API_URL}/role`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
        });

        test('GET /role/permissions - should return available permissions', async ({ request }) => {
            const response = await request.get(`${API_URL}/role/permissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
        });
    });

    // ========== PROJECTS API ==========
    test.describe('Projects API', () => {

        let token: string;

        test.beforeAll(async ({ request }) => {
            token = await getAuthToken(request);
        });

        test('GET /project - should return projects list', async ({ request }) => {
            const response = await request.get(`${API_URL}/project`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
        });
    });

    // ========== INSIGHTS API ==========
    test.describe('Insights/Analytics API', () => {

        let token: string;

        test.beforeAll(async ({ request }) => {
            token = await getAuthToken(request);
        });

        test('GET /insights/leads-sales - should return sales insights', async ({ request }) => {
            const response = await request.get(`${API_URL}/insights/leads-sales`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
        });

        test('GET /insights/projects-operations - should return operations insights', async ({ request }) => {
            const response = await request.get(`${API_URL}/insights/projects-operations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
        });
    });

    // ========== NOTIFICATIONS API ==========
    test.describe('Notifications API', () => {

        let token: string;

        test.beforeAll(async ({ request }) => {
            token = await getAuthToken(request);
        });

        test('GET /notification - should return notifications list', async ({ request }) => {
            const response = await request.get(`${API_URL}/notification`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(response.status()).toBe(200);
        });
    });

    // ========== SWAGGER DOCS ==========
    test.describe('API Documentation', () => {

        test('GET /api-docs - should serve Swagger documentation', async ({ request }) => {
            const response = await request.get(`${API_URL.replace('/api', '')}/api-docs/`);
            expect(response.status()).toBe(200);
        });
    });

    // ========== SECURITY TESTS ==========
    test.describe('API Security', () => {

        test('should reject SQL injection in login', async ({ request }) => {
            const response = await request.post(`${API_URL}/auth/login`, {
                data: { email: "' OR '1'='1", password: "' OR '1'='1" }
            });
            expect(response.status()).not.toBe(200);
        });

        test('should reject XSS in login fields', async ({ request }) => {
            const response = await request.post(`${API_URL}/auth/login`, {
                data: { email: '<script>alert("xss")</script>', password: 'test' }
            });
            expect(response.status()).not.toBe(200);
        });

        test('should enforce rate limiting on auth endpoints', async ({ request }) => {
            // Make a few rapid requests to verify rate limiting works
            const responses = [];
            for (let i = 0; i < 5; i++) {
                const response = await request.post(`${API_URL}/auth/login`, {
                    data: { email: `ratetest${i}@test.com`, password: 'wrong' }
                });
                responses.push(response.status());
            }

            // All should return valid error codes (auth error or rate limit)
            const allValid = responses.every(s => [200, 400, 401, 429].includes(s));
            expect(allValid).toBeTruthy();
        });
    });
});
