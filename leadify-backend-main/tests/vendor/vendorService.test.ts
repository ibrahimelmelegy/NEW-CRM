
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import vendorService from '../../src/vendor/vendorService';
import Vendor from '../../src/vendor/vendorModel';
import { createActivityLog } from '../../src/activity-logs/activityService';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
jest.mock('../../src/vendor/vendorModel');
jest.mock('../../src/activity-logs/activityService');
jest.mock('../../src/server', () => ({ io: { emit: jest.fn() } }));

jest.mock('../../src/utils/pagination', () => ({
    clampPagination: jest.fn((q: any) => ({
        page: q.page || 1,
        limit: q.limit || 10,
        offset: ((q.page || 1) - 1) * (q.limit || 10),
    })),
}));

describe('VendorService', () => {
    const mockUser: any = { id: 1, email: 'admin@test.com' };

    const mockVendor: any = {
        id: 'vendor-1',
        name: 'Acme Supplies',
        email: 'contact@acme.com',
        type: 'SUPPLIER',
        set: jest.fn(),
        save: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // createVendor
    // --------------------------------------------------------------------------
    describe('createVendor', () => {
        it('should create a vendor and log activity', async () => {
            (Vendor.create as jest.Mock<any>).mockResolvedValue(mockVendor);

            const result = await vendorService.createVendor({ name: 'Acme Supplies' }, mockUser);
            expect(Vendor.create).toHaveBeenCalledWith({ name: 'Acme Supplies' });
            expect(createActivityLog).toHaveBeenCalledWith(
                'vendor', 'create', mockVendor.id, mockUser.id, null, expect.any(String)
            );
            expect(result).toEqual(mockVendor);
        });

        it('should set serviceType to null if it is an empty string', async () => {
            (Vendor.create as jest.Mock<any>).mockResolvedValue(mockVendor);

            await vendorService.createVendor({ name: 'Test', serviceType: '' }, mockUser);
            expect(Vendor.create).toHaveBeenCalledWith(
                expect.objectContaining({ serviceType: null })
            );
        });
    });

    // --------------------------------------------------------------------------
    // updateVendor
    // --------------------------------------------------------------------------
    describe('updateVendor', () => {
        it('should update a vendor and log activity', async () => {
            (Vendor.findOne as jest.Mock<any>).mockResolvedValue(mockVendor);

            const result = await vendorService.updateVendor('vendor-1', { name: 'New Name' }, mockUser);
            expect(mockVendor.set).toHaveBeenCalledWith({ name: 'New Name' });
            expect(mockVendor.save).toHaveBeenCalled();
            expect(createActivityLog).toHaveBeenCalledWith(
                'vendor', 'update', mockVendor.id, mockUser.id, null, expect.any(String)
            );
        });

        it('should throw VENDOR_NOT_FOUND when vendor does not exist', async () => {
            (Vendor.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(vendorService.updateVendor('missing', { name: 'x' }, mockUser))
                .rejects.toThrow(new BaseError(ERRORS.VENDOR_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // deleteVendor
    // --------------------------------------------------------------------------
    describe('deleteVendor', () => {
        it('should delete vendor and log activity', async () => {
            (Vendor.findOne as jest.Mock<any>).mockResolvedValue(mockVendor);

            await vendorService.deleteVendor('vendor-1', mockUser);
            expect(mockVendor.destroy).toHaveBeenCalled();
            expect(createActivityLog).toHaveBeenCalledWith(
                'vendor', 'delete', expect.anything(), mockUser.id, null, expect.any(String)
            );
        });

        it('should throw VENDOR_NOT_FOUND when deleting non-existent vendor', async () => {
            (Vendor.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(vendorService.deleteVendor('missing', mockUser))
                .rejects.toThrow(new BaseError(ERRORS.VENDOR_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // getVendors
    // --------------------------------------------------------------------------
    describe('getVendors', () => {
        it('should return paginated vendors', async () => {
            (Vendor.findAndCountAll as jest.Mock<any>).mockResolvedValue({
                rows: [mockVendor],
                count: 1,
            });

            const result = await vendorService.getVendors({ page: 1, limit: 10 });
            expect(result.docs).toHaveLength(1);
            expect(result.pagination.totalItems).toBe(1);
        });

        it('should return empty results when no vendors match', async () => {
            (Vendor.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });
            const result = await vendorService.getVendors({});
            expect(result.docs).toHaveLength(0);
            expect(result.pagination.totalPages).toBe(0);
        });
    });

    // --------------------------------------------------------------------------
    // getVendorById
    // --------------------------------------------------------------------------
    describe('getVendorById', () => {
        it('should return a vendor by id', async () => {
            (Vendor.findOne as jest.Mock<any>).mockResolvedValue(mockVendor);
            const result = await vendorService.getVendorById('vendor-1');
            expect(result).toEqual(mockVendor);
        });

        it('should throw VENDOR_NOT_FOUND when not found', async () => {
            (Vendor.findOne as jest.Mock<any>).mockResolvedValue(null);
            await expect(vendorService.getVendorById('missing'))
                .rejects.toThrow(new BaseError(ERRORS.VENDOR_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // getAllVendors
    // --------------------------------------------------------------------------
    describe('getAllVendors', () => {
        it('should return all vendors with id and name', async () => {
            (Vendor.findAll as jest.Mock<any>).mockResolvedValue([{ id: '1', name: 'V1' }]);
            const result = await vendorService.getAllVendors();
            expect(result).toHaveLength(1);
            expect(Vendor.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ attributes: ['id', 'name'], order: [['name', 'ASC']] })
            );
        });
    });
});
