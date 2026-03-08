import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { tenantStorage, TENANT_BYPASS, TenantStore } from '../../src/middleware/tenantContext';
import { registerTenantHooks } from '../../src/config/tenantHooks';

// ---------------------------------------------------------------------------
// Helpers: fake Sequelize instance with hook capture
// ---------------------------------------------------------------------------

type HookFn = (...args: any[]) => any;

interface FakeModel {
    rawAttributes: Record<string, any>;
    name: string;
    addHook: jest.Mock;
    hooks: Record<string, HookFn>;
}

interface FakeSequelize {
    models: Record<string, FakeModel>;
    addHook: jest.Mock;
    hooks: Record<string, HookFn>;
}

function createFakeSequelize(models: Record<string, { rawAttributes: Record<string, any> }>): FakeSequelize {
    const globalHooks: Record<string, HookFn> = {};
    const modelsWithName: Record<string, FakeModel> = {};

    for (const [name, model] of Object.entries(models)) {
        const modelHooks: Record<string, HookFn> = {};
        modelsWithName[name] = {
            ...model,
            name,
            addHook: jest.fn((hookName: string, _label: string, fn: HookFn) => {
                modelHooks[hookName] = fn;
            }),
            hooks: modelHooks
        };
    }

    const addHook = jest.fn((hookName: string, _label: string, fn: HookFn) => {
        globalHooks[hookName] = fn;
    });

    return { models: modelsWithName, addHook, hooks: globalHooks } as FakeSequelize;
}

/** Creates a fake model instance (like what Sequelize passes to instance hooks). */
function fakeInstance(modelName: string, data: Record<string, any>, rawAttributes: Record<string, any>) {
    const constructor = { name: modelName, rawAttributes };
    return Object.assign(Object.create({ constructor }), data, { constructor });
}

// ---------------------------------------------------------------------------
// Standard models used across tests
// ---------------------------------------------------------------------------
const TENANT_MODEL_ATTRS = { id: {}, tenantId: {}, name: {} };
const NON_TENANT_MODEL_ATTRS = { id: {}, name: {} };

const standardModels = {
    Lead: { rawAttributes: TENANT_MODEL_ATTRS },
    Role: { rawAttributes: NON_TENANT_MODEL_ATTRS }
};

// ---------------------------------------------------------------------------
// Test helper: run callback inside a tenant context
// ---------------------------------------------------------------------------
function withContext(store: TenantStore, fn: () => void): void {
    tenantStorage.run(store, fn);
}

const TENANT_A: TenantStore = { tenantId: 'tenant-A', isSuperAdmin: false };
const TENANT_B: TenantStore = { tenantId: 'tenant-B', isSuperAdmin: false };
const SUPER_ADMIN: TenantStore = { tenantId: null, isSuperAdmin: true };
const NULL_TENANT: TenantStore = { tenantId: null, isSuperAdmin: false };

