
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import rfqService from '../../src/procurement/rfqService';
import RFQ, { RFQStatusEnum } from '../../src/procurement/models/rfqModel';
import RFQItem from '../../src/procurement/models/rfqItemModel';
import RFQVendor, { RFQVendorStatusEnum } from '../../src/procurement/models/rfqVendorModel';
import RFQVendorItem from '../../src/procurement/models/rfqVendorItemModel';
import User from '../../src/user/userModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// Mocks
jest.mock('../../src/procurement/models/rfqModel');
jest.mock('../../src/procurement/models/rfqItemModel');
jest.mock('../../src/procurement/models/rfqVendorModel');
jest.mock('../../src/procurement/models/rfqVendorItemModel');
jest.mock('../../src/vendor/vendorModel');
jest.mock('../../src/project/models/projectModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
};

jest.mock('../../src/config/db', () => ({
    sequelize: {
        transaction: jest.fn(() => Promise.resolve(mockTransaction)),
    },
}));

describe('RFQService', () => {
    const mockUser: any = { id: 1, name: 'Test User' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. createRFQ
    // --------------------------------------------------------------------------
    describe('createRFQ', () => {
        it('should create RFQ with auto-generated number and items', async () => {
            (RFQ.count as jest.Mock<any>).mockResolvedValue(10);
            const mockRFQ = {
                id: 'rfq-1',
                rfqNumber: `RFQ-${new Date().getFullYear()}-0011`,
                createdBy: 1,
            };
            (RFQ.create as jest.Mock<any>).mockResolvedValue(mockRFQ);
            (RFQItem.bulkCreate as jest.Mock<any>).mockResolvedValue([]);

            // Mock getRFQById for the return
            (RFQ.findByPk as jest.Mock<any>).mockResolvedValue(mockRFQ);

            const input = {
                title: 'New RFQ',
                projectId: 'proj-1',
                items: [
                    { description: 'Item 1', quantity: 10, unit: 'pcs' },
                    { description: 'Item 2', quantity: 5, unit: 'kg' },
                ],
            };

            const result = await rfqService.createRFQ(input, mockUser);

            expect(RFQ.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'New RFQ',
                    createdBy: 1,
                    rfqNumber: expect.stringMatching(/^RFQ-\d{4}-0011$/),
                }),
                expect.objectContaining({ transaction: mockTransaction })
            );
            expect(RFQItem.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ rfqId: 'rfq-1', description: 'Item 1' }),
                ]),
                expect.objectContaining({ transaction: mockTransaction })
            );
            expect(mockTransaction.commit).toHaveBeenCalled();
        });

        it('should rollback on error', async () => {
            (RFQ.count as jest.Mock<any>).mockResolvedValue(0);
            (RFQ.create as jest.Mock<any>).mockRejectedValue(new Error('DB Error'));

            await expect(rfqService.createRFQ({ title: 'Fail' }, mockUser))
                .rejects.toThrow('DB Error');
            expect(mockTransaction.rollback).toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 2. getRFQs
    // --------------------------------------------------------------------------
    describe('getRFQs', () => {
        it('should return paginated RFQs', async () => {
            const mockRows = [{ id: 'rfq-1', rfqNumber: 'RFQ-2026-0001' }];
            (RFQ.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 1 });

            const result = await rfqService.getRFQs({ page: 1, limit: 10 });

            expect(result.docs).toEqual(mockRows);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
            });
        });

        it('should apply default pagination', async () => {
            (RFQ.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await rfqService.getRFQs({});

            expect(RFQ.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 10,
                    offset: 0,
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 3. getRFQById
    // --------------------------------------------------------------------------
    describe('getRFQById', () => {
        it('should return RFQ with includes', async () => {
            const mockRFQ = { id: 'rfq-1', rfqNumber: 'RFQ-2026-0001' };
            (RFQ.findByPk as jest.Mock<any>).mockResolvedValue(mockRFQ);

            const result = await rfqService.getRFQById('rfq-1');
            expect(result).toEqual(mockRFQ);
        });

        it('should throw RFQ_NOT_FOUND when not found', async () => {
            (RFQ.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(rfqService.getRFQById('nonexistent'))
                .rejects.toThrow(new BaseError(ERRORS.RFQ_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 4. sendRFQToVendors
    // --------------------------------------------------------------------------
    describe('sendRFQToVendors', () => {
        it('should create vendor entries and update status to SENT', async () => {
            const mockRFQ: any = {
                id: 'rfq-1',
                status: RFQStatusEnum.DRAFT,
                save: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (RFQ.findByPk as jest.Mock<any>).mockResolvedValue(mockRFQ);
            (RFQVendor.bulkCreate as jest.Mock<any>).mockResolvedValue([]);

            await rfqService.sendRFQToVendors('rfq-1', [1, 2, 3]);

            expect(RFQVendor.bulkCreate).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ rfqId: 'rfq-1', vendorId: 1, status: RFQVendorStatusEnum.PENDING }),
                    expect.objectContaining({ rfqId: 'rfq-1', vendorId: 2 }),
                    expect.objectContaining({ rfqId: 'rfq-1', vendorId: 3 }),
                ]),
                expect.objectContaining({ transaction: mockTransaction })
            );
            expect(mockRFQ.status).toBe(RFQStatusEnum.SENT);
            expect(mockRFQ.save).toHaveBeenCalled();
            expect(mockTransaction.commit).toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 5. addVendorResponse
    // --------------------------------------------------------------------------
    describe('addVendorResponse', () => {
        it('should save vendor response items and calculate total', async () => {
            const mockRFQVendor: any = {
                id: 'rfqv-1',
                status: RFQVendorStatusEnum.PENDING,
                save: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (RFQVendor.findOne as jest.Mock<any>).mockResolvedValue(mockRFQVendor);
            (RFQVendorItem.destroy as jest.Mock<any>).mockResolvedValue(0);
            (RFQVendorItem.bulkCreate as jest.Mock<any>).mockResolvedValue([]);

            const input = {
                items: [
                    { rfqItemId: 'item-1', price: 100, remarks: 'OK' },
                    { rfqItemId: 'item-2', price: 200, remarks: '' },
                ],
                notes: 'Our best offer',
            };

            const result = await rfqService.addVendorResponse('rfq-1', 1, input);

            expect(RFQVendorItem.bulkCreate).toHaveBeenCalled();
            expect(mockRFQVendor.status).toBe(RFQVendorStatusEnum.RESPONDED);
            expect(mockRFQVendor.totalOfferAmount).toBe(300);
            expect(mockRFQVendor.notes).toBe('Our best offer');
            expect(mockTransaction.commit).toHaveBeenCalled();
        });

        it('should throw when vendor not invited', async () => {
            (RFQVendor.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(rfqService.addVendorResponse('rfq-1', 999, { items: [] }))
                .rejects.toThrow('Vendor not invited to this RFQ');
            expect(mockTransaction.rollback).toHaveBeenCalled();
        });
    });
});
