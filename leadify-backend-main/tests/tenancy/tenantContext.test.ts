import { describe, it, expect } from '@jest/globals';
import {
    tenantStorage,
    getTenantContext,
    runWithTenantContext,
    withoutTenantScope,
    getTenantFilterForRawQuery,
    TENANT_BYPASS,
    TenantStore
} from '../../src/middleware/tenantContext';

describe('TenantContext (AsyncLocalStorage)', () => {
    // --------------------------------------------------------------------------
    // 1. getTenantContext — outside any ALS scope
    // --------------------------------------------------------------------------
    describe('getTenantContext', () => {
        it('should return null when no context is active', () => {
            expect(getTenantContext()).toBeNull();
        });

        it('should return the store when inside tenantStorage.run()', () => {
            const store: TenantStore = { tenantId: 'tenant-1', isSuperAdmin: false };
            tenantStorage.run(store, () => {
                const ctx = getTenantContext();
                expect(ctx).not.toBeNull();
                expect(ctx!.tenantId).toBe('tenant-1');
                expect(ctx!.isSuperAdmin).toBe(false);
            });
        });

        it('should return null again after run() exits', () => {
            const store: TenantStore = { tenantId: 'tenant-1', isSuperAdmin: false };
            tenantStorage.run(store, () => { /* noop */ });
            expect(getTenantContext()).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 2. Context propagation through async boundaries
    // --------------------------------------------------------------------------
    describe('async propagation', () => {
        it('should propagate through Promises', async () => {
            const store: TenantStore = { tenantId: 'tenant-async', isSuperAdmin: false };
            await tenantStorage.run(store, async () => {
                await new Promise<void>(resolve => setTimeout(resolve, 10));
                const ctx = getTenantContext();
                expect(ctx).not.toBeNull();
                expect(ctx!.tenantId).toBe('tenant-async');
            });
        });

        it('should propagate through nested async/await calls', async () => {
            const store: TenantStore = { tenantId: 'tenant-nested', isSuperAdmin: false };

            async function innerAsync(): Promise<string | null> {
                await Promise.resolve();
                return getTenantContext()?.tenantId ?? null;
            }

            const result = await tenantStorage.run(store, async () => {
                return await innerAsync();
            });

            expect(result).toBe('tenant-nested');
        });

        it('should isolate concurrent contexts', async () => {
            const results: string[] = [];

            const task1 = tenantStorage.run(
                { tenantId: 'A', isSuperAdmin: false },
                async () => {
                    await new Promise<void>(r => setTimeout(r, 20));
                    results.push(getTenantContext()!.tenantId!);
                }
            );

            const task2 = tenantStorage.run(
                { tenantId: 'B', isSuperAdmin: false },
                async () => {
                    await new Promise<void>(r => setTimeout(r, 10));
                    results.push(getTenantContext()!.tenantId!);
                }
            );

            await Promise.all([task1, task2]);

            // B finishes first due to shorter delay, but each sees its own context
            expect(results).toContain('A');
            expect(results).toContain('B');
            expect(results).toHaveLength(2);
        });
    });

    // --------------------------------------------------------------------------
    // 3. runWithTenantContext
    // --------------------------------------------------------------------------
    describe('runWithTenantContext', () => {
        it('should establish context for the callback', () => {
            const store: TenantStore = { tenantId: 'job-tenant', isSuperAdmin: false };
            const result = runWithTenantContext(store, () => {
                return getTenantContext()?.tenantId;
            });
            expect(result).toBe('job-tenant');
        });

        it('should support super admin context', () => {
            const store: TenantStore = { tenantId: null, isSuperAdmin: true };
            runWithTenantContext(store, () => {
                const ctx = getTenantContext();
                expect(ctx!.isSuperAdmin).toBe(true);
                expect(ctx!.tenantId).toBeNull();
            });
        });

        it('should return the callback return value', () => {
            const store: TenantStore = { tenantId: 't', isSuperAdmin: false };
            const val = runWithTenantContext(store, () => 42);
            expect(val).toBe(42);
        });

        it('should work with async callbacks', async () => {
            const store: TenantStore = { tenantId: 'async-job', isSuperAdmin: false };
            const result = await runWithTenantContext(store, async () => {
                await new Promise<void>(r => setTimeout(r, 5));
                return getTenantContext()?.tenantId;
            });
            expect(result).toBe('async-job');
        });
    });

    // --------------------------------------------------------------------------
    // 4. withoutTenantScope
    // --------------------------------------------------------------------------
    describe('withoutTenantScope', () => {
        it('should suppress context inside the callback', () => {
            const store: TenantStore = { tenantId: 'outer', isSuperAdmin: false };
            tenantStorage.run(store, () => {
                // Outer context is active
                expect(getTenantContext()!.tenantId).toBe('outer');

                // Inside withoutTenantScope, context should be null
                withoutTenantScope(() => {
                    expect(getTenantContext()).toBeNull();
                });

                // Outer context is restored after
                expect(getTenantContext()!.tenantId).toBe('outer');
            });
        });

        it('should return the callback return value', () => {
            const result = withoutTenantScope(() => 'cross-tenant-data');
            expect(result).toBe('cross-tenant-data');
        });
    });

    // --------------------------------------------------------------------------
    // 5. getTenantFilterForRawQuery
    // --------------------------------------------------------------------------
    describe('getTenantFilterForRawQuery', () => {
        it('should return null when no context is active', () => {
            expect(getTenantFilterForRawQuery()).toBeNull();
        });

        it('should return null for super admin', () => {
            const store: TenantStore = { tenantId: null, isSuperAdmin: true };
            tenantStorage.run(store, () => {
                expect(getTenantFilterForRawQuery()).toBeNull();
            });
        });

        it('should return null when tenantId is null (single-tenant)', () => {
            const store: TenantStore = { tenantId: null, isSuperAdmin: false };
            tenantStorage.run(store, () => {
                expect(getTenantFilterForRawQuery()).toBeNull();
            });
        });

        it('should return tenantId filter for regular tenant user', () => {
            const store: TenantStore = { tenantId: 'tenant-sql', isSuperAdmin: false };
            tenantStorage.run(store, () => {
                const filter = getTenantFilterForRawQuery();
                expect(filter).toEqual({ tenantId: 'tenant-sql' });
            });
        });
    });

    // --------------------------------------------------------------------------
    // 6. TENANT_BYPASS symbol
    // --------------------------------------------------------------------------
    describe('TENANT_BYPASS', () => {
        it('should be a unique symbol', () => {
            expect(typeof TENANT_BYPASS).toBe('symbol');
        });

        it('should be usable as an object key', () => {
            const options: any = { where: {}, [TENANT_BYPASS]: true };
            expect(options[TENANT_BYPASS]).toBe(true);
        });

        it('should not collide with string keys', () => {
            const options: any = { TENANT_BYPASS: 'string-value', [TENANT_BYPASS]: true };
            expect(options['TENANT_BYPASS']).toBe('string-value');
            expect(options[TENANT_BYPASS]).toBe(true);
        });
    });
});
