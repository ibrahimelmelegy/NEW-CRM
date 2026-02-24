
import { describe, it, expect } from '@jest/globals';
import { tenantWhere, tenantCreate } from '../../src/utils/tenantScope';

describe('Tenant Scope Helpers', () => {
    // --------------------------------------------------------------------------
    // 1. tenantWhere
    // --------------------------------------------------------------------------
    describe('tenantWhere', () => {
        it('should return tenantId filter when user has tenantId', () => {
            const user = { id: 1, tenantId: 'tenant-abc' };
            const result = tenantWhere(user);
            expect(result).toEqual({ tenantId: 'tenant-abc' });
        });

        it('should return empty object when user has no tenantId', () => {
            const user = { id: 1 };
            const result = tenantWhere(user);
            expect(result).toEqual({});
        });

        it('should return empty object when tenantId is null', () => {
            const user = { id: 1, tenantId: null };
            const result = tenantWhere(user);
            expect(result).toEqual({});
        });

        it('should return empty object when tenantId is undefined', () => {
            const user = { id: 1, tenantId: undefined };
            const result = tenantWhere(user);
            expect(result).toEqual({});
        });

        it('should return empty object when user is null', () => {
            const result = tenantWhere(null as any);
            expect(result).toEqual({});
        });
    });

    // --------------------------------------------------------------------------
    // 2. tenantCreate
    // --------------------------------------------------------------------------
    describe('tenantCreate', () => {
        it('should inject tenantId into data when user has tenantId', () => {
            const user = { id: 1, tenantId: 'tenant-abc' };
            const data = { name: 'Test', email: 'test@test.com' };
            const result = tenantCreate(data, user);
            expect(result).toEqual({ name: 'Test', email: 'test@test.com', tenantId: 'tenant-abc' });
        });

        it('should NOT inject tenantId when user has no tenantId', () => {
            const user = { id: 1 };
            const data = { name: 'Test' };
            const result = tenantCreate(data, user);
            expect(result).toEqual({ name: 'Test' });
            expect(result).not.toHaveProperty('tenantId');
        });

        it('should NOT mutate the original data object', () => {
            const user = { id: 1, tenantId: 'tenant-abc' };
            const data = { name: 'Test' };
            const result = tenantCreate(data, user);
            expect(data).toEqual({ name: 'Test' }); // Original unchanged
            expect(result).toEqual({ name: 'Test', tenantId: 'tenant-abc' }); // New object
        });

        it('should preserve existing fields', () => {
            const user = { id: 1, tenantId: 'tenant-xyz' };
            const data = { a: 1, b: 'two', c: true, nested: { x: 1 } };
            const result = tenantCreate(data, user);
            expect(result).toEqual({ a: 1, b: 'two', c: true, nested: { x: 1 }, tenantId: 'tenant-xyz' });
        });
    });

    // --------------------------------------------------------------------------
    // 3. Cross-Tenant Isolation Scenarios
    // --------------------------------------------------------------------------
    describe('Cross-Tenant Isolation', () => {
        const tenantA = { id: 1, tenantId: 'tenant-A' };
        const tenantB = { id: 2, tenantId: 'tenant-B' };

        it('should produce different WHERE clauses for different tenants', () => {
            const whereA = tenantWhere(tenantA);
            const whereB = tenantWhere(tenantB);

            expect(whereA).toEqual({ tenantId: 'tenant-A' });
            expect(whereB).toEqual({ tenantId: 'tenant-B' });
            expect(whereA).not.toEqual(whereB);
        });

        it('should inject correct tenantId on create for each tenant', () => {
            const data = { name: 'Shared Resource' };
            const resultA = tenantCreate(data, tenantA);
            const resultB = tenantCreate(data, tenantB);

            expect(resultA.tenantId).toBe('tenant-A');
            expect(resultB.tenantId).toBe('tenant-B');
            expect(resultA.tenantId).not.toBe(resultB.tenantId);
        });

        it('should allow single-tenant (no tenantId) users to see all data', () => {
            const singleTenantUser = { id: 3 };
            const where = tenantWhere(singleTenantUser);
            // Empty WHERE means no tenant filter = sees all data (backward compatible)
            expect(where).toEqual({});
            expect(Object.keys(where)).toHaveLength(0);
        });
    });
});
