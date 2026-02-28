
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import warrantyService from '../../src/warranty/warrantyService';
import { Warranty, WarrantyClaim } from '../../src/warranty/warrantyModel';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
jest.mock('../../src/warranty/warrantyModel');
jest.mock('../../src/client/clientModel');
jest.mock('../../src/server', () => ({ io: { emit: jest.fn() } }));

jest.mock('../../src/utils/pagination', () => ({
    clampPagination: jest.fn((q: any) => ({
        page: q.page || 1,
        limit: q.limit || 10,
        offset: ((q.page || 1) - 1) * (q.limit || 10),
    })),
}));

describe('WarrantyService', () => {
    const mockWarranty: any = {
        id: 1,
        productName: 'Widget Pro',
        serialNumber: 'SN-001',
        status: 'ACTIVE',
        type: 'STANDARD',
        startDate: '2025-01-01',
        endDate: '2027-01-01',
        client: { id: 'c1', name: 'Client' },
        update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    const mockClaim: any = {
        id: 1,
        warrantyId: 1,
        status: 'OPEN',
        resolvedAt: null,
        createdAt: '2026-01-01',
        update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // createWarranty
    // --------------------------------------------------------------------------
    describe('createWarranty', () => {
        it('should create a warranty record', async () => {
            (Warranty.create as jest.Mock<any>).mockResolvedValue(mockWarranty);
            const result = await warrantyService.createWarranty({ productName: 'Widget Pro' }, 'tenant-1');
            expect(Warranty.create).toHaveBeenCalledWith(
                expect.objectContaining({ productName: 'Widget Pro', tenantId: 'tenant-1' })
            );
            expect(result).toEqual(mockWarranty);
        });
    });

    // --------------------------------------------------------------------------
    // getWarranties
    // --------------------------------------------------------------------------
    describe('getWarranties', () => {
        it('should return paginated warranties', async () => {
            (Warranty.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockWarranty], count: 1 });
            const result = await warrantyService.getWarranties({ page: 1 }, 'tenant-1');
            expect(result.docs).toHaveLength(1);
            expect(result.pagination.totalItems).toBe(1);
        });
    });

    // --------------------------------------------------------------------------
    // updateWarranty
    // --------------------------------------------------------------------------
    describe('updateWarranty', () => {
        it('should update and return the warranty', async () => {
            (Warranty.findByPk as jest.Mock<any>).mockResolvedValue(mockWarranty);
            const result = await warrantyService.updateWarranty(1, { status: 'EXPIRED' });
            expect(mockWarranty.update).toHaveBeenCalledWith({ status: 'EXPIRED' });
            expect(result).toEqual(mockWarranty);
        });

        it('should return null when warranty not found', async () => {
            (Warranty.findByPk as jest.Mock<any>).mockResolvedValue(null);
            const result = await warrantyService.updateWarranty(999, {});
            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // deleteWarranty
    // --------------------------------------------------------------------------
    describe('deleteWarranty', () => {
        it('should delete warranty and its claims', async () => {
            (WarrantyClaim.destroy as jest.Mock<any>).mockResolvedValue(2);
            (Warranty.findByPk as jest.Mock<any>).mockResolvedValue(mockWarranty);

            const result = await warrantyService.deleteWarranty(1);
            expect(WarrantyClaim.destroy).toHaveBeenCalledWith({ where: { warrantyId: 1 } });
            expect(mockWarranty.destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should return false when warranty not found', async () => {
            (WarrantyClaim.destroy as jest.Mock<any>).mockResolvedValue(0);
            (Warranty.findByPk as jest.Mock<any>).mockResolvedValue(null);
            const result = await warrantyService.deleteWarranty(999);
            expect(result).toBe(false);
        });
    });

    // --------------------------------------------------------------------------
    // createClaim
    // --------------------------------------------------------------------------
    describe('createClaim', () => {
        it('should create a warranty claim and emit event', async () => {
            (WarrantyClaim.create as jest.Mock<any>).mockResolvedValue(mockClaim);
            const { io } = require('../../src/server');

            const result = await warrantyService.createClaim({ warrantyId: 1 }, 'tenant-1');
            expect(WarrantyClaim.create).toHaveBeenCalledWith(
                expect.objectContaining({ warrantyId: 1, tenantId: 'tenant-1' })
            );
            expect(io.emit).toHaveBeenCalledWith('warranty:claim_created', expect.anything());
        });
    });

    // --------------------------------------------------------------------------
    // updateClaim
    // --------------------------------------------------------------------------
    describe('updateClaim', () => {
        it('should auto-set resolvedAt when status changes to RESOLVED', async () => {
            (WarrantyClaim.findByPk as jest.Mock<any>).mockResolvedValue(mockClaim);
            await warrantyService.updateClaim(1, { status: 'RESOLVED' });
            expect(mockClaim.update).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'RESOLVED', resolvedAt: expect.any(Date) })
            );
        });

        it('should return null when claim not found', async () => {
            (WarrantyClaim.findByPk as jest.Mock<any>).mockResolvedValue(null);
            const result = await warrantyService.updateClaim(999, {});
            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // checkWarrantyCoverage
    // --------------------------------------------------------------------------
    describe('checkWarrantyCoverage', () => {
        it('should return covered=true for an active warranty within date range', async () => {
            (Warranty.findByPk as jest.Mock<any>).mockResolvedValue(mockWarranty);
            const result = await warrantyService.checkWarrantyCoverage(1, '2026-06-01');
            expect(result.covered).toBe(true);
            expect(result.daysRemaining).toBeGreaterThan(0);
        });

        it('should return covered=false for an expired warranty', async () => {
            const expired = { ...mockWarranty, status: 'EXPIRED' };
            (Warranty.findByPk as jest.Mock<any>).mockResolvedValue(expired);
            const result = await warrantyService.checkWarrantyCoverage(1, '2026-06-01');
            expect(result.covered).toBe(false);
            expect(result.reason).toContain('EXPIRED');
        });

        it('should throw if warranty not found', async () => {
            (Warranty.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(warrantyService.checkWarrantyCoverage(999))
                .rejects.toThrow('Warranty not found');
        });

        it('should return 999999 daysRemaining for LIFETIME type warranty', async () => {
            const lifetime = { ...mockWarranty, type: 'LIFETIME' };
            (Warranty.findByPk as jest.Mock<any>).mockResolvedValue(lifetime);
            const result = await warrantyService.checkWarrantyCoverage(1, '2026-06-01');
            expect(result.daysRemaining).toBe(999999);
        });
    });

    // --------------------------------------------------------------------------
    // createClaimWithValidation
    // --------------------------------------------------------------------------
    describe('createClaimWithValidation', () => {
        it('should throw if warrantyId is missing', async () => {
            await expect(warrantyService.createClaimWithValidation({}))
                .rejects.toThrow('warrantyId is required');
        });

        it('should throw if warranty does not cover the claim', async () => {
            const expired = { ...mockWarranty, status: 'EXPIRED' };
            (Warranty.findByPk as jest.Mock<any>).mockResolvedValue(expired);
            await expect(warrantyService.createClaimWithValidation({ warrantyId: 1 }))
                .rejects.toThrow(/does not cover/);
        });
    });
});
