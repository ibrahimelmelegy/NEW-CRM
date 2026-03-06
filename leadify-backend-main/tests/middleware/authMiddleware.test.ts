
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextFunction, Response } from 'express';

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the module under test
// ---------------------------------------------------------------------------
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

jest.mock('../../src/config/db', () => ({
    __esModule: true,
    sequelize: {
        define: jest.fn(),
        model: jest.fn(),
        models: {},
        transaction: jest.fn(),
        literal: jest.fn(),
    },
}));

jest.mock('jsonwebtoken');
jest.mock('../../src/user/models/sessionModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/role/roleModel');

// Mock the tenantContext — provide a functional tenantStorage
const mockRun = jest.fn((store: any, fn: any) => fn());
jest.mock('../../src/middleware/tenantContext', () => ({
    tenantStorage: { run: mockRun },
    TENANT_BYPASS: Symbol('TENANT_BYPASS'),
}));

// Mock the tenantMiddleware (imported by authMiddleware for authenticateWithTenant)
jest.mock('../../src/middleware/tenantMiddleware', () => ({
    validateTenant: jest.fn(),
}));

// Mock the tenantRateLimit
jest.mock('../../src/middleware/tenantRateLimit', () => ({
    tenantRateLimit: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import jwt from 'jsonwebtoken';
import Session from '../../src/user/models/sessionModel';
import User from '../../src/user/userModel';
import { authenticateUser } from '../../src/middleware/authMiddleware';

describe('authenticateUser middleware', () => {
    let req: any;
    let res: any;
    let next: NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            header: jest.fn().mockReturnValue(null),
            cookies: {},
            body: {},
            params: {},
            query: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        next = jest.fn() as NextFunction;
    });

    // --------------------------------------------------------------------------
    // 1. No token provided
    // --------------------------------------------------------------------------
    describe('no token provided', () => {
        it('should return 401 when Authorization header is missing and no cookie', async () => {
            req.header = jest.fn().mockReturnValue(null);
            req.cookies = {};

            await authenticateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized, no token provided' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when Authorization header is empty string', async () => {
            req.header = jest.fn().mockReturnValue('');
            req.cookies = {};

            await authenticateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized, no token provided' });
        });
    });

    // --------------------------------------------------------------------------
    // 2. Invalid token
    // --------------------------------------------------------------------------
    describe('invalid token', () => {
        it('should return 401 when jwt.verify throws', async () => {
            req.header = jest.fn().mockReturnValue('Bearer invalid-token');
            process.env.SECRET_KEY = 'test-secret';
            (jwt.verify as jest.Mock<any>).mockImplementation(() => {
                throw new Error('jwt malformed');
            });

            await authenticateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 3. Missing SECRET_KEY
    // --------------------------------------------------------------------------
    describe('missing SECRET_KEY', () => {
        it('should return 500 when SECRET_KEY is not set', async () => {
            req.header = jest.fn().mockReturnValue('Bearer some-token');
            const originalKey = process.env.SECRET_KEY;
            delete process.env.SECRET_KEY;

            await authenticateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Server configuration error' });
            expect(next).not.toHaveBeenCalled();

            // Restore
            if (originalKey) process.env.SECRET_KEY = originalKey;
        });
    });

    // --------------------------------------------------------------------------
    // 4. Expired / missing session
    // --------------------------------------------------------------------------
    describe('expired or missing session', () => {
        it('should return 401 when session is not found in the database', async () => {
            req.header = jest.fn().mockReturnValue('Bearer valid-token');
            process.env.SECRET_KEY = 'test-secret';
            (jwt.verify as jest.Mock<any>).mockReturnValue({ id: '1', tenantId: 'tenant-1' });
            (Session.destroy as jest.Mock<any>).mockResolvedValue(0);
            (Session.findOne as jest.Mock<any>).mockResolvedValue(null);

            await authenticateUser(req, res, next);

            expect(Session.destroy).toHaveBeenCalled();
            expect(Session.findOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 5. Cleans up expired sessions
    // --------------------------------------------------------------------------
    describe('expired session cleanup', () => {
        it('should call Session.destroy for expired sessions before lookup', async () => {
            req.header = jest.fn().mockReturnValue('Bearer valid-token');
            process.env.SECRET_KEY = 'test-secret';
            (jwt.verify as jest.Mock<any>).mockReturnValue({ id: '42', tenantId: 'tenant-1' });
            (Session.destroy as jest.Mock<any>).mockResolvedValue(3); // 3 expired sessions cleaned
            (Session.findOne as jest.Mock<any>).mockResolvedValue(null);

            await authenticateUser(req, res, next);

            // Session.destroy should be called with the userId and expiry condition
            expect(Session.destroy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: '42',
                    }),
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 6. Valid token + session → attaches user and calls next
    // --------------------------------------------------------------------------
    describe('valid authentication', () => {
        it('should attach user to request and call next when everything is valid', async () => {
            req.header = jest.fn().mockReturnValue('Bearer valid-token');
            process.env.SECRET_KEY = 'test-secret';

            const decodedPayload = { id: '1', tenantId: 'tenant-1' };
            (jwt.verify as jest.Mock<any>).mockReturnValue(decodedPayload);
            (Session.destroy as jest.Mock<any>).mockResolvedValue(0);
            (Session.findOne as jest.Mock<any>).mockResolvedValue({
                id: 100,
                userId: '1',
                token: 'valid-token',
                expiresAt: new Date(Date.now() + 3600000),
            });

            const mockUser: any = {
                id: 1,
                email: 'user@test.com',
                tenantId: 'tenant-1',
                role: { name: 'Admin', permissions: ['READ'] },
            };
            (User.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);

            await authenticateUser(req, res, next);

            // User should be attached to request
            expect(req.user).toBe(mockUser);
            // next should be called (via tenantStorage.run)
            expect(next).toHaveBeenCalled();
            // Status should NOT have been called (no error)
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should read token from cookie when Authorization header is absent', async () => {
            req.header = jest.fn().mockReturnValue(null);
            req.cookies = { __session: 'cookie-token' };
            process.env.SECRET_KEY = 'test-secret';

            (jwt.verify as jest.Mock<any>).mockReturnValue({ id: '1', tenantId: 'tenant-1' });
            (Session.destroy as jest.Mock<any>).mockResolvedValue(0);
            (Session.findOne as jest.Mock<any>).mockResolvedValue({
                id: 101,
                userId: '1',
                token: 'cookie-token',
                expiresAt: new Date(Date.now() + 3600000),
            });

            const mockUser: any = {
                id: 1,
                email: 'user@test.com',
                tenantId: 'tenant-1',
                role: { name: 'Admin', permissions: ['READ'] },
            };
            (User.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);

            await authenticateUser(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('cookie-token', 'test-secret');
            expect(req.user).toBe(mockUser);
            expect(next).toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 7. User not found in DB
    // --------------------------------------------------------------------------
    describe('user not found', () => {
        it('should return 404 when user does not exist in the database', async () => {
            req.header = jest.fn().mockReturnValue('Bearer valid-token');
            process.env.SECRET_KEY = 'test-secret';

            (jwt.verify as jest.Mock<any>).mockReturnValue({ id: '999' });
            (Session.destroy as jest.Mock<any>).mockResolvedValue(0);
            (Session.findOne as jest.Mock<any>).mockResolvedValue({
                id: 1,
                userId: '999',
                token: 'valid-token',
                expiresAt: new Date(Date.now() + 3600000),
            });
            (User.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await authenticateUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 8. Tenant context setup
    // --------------------------------------------------------------------------
    describe('tenant context', () => {
        it('should set isSuperAdmin=true in tenant store for SUPER_ADMIN users', async () => {
            req.header = jest.fn().mockReturnValue('Bearer valid-token');
            process.env.SECRET_KEY = 'test-secret';

            (jwt.verify as jest.Mock<any>).mockReturnValue({ id: '1', tenantId: 'tenant-1' });
            (Session.destroy as jest.Mock<any>).mockResolvedValue(0);
            (Session.findOne as jest.Mock<any>).mockResolvedValue({
                id: 1,
                userId: '1',
                token: 'valid-token',
                expiresAt: new Date(Date.now() + 3600000),
            });

            const mockUser: any = {
                id: 1,
                email: 'superadmin@test.com',
                tenantId: 'tenant-1',
                role: { name: 'SUPER_ADMIN', permissions: ['ALL'] },
            };
            (User.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);

            await authenticateUser(req, res, next);

            // tenantStorage.run should have been called with isSuperAdmin = true
            expect(mockRun).toHaveBeenCalledWith(
                expect.objectContaining({ isSuperAdmin: true, tenantId: null }),
                expect.any(Function)
            );
        });

        it('should set isSuperAdmin=false and populate tenantId for regular users', async () => {
            req.header = jest.fn().mockReturnValue('Bearer valid-token');
            process.env.SECRET_KEY = 'test-secret';

            (jwt.verify as jest.Mock<any>).mockReturnValue({ id: '2', tenantId: 'tenant-abc' });
            (Session.destroy as jest.Mock<any>).mockResolvedValue(0);
            (Session.findOne as jest.Mock<any>).mockResolvedValue({
                id: 2,
                userId: '2',
                token: 'valid-token',
                expiresAt: new Date(Date.now() + 3600000),
            });

            const mockUser: any = {
                id: 2,
                email: 'user@test.com',
                tenantId: 'tenant-abc',
                role: { name: 'Sales Rep', permissions: ['READ'] },
            };
            (User.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);

            await authenticateUser(req, res, next);

            expect(mockRun).toHaveBeenCalledWith(
                expect.objectContaining({ isSuperAdmin: false, tenantId: 'tenant-abc' }),
                expect.any(Function)
            );
        });

        it('should fallback tenantId from JWT when user.tenantId is not set', async () => {
            req.header = jest.fn().mockReturnValue('Bearer valid-token');
            process.env.SECRET_KEY = 'test-secret';

            (jwt.verify as jest.Mock<any>).mockReturnValue({ id: '3', tenantId: 'jwt-tenant' });
            (Session.destroy as jest.Mock<any>).mockResolvedValue(0);
            (Session.findOne as jest.Mock<any>).mockResolvedValue({
                id: 3,
                userId: '3',
                token: 'valid-token',
                expiresAt: new Date(Date.now() + 3600000),
            });

            const mockUser: any = {
                id: 3,
                email: 'user@test.com',
                tenantId: undefined, // Not set in DB
                role: { name: 'Agent', permissions: ['READ'] },
            };
            (User.findByPk as jest.Mock<any>).mockResolvedValue(mockUser);

            await authenticateUser(req, res, next);

            // Should have set tenantId from JWT payload
            expect(mockUser.tenantId).toBe('jwt-tenant');
        });
    });
});
