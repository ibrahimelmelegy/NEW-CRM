
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import invoiceService from '../../src/invoice/invoiceService';
import Invoice from '../../src/deal/model/invoiceMode';
import Deal from '../../src/deal/model/dealModel';

// Mocks
jest.mock('../../src/config/db', () => ({
    sequelize: { transaction: jest.fn(), define: jest.fn() }
}));
jest.mock('../../src/deal/model/invoiceMode');
jest.mock('../../src/deal/model/dealModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

describe('InvoiceService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. getInvoices
    // --------------------------------------------------------------------------
    describe('getInvoices', () => {
        it('should return paginated invoices with default values', async () => {
            const mockRows = [
                { id: 1, invoiceNumber: 'INV-0001', amount: 1000, collected: false },
            ];
            (Invoice.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: mockRows, count: 1 });

            const result = await invoiceService.getInvoices({});

            expect(result.docs).toEqual(mockRows);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 20,
                totalItems: 1,
                totalPages: 1,
            });
        });

        it('should filter by collected status', async () => {
            (Invoice.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await invoiceService.getInvoices({ status: 'collected' });

            expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ collected: true })
                })
            );
        });

        it('should filter by pending status', async () => {
            (Invoice.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await invoiceService.getInvoices({ status: 'pending' });

            expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        collected: expect.anything() // Op.or [false, null]
                    })
                })
            );
        });

        it('should filter by search term on invoiceNumber', async () => {
            (Invoice.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await invoiceService.getInvoices({ search: 'INV-001' });

            expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        invoiceNumber: expect.anything() // Op.iLike
                    })
                })
            );
        });

        it('should apply pagination correctly', async () => {
            (Invoice.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 50 });

            const result = await invoiceService.getInvoices({ page: 3, limit: 10 });

            expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 10,
                    offset: 20, // (3-1)*10
                })
            );
            expect(result.pagination.totalPages).toBe(5); // 50/10
        });
    });

    // --------------------------------------------------------------------------
    // 2. getInvoiceById
    // --------------------------------------------------------------------------
    describe('getInvoiceById', () => {
        it('should return invoice when found', async () => {
            const mockInvoice = { id: 1, invoiceNumber: 'INV-0001' };
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(mockInvoice);

            const result = await invoiceService.getInvoiceById(1);
            expect(result).toEqual(mockInvoice);
        });

        it('should throw when invoice not found', async () => {
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(invoiceService.getInvoiceById(999))
                .rejects.toThrow('Invoice not found');
        });
    });

    // --------------------------------------------------------------------------
    // 3. markCollected
    // --------------------------------------------------------------------------
    describe('markCollected', () => {
        it('should mark invoice as collected with date', async () => {
            const mockInvoice = {
                id: 1,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(mockInvoice);

            await invoiceService.markCollected(1, '2026-01-15');

            expect(mockInvoice.update).toHaveBeenCalledWith({
                collected: true,
                collectedDate: new Date('2026-01-15'),
            });
        });

        it('should use current date when no date provided', async () => {
            const mockInvoice = {
                id: 1,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(mockInvoice);

            await invoiceService.markCollected(1);

            expect(mockInvoice.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    collected: true,
                    collectedDate: expect.any(Date),
                })
            );
        });

        it('should throw when invoice not found', async () => {
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(invoiceService.markCollected(999))
                .rejects.toThrow('Invoice not found');
        });
    });

    // --------------------------------------------------------------------------
    // 4. markUncollected
    // --------------------------------------------------------------------------
    describe('markUncollected', () => {
        it('should mark invoice as uncollected', async () => {
            const mockInvoice = {
                id: 1,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(mockInvoice);

            await invoiceService.markUncollected(1);

            expect(mockInvoice.update).toHaveBeenCalledWith({
                collected: false,
                collectedDate: null,
            });
        });

        it('should throw when invoice not found', async () => {
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(invoiceService.markUncollected(999))
                .rejects.toThrow('Invoice not found');
        });
    });

    // --------------------------------------------------------------------------
    // 5. getSummary
    // --------------------------------------------------------------------------
    describe('getSummary', () => {
        it('should compute correct summary from invoices', async () => {
            const mockInvoices = [
                { id: 1, amount: 1000, collected: true },
                { id: 2, amount: 2000, collected: false },
                { id: 3, amount: 500, collected: true },
            ];
            (Invoice.findAll as jest.Mock<any>).mockResolvedValue(mockInvoices);

            const result = await invoiceService.getSummary();

            expect(result).toEqual({
                totalInvoices: 3,
                totalAmount: 3500,
                collectedAmount: 1500,
                pendingAmount: 2000,
                collectedCount: 2,
                pendingCount: 1,
            });
        });

        it('should handle empty invoice list', async () => {
            (Invoice.findAll as jest.Mock<any>).mockResolvedValue([]);

            const result = await invoiceService.getSummary();

            expect(result).toEqual({
                totalInvoices: 0,
                totalAmount: 0,
                collectedAmount: 0,
                pendingAmount: 0,
                collectedCount: 0,
                pendingCount: 0,
            });
        });
    });
});
