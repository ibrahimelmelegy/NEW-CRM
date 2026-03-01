import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { tenantStorage, TENANT_BYPASS, TenantStore } from '../../src/middleware/tenantContext';
import { registerTenantHooks } from '../../src/config/tenantHooks';

// ---------------------------------------------------------------------------
// Helpers: fake Sequelize instance with hook capture
// ---------------------------------------------------------------------------

type HookFn = (...args: any[]) => any;

interface FakeSequelize {
    models: Record<string, { rawAttributes: Record<string, any>; name: string }>;
    addHook: jest.Mock;
    hooks: Record<string, HookFn>;
}

function createFakeSequelize(models: Record<string, { rawAttributes: Record<string, any> }>): FakeSequelize {
    const hooks: Record<string, HookFn> = {};
    const modelsWithName: Record<string, any> = {};

    for (const [name, model] of Object.entries(models)) {
        modelsWithName[name] = { ...model, name };
    }

    const addHook = jest.fn((hookName: string, _label: string, fn: HookFn) => {
        hooks[hookName] = fn;
    });

    return { models: modelsWithName, addHook, hooks } as FakeSequelize;
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
        it('should register all 7 hooks', () => {
            const hookNames = seq.addHook.mock.calls.map((c: any) => c[0]);
            expect(hookNames).toContain('beforeFind');
            expect(hookNames).toContain('beforeCreate');
            expect(hookNames).toContain('beforeBulkCreate');
            expect(hookNames).toContain('beforeUpdate');
            expect(hookNames).toContain('beforeBulkUpdate');
            expect(hookNames).toContain('beforeDestroy');
            expect(hookNames).toContain('beforeBulkDestroy');
            expect(hookNames).toHaveLength(7);
        });

        it('should log the count of tenant-scoped models', () => {
            const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const s = createFakeSequelize(standardModels);
            registerTenantHooks(s as any);
            expect(spy).toHaveBeenCalledWith(
                expect.stringContaining('1 tenant-scoped models detected')
            );
            spy.mockRestore();
        });
    });

    // -----------------------------------------------------------------------
    // beforeFind
    // -----------------------------------------------------------------------
    describe('beforeFind', () => {
        it('should inject tenantId into empty where', () => {
            const options: any = { model: seq.models.Lead, where: undefined };
            withContext(TENANT_A, () => seq.hooks.beforeFind(options));
            expect(options.where).toEqual({ tenantId: 'tenant-A' });
        });

        it('should add tenantId to existing where object', () => {
            const options: any = { model: seq.models.Lead, where: { status: 'NEW' } };
            withContext(TENANT_A, () => seq.hooks.beforeFind(options));
            expect(options.where).toEqual({ status: 'NEW', tenantId: 'tenant-A' });
        });

        it('should NOT modify where for non-tenant model', () => {
            const options: any = { model: seq.models.Role, where: { name: 'admin' } };
            withContext(TENANT_A, () => seq.hooks.beforeFind(options));
            expect(options.where).toEqual({ name: 'admin' });
        });

        it('should skip when no ALS context exists', () => {
            const options: any = { model: seq.models.Lead, where: {} };
            seq.hooks.beforeFind(options);
            expect(options.where).toEqual({});
        });

        it('should skip for super admin', () => {
            const options: any = { model: seq.models.Lead, where: {} };
            withContext(SUPER_ADMIN, () => seq.hooks.beforeFind(options));
            expect(options.where).toEqual({});
        });

        it('should skip when tenantId is null (single-tenant)', () => {
            const options: any = { model: seq.models.Lead, where: {} };
            withContext(NULL_TENANT, () => seq.hooks.beforeFind(options));
            expect(options.where).toEqual({});
        });

        it('should skip when TENANT_BYPASS symbol is set', () => {
            const options: any = { model: seq.models.Lead, where: {}, [TENANT_BYPASS]: true };
            withContext(TENANT_A, () => seq.hooks.beforeFind(options));
            expect(options.where).toEqual({});
        });

        it('should use the correct tenant for different tenants', () => {
            const optionsA: any = { model: seq.models.Lead, where: {} };
            const optionsB: any = { model: seq.models.Lead, where: {} };
            withContext(TENANT_A, () => seq.hooks.beforeFind(optionsA));
            withContext(TENANT_B, () => seq.hooks.beforeFind(optionsB));
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
            const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const instance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
            withContext(TENANT_A, () => seq.hooks.beforeCreate(instance, {}));
            expect(instance.tenantId).toBe('tenant-A');
            expect(spy).toHaveBeenCalledWith(expect.stringContaining('Cross-tenant create attempt blocked'));
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
    // beforeBulkUpdate
    // -----------------------------------------------------------------------
    describe('beforeBulkUpdate', () => {
        it('should inject tenantId into where clause', () => {
            const options: any = { model: seq.models.Lead, where: { status: 'ACTIVE' } };
            withContext(TENANT_A, () => seq.hooks.beforeBulkUpdate(options));
            expect(options.where).toEqual({ status: 'ACTIVE', tenantId: 'tenant-A' });
        });

        it('should create where clause if empty', () => {
            const options: any = { model: seq.models.Lead };
            withContext(TENANT_A, () => seq.hooks.beforeBulkUpdate(options));
            expect(options.where).toEqual({ tenantId: 'tenant-A' });
        });

        it('should skip for non-tenant model', () => {
            const options: any = { model: seq.models.Role, where: { name: 'admin' } };
            withContext(TENANT_A, () => seq.hooks.beforeBulkUpdate(options));
            expect(options.where).toEqual({ name: 'admin' });
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
    // beforeBulkDestroy
    // -----------------------------------------------------------------------
    describe('beforeBulkDestroy', () => {
        it('should inject tenantId into where clause', () => {
            const options: any = { model: seq.models.Lead, where: { status: 'OLD' } };
            withContext(TENANT_A, () => seq.hooks.beforeBulkDestroy(options));
            expect(options.where).toEqual({ status: 'OLD', tenantId: 'tenant-A' });
        });

        it('should create where clause if missing', () => {
            const options: any = { model: seq.models.Lead };
            withContext(TENANT_A, () => seq.hooks.beforeBulkDestroy(options));
            expect(options.where).toEqual({ tenantId: 'tenant-A' });
        });

        it('should skip for non-tenant model', () => {
            const options: any = { model: seq.models.Role, where: {} };
            withContext(TENANT_A, () => seq.hooks.beforeBulkDestroy(options));
            expect(options.where).toEqual({});
        });
    });

    // -----------------------------------------------------------------------
    // TENANT_BYPASS across all hook types
    // -----------------------------------------------------------------------
    describe('TENANT_BYPASS symbol (per-query opt-out)', () => {
        it('should bypass beforeFind', () => {
            const options: any = { model: seq.models.Lead, where: {}, [TENANT_BYPASS]: true };
            withContext(TENANT_A, () => seq.hooks.beforeFind(options));
            expect(options.where).toEqual({});
        });

        it('should bypass beforeCreate', () => {
            const instance = fakeInstance('Lead', {}, TENANT_MODEL_ATTRS);
            withContext(TENANT_A, () => seq.hooks.beforeCreate(instance, { [TENANT_BYPASS]: true }));
            expect(instance.tenantId).toBeUndefined();
        });

        it('should bypass beforeBulkUpdate', () => {
            const options: any = { model: seq.models.Lead, where: {}, [TENANT_BYPASS]: true };
            withContext(TENANT_A, () => seq.hooks.beforeBulkUpdate(options));
            expect(options.where).toEqual({});
        });

        it('should bypass beforeDestroy (cross-tenant delete allowed)', () => {
            const instance = fakeInstance('Lead', { tenantId: 'tenant-B' }, TENANT_MODEL_ATTRS);
            expect(() => {
                withContext(TENANT_A, () => seq.hooks.beforeDestroy(instance, { [TENANT_BYPASS]: true }));
            }).not.toThrow();
        });

        it('should bypass beforeBulkDestroy', () => {
            const options: any = { model: seq.models.Lead, where: {}, [TENANT_BYPASS]: true };
            withContext(TENANT_A, () => seq.hooks.beforeBulkDestroy(options));
            expect(options.where).toEqual({});
        });
    });

    // -----------------------------------------------------------------------
    // Integration-style: multiple hooks in sequence
    // -----------------------------------------------------------------------
    describe('end-to-end scoping scenarios', () => {
        it('should scope find + create in same request context', () => {
            withContext(TENANT_A, () => {
                // Simulate find
                const findOpts: any = { model: seq.models.Lead, where: { status: 'NEW' } };
                seq.hooks.beforeFind(findOpts);
                expect(findOpts.where.tenantId).toBe('tenant-A');

                // Simulate create
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
                // Find without tenant filter
                const findOpts: any = { model: seq.models.Lead, where: {} };
                seq.hooks.beforeFind(findOpts);
                expect(findOpts.where.tenantId).toBeUndefined();

                // Create without auto-setting tenantId
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

    // -----------------------------------------------------------------------
    // Model with alternative option shape (Model vs model key)
    // -----------------------------------------------------------------------
    describe('Model key resolution', () => {
        it('should resolve model from options.Model (capital M)', () => {
            const options: any = { Model: seq.models.Lead, where: {} };
            withContext(TENANT_A, () => seq.hooks.beforeFind(options));
            expect(options.where.tenantId).toBe('tenant-A');
        });

        it('should resolve model from options.model (lowercase)', () => {
            const options: any = { model: seq.models.Lead, where: {} };
            withContext(TENANT_A, () => seq.hooks.beforeFind(options));
            expect(options.where.tenantId).toBe('tenant-A');
        });
    });
});
