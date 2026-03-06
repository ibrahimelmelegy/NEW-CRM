
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

jest.mock('../../src/tenant/tenantModel');
jest.mock('../../src/middleware/tenantContext', () => ({
    tenantStorage: { run: jest.fn((store: any, fn: any) => fn()) },
    TENANT_BYPASS: Symbol('TENANT_BYPASS'),
    getTenantContext: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import Tenant from '../../src/tenant/tenantModel';
import { validateTenant, requireTenantId } from '../../src/middleware/tenantMiddleware';

describe('tenantMiddleware', () => {
    let req: any;
    let res: any;
    let next: NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {},
            query: {},
            user: undefined,
            tenant: undefined,
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;

        next = jest.fn() as NextFunction;
    });

    // =========================================================================
    // validateTenant
    // =========================================================================
    describe('validateTenant', () => {
        // ----------------------------------------------------------------------
        // 1. No authenticated user
        // ----------------------------------------------------------------------
        it('should return 401 when req.user is not set', async () => {
            req.user = undefined;

            await validateTenant(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(next).not.toHaveBeenCalled();
        });

        // ----------------------------------------------------------------------
        // 2. Superadmin bypasses tenant checks
        // ----------------------------------------------------------------------
        it('should call next() and bypass checks for SUPER_ADMIN role', async () => {
            req.user = {
                id: 1,
                tenantId: null,
                role: { name: 'SUPER_ADMIN', permissions: ['ALL'] },
            };

            await validateTenant(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            // Should NOT have queried the Tenant model
            expect(Tenant.findByPk).not.toHaveBeenCalled();
        });

        it('should call next() and bypass checks for "Super Admin" role variant', async () => {
            req.user = {
                id: 1,
                tenantId: null,
                role: { name: 'Super Admin', permissions: ['ALL'] },
            };

            await validateTenant(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        // ----------------------------------------------------------------------
        // 3. User without tenantId
        // ----------------------------------------------------------------------
        it('should return 403 when user has no tenantId', async () => {
            req.user = {
                id: 2,
                tenantId: undefined,
                role: { name: 'Sales Rep', permissions: ['READ'] },
            };

            await validateTenant(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Tenant context required'),
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        // ----------------------------------------------------------------------
        // 4. Tenant not found in database
        // ----------------------------------------------------------------------
        it('should return 403 when tenant does not exist in the database', async () => {
            req.user = {
                id: 3,
                tenantId: 'nonexistent-tenant',
                role: { name: 'Admin', permissions: ['ALL'] },
            };
            (Tenant.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await validateTenant(req, res, next);

            expect(Tenant.findByPk).toHaveBeenCalledWith('nonexistent-tenant', expect.anything());
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Tenant not found'),
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        // ----------------------------------------------------------------------
        // 5. Tenant is SUSPENDED
        // ----------------------------------------------------------------------
        it('should return 403 when tenant status is SUSPENDED', async () => {
            req.user = {
                id: 4,
                tenantId: 'suspended-tenant',
                role: { name: 'Admin', permissions: ['ALL'] },
            };
            const suspendedTenant: any = {
                id: 'suspended-tenant',
                name: 'Suspended Corp',
                status: 'SUSPENDED',
                isActive: true,
            };
            (Tenant.findByPk as jest.Mock<any>).mockResolvedValue(suspendedTenant);

            await validateTenant(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('suspended'),
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        // ----------------------------------------------------------------------
        // 6. Tenant is inactive (isActive = false)
        // ----------------------------------------------------------------------
        it('should return 403 when tenant is inactive', async () => {
            req.user = {
                id: 5,
                tenantId: 'inactive-tenant',
                role: { name: 'Admin', permissions: ['ALL'] },
            };
            const inactiveTenant: any = {
                id: 'inactive-tenant',
                name: 'Inactive Corp',
                status: 'ACTIVE',
                isActive: false,
            };
            (Tenant.findByPk as jest.Mock<any>).mockResolvedValue(inactiveTenant);

            await validateTenant(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('inactive'),
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        // ----------------------------------------------------------------------
        // 7. Valid ACTIVE tenant → attaches tenant and calls next
        // ----------------------------------------------------------------------
        it('should attach tenant to request and call next when tenant is ACTIVE', async () => {
            req.user = {
                id: 6,
                tenantId: 'active-tenant',
                role: { name: 'Admin', permissions: ['READ'] },
            };
            const activeTenant: any = {
                id: 'active-tenant',
                name: 'Active Corp',
                status: 'ACTIVE',
                isActive: true,
                plan: 'pro',
            };
            (Tenant.findByPk as jest.Mock<any>).mockResolvedValue(activeTenant);

            await validateTenant(req, res, next);

            expect(req.tenant).toBe(activeTenant);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should allow TRIAL tenant that is active', async () => {
            req.user = {
                id: 7,
                tenantId: 'trial-tenant',
                role: { name: 'Admin', permissions: ['READ'] },
            };
            const trialTenant: any = {
                id: 'trial-tenant',
                name: 'Trial Corp',
                status: 'TRIAL',
                isActive: true,
                plan: 'free',
            };
            (Tenant.findByPk as jest.Mock<any>).mockResolvedValue(trialTenant);

            await validateTenant(req, res, next);

            expect(req.tenant).toBe(trialTenant);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        // ----------------------------------------------------------------------
        // 8. Internal error handling
        // ----------------------------------------------------------------------
        it('should return 500 when an unexpected error occurs', async () => {
            req.user = {
                id: 8,
                tenantId: 'error-tenant',
                role: { name: 'Admin', permissions: ['READ'] },
            };
            (Tenant.findByPk as jest.Mock<any>).mockRejectedValue(new Error('DB connection lost'));

            await validateTenant(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error during tenant validation' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // requireTenantId (lightweight, no DB)
    // =========================================================================
    describe('requireTenantId', () => {
        it('should return 401 when req.user is not set', () => {
            req.user = undefined;

            requireTenantId(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next() for SUPER_ADMIN without tenantId', () => {
            req.user = {
                id: 1,
                tenantId: undefined,
                role: { name: 'SUPER_ADMIN' },
            };

            requireTenantId(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 403 when regular user has no tenantId', () => {
            req.user = {
                id: 2,
                tenantId: undefined,
                role: { name: 'Sales Rep' },
            };

            requireTenantId(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Tenant context required'),
                })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next() when user has a valid tenantId', () => {
            req.user = {
                id: 3,
                tenantId: 'tenant-xyz',
                role: { name: 'Admin' },
            };

            requireTenantId(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});
