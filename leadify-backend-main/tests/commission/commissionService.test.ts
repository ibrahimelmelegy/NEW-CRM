
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/commission/commissionModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/deal/model/dealModel');
jest.mock('../../src/config/db', () => ({
    sequelize: {
        transaction: jest.fn(() => Promise.resolve({
            commit: jest.fn(),
            rollback: jest.fn(),
        })),
    },
}));
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

import commissionService from '../../src/commission/commissionService';
import Commission from '../../src/commission/commissionModel';
import Deal from '../../src/deal/model/dealModel';
import { io } from '../../src/server';

describe('CommissionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. create
    // --------------------------------------------------------------------------
    describe('create', () => {
        it('should create a commission record and emit event', async () => {
            const mockCommission = { id: 1, staffId: 2, amount: 500, status: 'PENDING' };
            (Commission.create as jest.Mock<any>).mockResolvedValue(mockCommission);

            const result = await commissionService.create({
                staffId: 2,
                amount: 500,
                dealId: 'deal-1',
                status: 'PENDING',
            });

            expect(result).toEqual(mockCommission);
            expect(io.emit).toHaveBeenCalledWith('commission:created', expect.objectContaining({ id: 1 }));
        });
    });

    // --------------------------------------------------------------------------
    // 2. getAll
    // --------------------------------------------------------------------------
    describe('getAll', () => {
        it('should return paginated commissions', async () => {
            const mockRows = [{ id: 1, amount: 500 }];
            (Commission.findAndCountAll as jest.Mock<any>).mockResolvedValue({
                rows: mockRows,
                count: 1,
            });

            const result = await commissionService.getAll({ page: 1, limit: 10 });

            expect(result.docs).toEqual(mockRows);
            expect(result.pagination.totalItems).toBe(1);
        });

        it('should apply status filter', async () => {
            (Commission.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await commissionService.getAll({ page: 1, limit: 10, status: 'PAID' });

            const callArgs = (Commission.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.status).toBe('PAID');
        });

        it('should apply staffId filter', async () => {
            (Commission.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await commissionService.getAll({ page: 1, limit: 10, staffId: 5 });

            const callArgs = (Commission.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.staffId).toBe(5);
        });
    });

    // --------------------------------------------------------------------------
    // 3. update
    // --------------------------------------------------------------------------
    describe('update', () => {
        it('should update a commission', async () => {
            const mockCommission = {
                id: 1,
                status: 'PENDING',
                paidAt: null,
                update: jest.fn().mockResolvedValue(true),
            };
            (Commission.findByPk as jest.Mock<any>).mockResolvedValue(mockCommission);

            const result = await commissionService.update(1, { status: 'APPROVED' });

            expect(mockCommission.update).toHaveBeenCalledWith({ status: 'APPROVED' });
        });

        it('should set paidAt when status changes to PAID', async () => {
            const mockCommission = {
                id: 1,
                status: 'APPROVED',
                paidAt: null,
                update: jest.fn().mockResolvedValue(true),
            };
            (Commission.findByPk as jest.Mock<any>).mockResolvedValue(mockCommission);

            await commissionService.update(1, { status: 'PAID' });

            expect(mockCommission.update).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'PAID', paidAt: expect.any(Date) })
            );
        });

        it('should return null when commission not found', async () => {
            (Commission.findByPk as jest.Mock<any>).mockResolvedValue(null);

            const result = await commissionService.update(999, { status: 'PAID' });
            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 4. delete
    // --------------------------------------------------------------------------
    describe('delete', () => {
        it('should delete a commission and return true', async () => {
            const mockCommission = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
            (Commission.findByPk as jest.Mock<any>).mockResolvedValue(mockCommission);

            const result = await commissionService.delete(1);

            expect(result).toBe(true);
            expect(mockCommission.destroy).toHaveBeenCalled();
        });

        it('should return false when commission not found', async () => {
            (Commission.findByPk as jest.Mock<any>).mockResolvedValue(null);

            const result = await commissionService.delete(999);
            expect(result).toBe(false);
        });
    });

    // --------------------------------------------------------------------------
    // 5. calculateCommission
    // --------------------------------------------------------------------------
    describe('calculateCommission', () => {
        it('should calculate commission at default 5% rate', async () => {
            const mockDeal = { id: 'deal-1', name: 'Big Deal', price: 10000 };
            (Deal.findByPk as jest.Mock<any>).mockResolvedValue(mockDeal);
            (Commission.create as jest.Mock<any>).mockImplementation((data: any) => Promise.resolve({ id: 1, ...data }));

            const result = await commissionService.calculateCommission('deal-1', 2);

            expect(result.amount).toBe(500); // 10000 * 5% = 500
            expect(result.rate).toBe(5);
            expect(result.status).toBe('PENDING');
        });

        it('should calculate commission with custom rate', async () => {
            const mockDeal = { id: 'deal-1', name: 'Big Deal', price: 10000 };
            (Deal.findByPk as jest.Mock<any>).mockResolvedValue(mockDeal);
            (Commission.create as jest.Mock<any>).mockImplementation((data: any) => Promise.resolve({ id: 1, ...data }));

            const result = await commissionService.calculateCommission('deal-1', 2, undefined, 10);

            expect(result.amount).toBe(1000); // 10000 * 10% = 1000
        });

        it('should throw when deal not found', async () => {
            (Deal.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(commissionService.calculateCommission('nonexistent', 2))
                .rejects.toThrow('Deal nonexistent not found');
        });

        it('should throw when deal has no positive value', async () => {
            const mockDeal = { id: 'deal-1', name: 'Free Deal', price: 0 };
            (Deal.findByPk as jest.Mock<any>).mockResolvedValue(mockDeal);

            await expect(commissionService.calculateCommission('deal-1', 2))
                .rejects.toThrow('Deal has no positive value');
        });
    });

    // --------------------------------------------------------------------------
    // 6. calculateTieredCommission
    // --------------------------------------------------------------------------
    describe('calculateTieredCommission', () => {
        it('should calculate tiered commission correctly', () => {
            const tiers = [
                { upTo: 10000, rate: 0.03 },
                { upTo: 50000, rate: 0.05 },
                { upTo: Infinity, rate: 0.07 },
            ];

            const result = commissionService.calculateTieredCommission(70000, tiers);

            // first 10K -> 10000 * 0.03 = 300
            // next 40K -> 40000 * 0.05 = 2000
            // last 20K -> 20000 * 0.07 = 1400
            // total = 3700
            expect(result.total).toBe(3700);
            expect(result.breakdown).toHaveLength(3);
        });

        it('should return zero for non-positive deal value', () => {
            const result = commissionService.calculateTieredCommission(0, [{ upTo: 10000, rate: 0.05 }]);

            expect(result.total).toBe(0);
            expect(result.breakdown).toHaveLength(0);
        });

        it('should handle single-tier commission', () => {
            const tiers = [{ upTo: Infinity, rate: 0.10 }];

            const result = commissionService.calculateTieredCommission(5000, tiers);

            expect(result.total).toBe(500); // 5000 * 0.10
            expect(result.breakdown).toHaveLength(1);
        });
    });

    // --------------------------------------------------------------------------
    // 7. markAsPaid
    // --------------------------------------------------------------------------
    describe('markAsPaid', () => {
        it('should mark commission as PAID', async () => {
            const mockCommission = {
                id: 1,
                status: 'APPROVED',
                staffId: 2,
                amount: 500,
                update: jest.fn().mockResolvedValue(true),
            };
            (Commission.findByPk as jest.Mock<any>).mockResolvedValue(mockCommission);

            await commissionService.markAsPaid(1);

            expect(mockCommission.update).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'PAID', paidAt: expect.any(Date) })
            );
            expect(io.emit).toHaveBeenCalledWith('commission:paid', expect.any(Object));
        });

        it('should return commission as-is if already paid', async () => {
            const mockCommission = { id: 1, status: 'PAID' };
            (Commission.findByPk as jest.Mock<any>).mockResolvedValue(mockCommission);

            const result = await commissionService.markAsPaid(1);

            expect(result).toEqual(mockCommission);
        });

        it('should return null when commission not found', async () => {
            (Commission.findByPk as jest.Mock<any>).mockResolvedValue(null);

            const result = await commissionService.markAsPaid(999);
            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 8. onDealWon
    // --------------------------------------------------------------------------
    describe('onDealWon', () => {
        it('should return existing commission if already exists for deal+user', async () => {
            const existingCommission = { id: 1, dealId: 'deal-1', staffId: 2, amount: 500 };
            (Commission.findOne as jest.Mock<any>).mockResolvedValue(existingCommission);

            const result = await commissionService.onDealWon('deal-1', 2);

            expect(result).toEqual(existingCommission);
            expect(Deal.findByPk).not.toHaveBeenCalled(); // Should not recalculate
        });

        it('should calculate and create commission if none exists', async () => {
            (Commission.findOne as jest.Mock<any>).mockResolvedValue(null);
            const mockDeal = { id: 'deal-1', name: 'Won Deal', price: 20000 };
            (Deal.findByPk as jest.Mock<any>).mockResolvedValue(mockDeal);
            (Commission.create as jest.Mock<any>).mockImplementation((data: any) => Promise.resolve({ id: 2, ...data }));

            const result = await commissionService.onDealWon('deal-1', 2);

            expect(result.amount).toBe(1000); // 20000 * 5% = 1000
        });
    });

    // --------------------------------------------------------------------------
    // 9. bulkPayout
    // --------------------------------------------------------------------------
    describe('bulkPayout', () => {
        it('should mark multiple commissions as PAID', async () => {
            (Commission.update as jest.Mock<any>).mockResolvedValue([3]); // 3 affected

            const result = await commissionService.bulkPayout([1, 2, 3]);

            expect(result.paidCount).toBe(3);
            expect(io.emit).toHaveBeenCalledWith('commission:bulkPaid', { count: 3 });
        });
    });
});