// ===========================================================================
describe('TenantHooks (Sequelize global hooks)', () => {
    let seq: FakeSequelize;

    beforeEach(() => {
        seq = createFakeSequelize(standardModels);
        registerTenantHooks(seq as any);
    });

    // -----------------------------------------------------------------------
    // Hook registration
    // -----------------------------------------------------------------------
    describe('registerTenantHooks', () => {
        it('should register 4 global instance-based hooks', () => {
            const hookNames = seq.addHook.mock.calls.map((c: any) => c[0]);
            expect(hookNames).toContain('beforeCreate');
            expect(hookNames).toContain('beforeBulkCreate');
            expect(hookNames).toContain('beforeUpdate');
            expect(hookNames).toContain('beforeDestroy');
            expect(hookNames).toHaveLength(4);
        });

        it('should register 3 per-model hooks on tenant-scoped models only', () => {
            const leadHookNames = seq.models.Lead.addHook.mock.calls.map((c: any) => c[0]);
            expect(leadHookNames).toContain('beforeFind');
            expect(leadHookNames).toContain('beforeBulkUpdate');
            expect(leadHookNames).toContain('beforeBulkDestroy');
            expect(leadHookNames).toHaveLength(3);

            // Role (non-tenant) should NOT have any per-model hooks
            expect(seq.models.Role.addHook).not.toHaveBeenCalled();
        });

        it('should log the count of tenant-scoped models', () => {
            // logger.debug uses structured logging with pino, so we mock the logger module
            const logger = require('../../src/config/logger').default;
            const spy = jest.spyOn(logger, 'debug').mockImplementation(() => {});
            const s = createFakeSequelize(standardModels);
            registerTenantHooks(s as any);
            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({ count: 1 }),
                expect.stringContaining('tenant-scoped models detected')
            );
            spy.mockRestore();
        });
    });

    // -----------------------------------------------------------------------
    // beforeFind (per-model hook on Lead)
    // -----------------------------------------------------------------------
    describe('beforeFind', () => {
        it('should inject tenantId into empty where', () => {
            const options: any = { where: undefined };
            withContext(TENANT_A, () => seq.models.Lead.hooks.beforeFind(options));
            expect(options.where).toEqual({ tenantId: 'tenant-A' });
        });

        it('should add tenantId to existing where object', () => {
            const options: any = { where: { status: 'NEW' } };
            withContext(TENANT_A, () => seq.models.Lead.hooks.beforeFind(options));
            expect(options.where).toEqual({ status: 'NEW', tenantId: 'tenant-A' });
        });

        it('should NOT have a beforeFind hook on non-tenant model', () => {
            // Role has no per-model hooks at all
            expect(seq.models.Role.hooks.beforeFind).toBeUndefined();
        });

        it('should skip when no ALS context exists', () => {
            const options: any = { where: {} };
            seq.models.Lead.hooks.beforeFind(options);
            expect(options.where).toEqual({});
        });

        it('should skip for super admin', () => {
            const options: any = { where: {} };
            withContext(SUPER_ADMIN, () => seq.models.Lead.hooks.beforeFind(options));
            expect(options.where).toEqual({});
        });

        it('should skip when tenantId is null (single-tenant)', () => {
            const options: any = { where: {} };
            withContext(NULL_TENANT, () => seq.models.Lead.hooks.beforeFind(options));
            expect(options.where).toEqual({});
        });

        it('should skip when TENANT_BYPASS symbol is set', () => {
            const options: any = { where: {}, [TENANT_BYPASS]: true };
            withContext(TENANT_A, () => seq.models.Lead.hooks.beforeFind(options));
            expect(options.where).toEqual({});
        });

        it('should use the correct tenant for different tenants', () => {
            const optionsA: any = { where: {} };
            const optionsB: any = { where: {} };
            withContext(TENANT_A, () => seq.models.Lead.hooks.beforeFind(optionsA));
            withContext(TENANT_B, () => seq.models.Lead.hooks.beforeFind(optionsB));
            expect(optionsA.where.tenantId).toBe('tenant-A');
            expect(optionsB.where.tenantId).toBe('tenant-B');
        });
    });

    // -----------------------------------------------------------------------
    // beforeCreate
    // -----------------------------------------------------------------------
    describe('beforeCreate', () => {
        it('should set tenantId on instance when not already set', () => {
            const instance = fakeInstance('Lead', { name: 'New Lead' }, TENANT_MODEL_ATTRS);
            withContext(TENANT_A, () => seq.hooks.beforeCreate(instance, {}));
            expect(instance.tenantId).toBe('tenant-A');
        });

        it('should keep tenantId if it matches the context', () => {
            const instance = fakeInstance('Lead', { name: 'Lead', tenantId: 'tenant-A' }, TENANT_MODEL_ATTRS);
            withContext(TENANT_A, () => seq.hooks.beforeCreate(instance, {}));
            expect(instance.tenantId).toBe('tenant-A');
        });

        it('should override mismatched tenantId with security log', () => {
            const logger = require('../../src/config/logger').default;
            const spy = jest.spyOn(logger, 'error').mockImplementation(() => {});
            const instance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
            withContext(TENANT_A, () => seq.hooks.beforeCreate(instance, {}));
            expect(instance.tenantId).toBe('tenant-A');
            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({ model: 'Lead' }),
                expect.stringContaining('Cross-tenant create attempt blocked')
            );
            spy.mockRestore();
        });

        it('should NOT touch non-tenant models', () => {
            const instance = fakeInstance('Role', { name: 'admin' }, NON_TENANT_MODEL_ATTRS);
            withContext(TENANT_A, () => seq.hooks.beforeCreate(instance, {}));
            expect(instance.tenantId).toBeUndefined();
        });

        it('should skip for super admin', () => {
            const instance = fakeInstance('Lead', { name: 'Lead' }, TENANT_MODEL_ATTRS);
            withContext(SUPER_ADMIN, () => seq.hooks.beforeCreate(instance, {}));
            expect(instance.tenantId).toBeUndefined();
        });

        it('should skip when no context', () => {
            const instance = fakeInstance('Lead', { name: 'Lead' }, TENANT_MODEL_ATTRS);
            seq.hooks.beforeCreate(instance, {});
            expect(instance.tenantId).toBeUndefined();
        });
    });

    // -----------------------------------------------------------------------
    // beforeBulkCreate
    // -----------------------------------------------------------------------
    describe('beforeBulkCreate', () => {
        it('should set tenantId on all instances', () => {
            const instances = [
                fakeInstance('Lead', { name: 'L1' }, TENANT_MODEL_ATTRS),
                fakeInstance('Lead', { name: 'L2' }, TENANT_MODEL_ATTRS)
            ];
            withContext(TENANT_A, () => seq.hooks.beforeBulkCreate(instances, {}));
            expect(instances[0].tenantId).toBe('tenant-A');
            expect(instances[1].tenantId).toBe('tenant-A');
        });

        it('should skip for empty instances array', () => {
            expect(() => seq.hooks.beforeBulkCreate([], {})).not.toThrow();
        });

        it('should skip for non-tenant models', () => {
            const instances = [fakeInstance('Role', { name: 'r1' }, NON_TENANT_MODEL_ATTRS)];
            withContext(TENANT_A, () => seq.hooks.beforeBulkCreate(instances, {}));
            expect(instances[0].tenantId).toBeUndefined();
        });

        it('should skip for super admin', () => {
            const instances = [fakeInstance('Lead', { name: 'L1' }, TENANT_MODEL_ATTRS)];
            withContext(SUPER_ADMIN, () => seq.hooks.beforeBulkCreate(instances, {}));
            expect(instances[0].tenantId).toBeUndefined();
        });
    });

    // -----------------------------------------------------------------------
    // beforeUpdate
    // -----------------------------------------------------------------------
    describe('beforeUpdate', () => {
        it('should allow update when tenantId matches context', () => {
            const instance = fakeInstance('Lead', { tenantId: 'tenant-A' }, TENANT_MODEL_ATTRS);
            expect(() => {
                withContext(TENANT_A, () => seq.hooks.beforeUpdate(instance, {}));
            }).not.toThrow();
        });

        it('should throw when updating record from different tenant', () => {
            const instance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
            expect(() => {
                withContext(TENANT_A, () => seq.hooks.beforeUpdate(instance, {}));
            }).toThrow(/Cannot update record belonging to tenant tenant-B/);
        });

        it('should allow update when instance has no tenantId yet', () => {
            const instance = fakeInstance('Lead', {}, TENANT_MODEL_ATTRS);
            expect(() => {
                withContext(TENANT_A, () => seq.hooks.beforeUpdate(instance, {}));
            }).not.toThrow();
        });

        it('should skip for non-tenant models', () => {
            const instance = fakeInstance('Role', { name: 'admin' }, NON_TENANT_MODEL_ATTRS);
            expect(() => {
                withContext(TENANT_A, () => seq.hooks.beforeUpdate(instance, {}));
            }).not.toThrow();
        });

        it('should skip for super admin', () => {
            const instance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
            expect(() => {
                withContext(SUPER_ADMIN, () => seq.hooks.beforeUpdate(instance, {}));
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // beforeBulkUpdate (per-model hook on Lead)
    // -----------------------------------------------------------------------
    describe('beforeBulkUpdate', () => {
        it('should inject tenantId into where clause', () => {
            const options: any = { where: { status: 'ACTIVE' } };
            withContext(TENANT_A, () => seq.models.Lead.hooks.beforeBulkUpdate(options));
            expect(options.where).toEqual({ status: 'ACTIVE', tenantId: 'tenant-A' });
        });

        it('should create where clause if empty', () => {
            const options: any = {};
            withContext(TENANT_A, () => seq.models.Lead.hooks.beforeBulkUpdate(options));
            expect(options.where).toEqual({ tenantId: 'tenant-A' });
        });

        it('should NOT have a beforeBulkUpdate hook on non-tenant model', () => {
            expect(seq.models.Role.hooks.beforeBulkUpdate).toBeUndefined();
        });
    });

    // -----------------------------------------------------------------------
    // beforeDestroy
    // -----------------------------------------------------------------------
    describe('beforeDestroy', () => {
        it('should allow delete when tenantId matches', () => {
            const instance = fakeInstance('Lead', { tenantId: 'tenant-A' }, TENANT_MODEL_ATTRS);
            expect(() => {
                withContext(TENANT_A, () => seq.hooks.beforeDestroy(instance, {}));
            }).not.toThrow();
        });

        it('should throw when deleting record from different tenant', () => {
            const instance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
            expect(() => {
                withContext(TENANT_A, () => seq.hooks.beforeDestroy(instance, {}));
            }).toThrow(/Cannot delete record belonging to tenant tenant-B/);
        });

        it('should allow delete when instance has no tenantId', () => {
            const instance = fakeInstance('Lead', {}, TENANT_MODEL_ATTRS);
            expect(() => {
                withContext(TENANT_A, () => seq.hooks.beforeDestroy(instance, {}));
            }).not.toThrow();
        });

        it('should skip for super admin', () => {
            const instance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
            expect(() => {
                withContext(SUPER_ADMIN, () => seq.hooks.beforeDestroy(instance, {}));
            }).not.toThrow();
        });

        it('should skip for non-tenant model', () => {
            const instance = fakeInstance('Role', { name: 'admin' }, NON_TENANT_MODEL_ATTRS);
            expect(() => {
                withContext(TENANT_A, () => seq.hooks.beforeDestroy(instance, {}));
            }).not.toThrow();
        });
    });

    // -----------------------------------------------------------------------
    // beforeBulkDestroy (per-model hook on Lead)
    // -----------------------------------------------------------------------
    describe('beforeBulkDestroy', () => {
        it('should inject tenantId into where clause', () => {
            const options: any = { where: { status: 'OLD' } };
            withContext(TENANT_A, () => seq.models.Lead.hooks.beforeBulkDestroy(options));
            expect(options.where).toEqual({ status: 'OLD', tenantId: 'tenant-A' });
        });

        it('should create where clause if missing', () => {
            const options: any = {};
            withContext(TENANT_A, () => seq.models.Lead.hooks.beforeBulkDestroy(options));
            expect(options.where).toEqual({ tenantId: 'tenant-A' });
        });

        it('should NOT have a beforeBulkDestroy hook on non-tenant model', () => {
            expect(seq.models.Role.hooks.beforeBulkDestroy).toBeUndefined();
        });
    });

    // -----------------------------------------------------------------------
    // TENANT_BYPASS across all hook types
    // -----------------------------------------------------------------------
    describe('TENANT_BYPASS symbol (per-query opt-out)', () => {
        it('should bypass beforeFind', () => {
            const options: any = { where: {}, [TENANT_BYPASS]: true };
            withContext(TENANT_A, () => seq.models.Lead.hooks.beforeFind(options));
            expect(options.where).toEqual({});
        });

        it('should bypass beforeCreate', () => {
            const instance = fakeInstance('Lead', {}, TENANT_MODEL_ATTRS);
            withContext(TENANT_A, () => seq.hooks.beforeCreate(instance, { [TENANT_BYPASS]: true }));
            expect(instance.tenantId).toBeUndefined();
        });

        it('should bypass beforeBulkUpdate', () => {
            const options: any = { where: {}, [TENANT_BYPASS]: true };
            withContext(TENANT_A, () => seq.models.Lead.hooks.beforeBulkUpdate(options));
            expect(options.where).toEqual({});
        });

        it('should bypass beforeDestroy (cross-tenant delete allowed)', () => {
            const instance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
            expect(() => {
                withContext(TENANT_A, () => seq.hooks.beforeDestroy(instance, { [TENANT_BYPASS]: true }));
            }).not.toThrow();
        });

        it('should bypass beforeBulkDestroy', () => {
            const options: any = { where: {}, [TENANT_BYPASS]: true };
            withContext(TENANT_A, () => seq.models.Lead.hooks.beforeBulkDestroy(options));
            expect(options.where).toEqual({});
        });
    });

    // -----------------------------------------------------------------------
    // Integration-style: multiple hooks in sequence
    // -----------------------------------------------------------------------
    describe('end-to-end scoping scenarios', () => {
        it('should scope find + create in same request context', () => {
            withContext(TENANT_A, () => {
                // Simulate find (per-model hook)
                const findOpts: any = { where: { status: 'NEW' } };
                seq.models.Lead.hooks.beforeFind(findOpts);
                expect(findOpts.where.tenantId).toBe('tenant-A');

                // Simulate create (global hook)
                const instance = fakeInstance('Lead', { name: 'Test' }, TENANT_MODEL_ATTRS);
                seq.hooks.beforeCreate(instance, {});
                expect(instance.tenantId).toBe('tenant-A');
            });
        });

        it('should prevent tenant A from modifying tenant B data', () => {
            withContext(TENANT_A, () => {
                // Cannot update tenant B's record
                const updateInstance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
                expect(() => seq.hooks.beforeUpdate(updateInstance, {})).toThrow();

                // Cannot delete tenant B's record
                const deleteInstance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
                expect(() => seq.hooks.beforeDestroy(deleteInstance, {})).toThrow();
            });
        });

        it('should allow super admin to operate on any tenant data', () => {
            withContext(SUPER_ADMIN, () => {
                // Find without tenant filter (per-model hook)
                const findOpts: any = { where: {} };
                seq.models.Lead.hooks.beforeFind(findOpts);
                expect(findOpts.where.tenantId).toBeUndefined();

                // Create without auto-setting tenantId (global hook)
                const instance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
                seq.hooks.beforeCreate(instance, {});
                expect(instance.tenantId).toBe('tenant-B'); // preserved, not overridden

                // Update cross-tenant
                const updateInstance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
                expect(() => seq.hooks.beforeUpdate(updateInstance, {})).not.toThrow();

                // Delete cross-tenant
                const deleteInstance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
                expect(() => seq.hooks.beforeDestroy(deleteInstance, {})).not.toThrow();
            });
        });
    });
});
