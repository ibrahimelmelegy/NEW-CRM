
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import loyaltyService from '../../src/loyalty/loyaltyService';
import { LoyaltyProgram, LoyaltyPoints } from '../../src/loyalty/loyaltyModel';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
jest.mock('../../src/loyalty/loyaltyModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/server', () => ({ io: { emit: jest.fn() } }));

jest.mock('../../src/utils/pagination', () => ({
    clampPagination: jest.fn((q: any) => ({
        page: q.page || 1,
        limit: q.limit || 10,
        offset: ((q.page || 1) - 1) * (q.limit || 10),
    })),
}));

describe('LoyaltyService', () => {
    const mockProgram: any = {
        id: 1,
        name: 'VIP Program',
        status: 'ACTIVE',
        pointsPerCurrency: 0.1,
        tenantId: 'tenant-1',
        update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    const mockPoints: any = {
        id: 1,
        clientId: 'client-1',
        programId: 1,
        points: 100,
        transactionType: 'EARN',
        tenantId: 'tenant-1',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // createProgram
    // --------------------------------------------------------------------------
    describe('createProgram', () => {
        it('should create a loyalty program', async () => {
            (LoyaltyProgram.create as jest.Mock<any>).mockResolvedValue(mockProgram);
            const result = await loyaltyService.createProgram({ name: 'VIP Program' }, 'tenant-1');
            expect(LoyaltyProgram.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'VIP Program', tenantId: 'tenant-1' })
            );
            expect(result).toEqual(mockProgram);
        });
    });

    // --------------------------------------------------------------------------
    // getPrograms
    // --------------------------------------------------------------------------
    describe('getPrograms', () => {
        it('should return paginated programs', async () => {
            (LoyaltyProgram.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockProgram], count: 1 });
            const result = await loyaltyService.getPrograms({}, 'tenant-1');
            expect(result.docs).toHaveLength(1);
            expect(result.pagination.totalItems).toBe(1);
        });
    });

    // --------------------------------------------------------------------------
    // updateProgram
    // --------------------------------------------------------------------------
    describe('updateProgram', () => {
        it('should update the program when found', async () => {
            (LoyaltyProgram.findByPk as jest.Mock<any>).mockResolvedValue(mockProgram);
            const result = await loyaltyService.updateProgram(1, { name: 'Updated' });
            expect(mockProgram.update).toHaveBeenCalledWith({ name: 'Updated' });
            expect(result).toEqual(mockProgram);
        });

        it('should return null when program not found', async () => {
            (LoyaltyProgram.findByPk as jest.Mock<any>).mockResolvedValue(null);
            const result = await loyaltyService.updateProgram(999, {});
            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // deleteProgram
    // --------------------------------------------------------------------------
    describe('deleteProgram', () => {
        it('should delete and return true', async () => {
            (LoyaltyProgram.findByPk as jest.Mock<any>).mockResolvedValue(mockProgram);
            const result = await loyaltyService.deleteProgram(1);
            expect(mockProgram.destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should return false when not found', async () => {
            (LoyaltyProgram.findByPk as jest.Mock<any>).mockResolvedValue(null);
            const result = await loyaltyService.deleteProgram(999);
            expect(result).toBe(false);
        });
    });

    // --------------------------------------------------------------------------
    // getClientBalance
    // --------------------------------------------------------------------------
    describe('getClientBalance', () => {
        it('should calculate balance as earned minus redeemed', async () => {
            (LoyaltyPoints.sum as jest.Mock<any>)
                .mockResolvedValueOnce(500)  // earned
                .mockResolvedValueOnce(100); // redeemed
            const result = await loyaltyService.getClientBalance('client-1', 1);
            expect(result.balance).toBe(400);
            expect(result.earned).toBe(500);
            expect(result.redeemed).toBe(100);
        });

        it('should handle zero points gracefully', async () => {
            (LoyaltyPoints.sum as jest.Mock<any>)
                .mockResolvedValueOnce(0)
                .mockResolvedValueOnce(0);
            const result = await loyaltyService.getClientBalance('client-1', 1);
            expect(result.balance).toBe(0);
        });
    });

    // --------------------------------------------------------------------------
    // calculateTier
    // --------------------------------------------------------------------------
    describe('calculateTier', () => {
        it('should return BRONZE for 0 points', async () => {
            (LoyaltyPoints.sum as jest.Mock<any>).mockResolvedValue(0);
            const result = await loyaltyService.calculateTier('client-1');
            expect(result.currentTier).toBe('BRONZE');
            expect(result.nextTier).toBe('SILVER');
        });

        it('should return SILVER for 1000 points', async () => {
            (LoyaltyPoints.sum as jest.Mock<any>).mockResolvedValue(1000);
            const result = await loyaltyService.calculateTier('client-1');
            expect(result.currentTier).toBe('SILVER');
        });

        it('should return GOLD for 5000 points', async () => {
            (LoyaltyPoints.sum as jest.Mock<any>).mockResolvedValue(5000);
            const result = await loyaltyService.calculateTier('client-1');
            expect(result.currentTier).toBe('GOLD');
        });

        it('should return PLATINUM for 20000+ points with no next tier', async () => {
            (LoyaltyPoints.sum as jest.Mock<any>).mockResolvedValue(25000);
            const result = await loyaltyService.calculateTier('client-1');
            expect(result.currentTier).toBe('PLATINUM');
            expect(result.nextTier).toBeNull();
            expect(result.pointsToNextTier).toBe(0);
        });
    });

    // --------------------------------------------------------------------------
    // redeemPoints
    // --------------------------------------------------------------------------
    describe('redeemPoints', () => {
        it('should create REDEEM transaction when balance is sufficient', async () => {
            (LoyaltyPoints.sum as jest.Mock<any>)
                .mockResolvedValueOnce(1000) // earned
                .mockResolvedValueOnce(100)  // redeemed
                .mockResolvedValueOnce(0);   // expired

            const mockTx = { id: 2, points: 200, transactionType: 'REDEEM' };
            (LoyaltyPoints.create as jest.Mock<any>).mockResolvedValue(mockTx);

            const result = await loyaltyService.redeemPoints('client-1', 1, 200);
            expect(result.redeemedAmount).toBe(200);
            expect(result.newBalance).toBe(700); // 1000 - 100 - 0 - 200
            expect(LoyaltyPoints.create).toHaveBeenCalledWith(
                expect.objectContaining({ transactionType: 'REDEEM', points: 200 })
            );
        });

        it('should throw when balance is insufficient', async () => {
            (LoyaltyPoints.sum as jest.Mock<any>)
                .mockResolvedValueOnce(100) // earned
                .mockResolvedValueOnce(50)  // redeemed
                .mockResolvedValueOnce(0);  // expired

            await expect(loyaltyService.redeemPoints('client-1', 1, 100))
                .rejects.toThrow(/Insufficient points balance/);
        });

        it('should throw when amount is zero or negative', async () => {
            await expect(loyaltyService.redeemPoints('client-1', 1, 0))
                .rejects.toThrow('Redemption amount must be positive');
            await expect(loyaltyService.redeemPoints('client-1', 1, -5))
                .rejects.toThrow('Redemption amount must be positive');
        });
    });

    // --------------------------------------------------------------------------
    // autoEarnPoints
    // --------------------------------------------------------------------------
    describe('autoEarnPoints', () => {
        it('should earn points based on deal value and program rate', async () => {
            (LoyaltyProgram.findByPk as jest.Mock<any>).mockResolvedValue(mockProgram);
            (LoyaltyPoints.sum as jest.Mock<any>).mockResolvedValue(0);
            (LoyaltyPoints.create as jest.Mock<any>).mockResolvedValue(mockPoints);

            const result = await loyaltyService.autoEarnPoints('client-1', 1000, 1);
            // rate = 0.1, so 1000 * 0.1 = 100 points
            expect(result.pointsEarned).toBe(100);
        });

        it('should throw when program not found', async () => {
            (LoyaltyProgram.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(loyaltyService.autoEarnPoints('client-1', 1000, 999))
                .rejects.toThrow('Loyalty program not found');
        });

        it('should throw when program is not active', async () => {
            (LoyaltyProgram.findByPk as jest.Mock<any>).mockResolvedValue({ ...mockProgram, status: 'INACTIVE' });
            await expect(loyaltyService.autoEarnPoints('client-1', 1000, 1))
                .rejects.toThrow('Loyalty program is not active');
        });
    });
});
