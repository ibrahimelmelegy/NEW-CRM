import { test, expect } from '@playwright/test';

test.describe('Backend API', () => {
    test('should have swagger docs', async ({ request }) => {
        const response = await request.get('http://localhost:5000/api-docs/');
        expect(response.status()).toBe(200);
    });

    test('should authenticate user via API', async ({ request }) => {
        // Attempt login with default credentials
        const response = await request.post('http://localhost:5000/api/auth/login', {
            data: {
                email: 'admin@example.com',
                password: 'password'
            }
        });

        // Log status for debugging
        console.log(`Login API Status: ${response.status()}`);

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('token');

        // Save token for subsequent tests if we were splitting this, 
        // but for now we'll do nested requests or just verify this flow works.
        const token = body.token;

        // Verify we can fetch leads with this token
        const leadsResponse = await request.get('http://localhost:5000/api/lead', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        expect(leadsResponse.status()).toBe(200);
    });

    test('should fetch user profile', async ({ request }) => {
        // Login first
        const loginResponse = await request.post('http://localhost:5000/api/auth/login', {
            data: {
                email: 'admin@example.com',
                password: 'password'
            }
        });
        const loginBody = await loginResponse.json();
        const token = loginBody.token;

        // Fetch Profile (assuming /api/users/profile or similar - checking routes revealed /api/users via userRoutes)
        // Let's assume a common endpoint like /api/auth/me or verify via user list if specific profile endpoint isn't obvious globally
        // Looking at app.ts: app.use('/api', authRoutes); app.use('/api/users', userRoutes);
        // Let's try to get users list as a safe admin action
        // Fetch Profile
        const usersResponse = await request.get('http://localhost:5000/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        expect(usersResponse.status()).toBe(200);
        const userBody = await usersResponse.json();
        expect(userBody).toHaveProperty('user');
    });
});
