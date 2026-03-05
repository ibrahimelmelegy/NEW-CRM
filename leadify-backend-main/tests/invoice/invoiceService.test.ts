
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import invoiceService from '../../src/invoice/invoiceService';
import Invoice from '../../src/deal/model/invoiceMode';
import Deal from '../../src/deal/model/dealModel';

// Mocks
jest.mock('../../src/config/db', () => ({
    sequelize: { transaction: jest.fn(), define: jest.fn(), query: jest.fn() }
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

        it('should include Deal association', async () => {
            (Invoice.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await invoiceService.getInvoices({});

            expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.arrayContaining([
                        expect.objectContaining({ model: Deal, as: 'deal' })
                    ])
                })
            );
        });

        it('should not apply status filter when no status provided', async () => {
            (Invoice.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await invoiceService.getInvoices({});

            const callArgs = (Invoice.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.collected).toBeUndefined();
        });

        it('should order by createdAt DESC', async () => {
            (Invoice.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await invoiceService.getInvoices({});

            expect(Invoice.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: [['createdAt', 'DESC']]
                })
            );
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

        it('should include Deal with Client association', async () => {
            const mockInvoice = { id: 1 };
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(mockInvoice);

            await invoiceService.getInvoiceById(1);

            expect(Invoice.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
                include: expect.arrayContaining([
                    expect.objectContaining({ model: Deal, as: 'deal' })
                ])
            }));
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
            // getSummary uses Invoice.findOne with SQL aggregate attributes (raw: true)
            // Sequelize returns aggregate values as strings
            (Invoice.findOne as jest.Mock<any>).mockResolvedValue({
                totalInvoices: '3',
                totalAmount: '3500',
                collectedAmount: '1500',
                pendingAmount: '2000',
                collectedCount: '2',
                pendingCount: '1',
            });

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
            // When no invoices exist, Sequelize aggregate returns zeros
            (Invoice.findOne as jest.Mock<any>).mockResolvedValue({
                totalInvoices: '0',
                totalAmount: '0',
                collectedAmount: '0',
                pendingAmount: '0',
                collectedCount: '0',
                pendingCount: '0',
            });

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

        it('should handle null result gracefully', async () => {
            // When findOne returns null (edge case)
            (Invoice.findOne as jest.Mock<any>).mockResolvedValue(null);

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

        it('should handle non-numeric aggregate values', async () => {
            (Invoice.findOne as jest.Mock<any>).mockResolvedValue({
                totalInvoices: 'NaN',
                totalAmount: undefined,
                collectedAmount: null,
                pendingAmount: '',
                collectedCount: 'abc',
                pendingCount: '5',
            });

            const result = await invoiceService.getSummary();

            // All NaN/undefined/null should fall back to 0 via Number() || 0
            expect(result.totalInvoices).toBe(0);
            expect(result.totalAmount).toBe(0);
            expect(result.collectedAmount).toBe(0);
            expect(result.pendingAmount).toBe(0);
            expect(result.collectedCount).toBe(0);
            expect(result.pendingCount).toBe(5);
        });
    });

    // --------------------------------------------------------------------------
    // 6. calculateInvoiceTotals (pure function - no mocks needed)
    // --------------------------------------------------------------------------
    describe('calculateInvoiceTotals', () => {
        it('should calculate simple line items without tax or discount', () => {
            const items = [
                { description: 'Item 1', quantity: 2, unitPrice: 100 },
                { description: 'Item 2', quantity: 3, unitPrice: 50 },
            ];

            const result = invoiceService.calculateInvoiceTotals(items);

            expect(result.subtotal).toBe(350); // 200 + 150
            expect(result.discountAmount).toBe(0);
            expect(result.taxableAmount).toBe(350);
            expect(result.taxAmount).toBe(0);
            expect(result.total).toBe(350);
        });

        it('should apply fixed discount correctly', () => {
            const items = [
                { description: 'Item', quantity: 10, unitPrice: 100 },
            ];

            const result = invoiceService.calculateInvoiceTotals(items, 0, 200, 'fixed');

            expect(result.subtotal).toBe(1000);
            expect(result.discountAmount).toBe(200);
            expect(result.taxableAmount).toBe(800);
            expect(result.total).toBe(800);
        });

        it('should apply percentage discount correctly', () => {
            const items = [
                { description: 'Item', quantity: 10, unitPrice: 100 },
            ];

            const result = invoiceService.calculateInvoiceTotals(items, 0, 10, 'percentage');

            expect(result.subtotal).toBe(1000);
            expect(result.discountAmount).toBe(100); // 10% of 1000
            expect(result.taxableAmount).toBe(900);
            expect(result.total).toBe(900);
        });

        it('should apply tax on post-discount amount', () => {
            const items = [
                { description: 'Item', quantity: 10, unitPrice: 100 },
            ];

            const result = invoiceService.calculateInvoiceTotals(items, 15, 200, 'fixed');

            expect(result.subtotal).toBe(1000);
            expect(result.discountAmount).toBe(200);
            expect(result.taxableAmount).toBe(800);
            expect(result.taxAmount).toBe(120); // 15% of 800
            expect(result.total).toBe(920); // 800 + 120
        });

        it('should cap discount at subtotal amount', () => {
            const items = [
                { description: 'Item', quantity: 1, unitPrice: 100 },
            ];

            // Fixed discount of 500 on subtotal of 100 should cap at 100
            const result = invoiceService.calculateInvoiceTotals(items, 0, 500, 'fixed');

            expect(result.discountAmount).toBe(100); // capped at subtotal
            expect(result.taxableAmount).toBe(0);
            expect(result.total).toBe(0);
        });

        it('should handle empty items array', () => {
            const result = invoiceService.calculateInvoiceTotals([]);

            expect(result.subtotal).toBe(0);
            expect(result.total).toBe(0);
        });

        it('should handle items with zero quantity', () => {
            const items = [
                { description: 'Free item', quantity: 0, unitPrice: 100 },
            ];

            const result = invoiceService.calculateInvoiceTotals(items);

            expect(result.subtotal).toBe(0);
            expect(result.total).toBe(0);
        });

        it('should round values to 2 decimal places', () => {
            const items = [
                { description: 'Item', quantity: 3, unitPrice: 33.33 },
            ];

            const result = invoiceService.calculateInvoiceTotals(items, 7);

            // subtotal = 3 * 33.33 = 99.99
            expect(result.subtotal).toBe(99.99);
            // tax = 99.99 * 0.07 = 6.9993
            expect(result.taxAmount).toBe(7); // rounded to 2dp
            // total = 99.99 + 7 = 106.99
            expect(result.total).toBe(106.99);
        });

        it('should use default values for optional parameters', () => {
            const items = [
                { description: 'Item', quantity: 1, unitPrice: 100 },
            ];

            const result = invoiceService.calculateInvoiceTotals(items);

            // Default: taxRate=0, discount=0, discountType='fixed'
            expect(result.subtotal).toBe(100);
            expect(result.discountAmount).toBe(0);
            expect(result.taxAmount).toBe(0);
            expect(result.total).toBe(100);
        });

        it('should handle complex multi-item invoice with tax and percentage discount', () => {
            const items = [
                { description: 'Consulting', quantity: 10, unitPrice: 200 }, // 2000
                { description: 'License', quantity: 1, unitPrice: 5000 },    // 5000
                { description: 'Support', quantity: 12, unitPrice: 150 },    // 1800
            ];

            // 15% tax, 5% discount
            const result = invoiceService.calculateInvoiceTotals(items, 15, 5, 'percentage');

            expect(result.subtotal).toBe(8800); // 2000+5000+1800
            expect(result.discountAmount).toBe(440); // 5% of 8800
            expect(result.taxableAmount).toBe(8360); // 8800-440
            expect(result.taxAmount).toBe(1254); // 15% of 8360
            expect(result.total).toBe(9614); // 8360+1254
        });

        it('should handle null/undefined quantity or unitPrice gracefully', () => {
            const items = [
                { description: 'Item', quantity: null as any, unitPrice: 100 },
                { description: 'Item', quantity: 5, unitPrice: undefined as any },
            ];

            const result = invoiceService.calculateInvoiceTotals(items);

            // null ?? 0 = 0, undefined ?? 0 = 0 in the reduce
            expect(result.subtotal).toBe(0);
            expect(result.total).toBe(0);
        });
    });

    // --------------------------------------------------------------------------
    // 7. getOverdueInvoices
    // --------------------------------------------------------------------------
    describe('getOverdueInvoices', () => {
        it('should return overdue invoices with daysOverdue', async () => {
            (Invoice.findAll as jest.Mock<any>).mockResolvedValue([
                {
                    toJSON: () => ({
                        id: 1,
                        invoiceNumber: 'INV-0001',
                        amount: 1000,
                        daysOverdue: '15',
                    }),
                },
            ]);

            const result = await invoiceService.getOverdueInvoices();

            expect(result).toHaveLength(1);
            expect(result[0].daysOverdue).toBe(15);
        });

        it('should return empty array when no overdue invoices', async () => {
            (Invoice.findAll as jest.Mock<any>).mockResolvedValue([]);

            const result = await invoiceService.getOverdueInvoices();

            expect(result).toEqual([]);
        });

        it('should filter by tenantId when provided', async () => {
            (Invoice.findAll as jest.Mock<any>).mockResolvedValue([]);

            await invoiceService.getOverdueInvoices('tenant-1');

            const callArgs = (Invoice.findAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.tenantId).toBe('tenant-1');
        });

        it('should not include tenantId filter when not provided', async () => {
            (Invoice.findAll as jest.Mock<any>).mockResolvedValue([]);

            await invoiceService.getOverdueInvoices();

            const callArgs = (Invoice.findAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.tenantId).toBeUndefined();
        });
    });

    // --------------------------------------------------------------------------
    // 8. getAgingReport
    // --------------------------------------------------------------------------
    describe('getAgingReport', () => {
        it('should return aging buckets from raw SQL query', async () => {
            const { sequelize } = require('../../src/config/db');
            sequelize.query = (jest.fn() as jest.Mock<any>).mockResolvedValue([
                { bucket: 'current', count: 5, totalAmount: '10000' },
                { bucket: '1-30', count: 3, totalAmount: '5000' },
                { bucket: '31-60', count: 1, totalAmount: '2000' },
            ]);

            const result = await invoiceService.getAgingReport();

            expect(result.buckets).toHaveLength(3);
            expect(result.buckets[0].label).toBe('Current (not yet due)');
            expect(result.buckets[0].count).toBe(5);
            expect(result.buckets[0].totalAmount).toBe(10000);
            expect(result.buckets[1].label).toBe('1-30 days overdue');
            expect(result.totalOutstanding).toBe(17000);
        });

        it('should return empty buckets when no data', async () => {
            const { sequelize } = require('../../src/config/db');
            sequelize.query = (jest.fn() as jest.Mock<any>).mockResolvedValue([]);

            const result = await invoiceService.getAgingReport();

            expect(result.buckets).toEqual([]);
            expect(result.totalOutstanding).toBe(0);
        });

        it('should pass tenantId as replacement when provided', async () => {
            const { sequelize } = require('../../src/config/db');
            sequelize.query = (jest.fn() as jest.Mock<any>).mockResolvedValue([]);

            await invoiceService.getAgingReport('tenant-123');

            expect(sequelize.query).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    replacements: { tenantId: 'tenant-123' },
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 9. getRevenueSummary
    // --------------------------------------------------------------------------
    describe('getRevenueSummary', () => {
        it('should return monthly revenue summary', async () => {
            const { sequelize } = require('../../src/config/db');
            sequelize.query = (jest.fn() as jest.Mock<any>).mockResolvedValue([
                { month: '2026-01', totalRevenue: '50000', collectedRevenue: '30000', outstandingRevenue: '20000' },
                { month: '2026-02', totalRevenue: '40000', collectedRevenue: '40000', outstandingRevenue: '0' },
            ]);

            const result = await invoiceService.getRevenueSummary();

            expect(result).toHaveLength(2);
            expect(result[0].month).toBe('2026-01');
            expect(result[0].totalRevenue).toBe(50000);
            expect(result[0].collectedRevenue).toBe(30000);
            expect(result[0].outstandingRevenue).toBe(20000);
        });

        it('should return empty array when no data', async () => {
            const { sequelize } = require('../../src/config/db');
            sequelize.query = (jest.fn() as jest.Mock<any>).mockResolvedValue([]);

            const result = await invoiceService.getRevenueSummary();

            expect(result).toEqual([]);
        });

        it('should default to 12 months lookback', async () => {
            const { sequelize } = require('../../src/config/db');
            sequelize.query = (jest.fn() as jest.Mock<any>).mockResolvedValue([]);

            await invoiceService.getRevenueSummary();

            const query = sequelize.query.mock.calls[0][0] as string;
            expect(query).toContain('12 months');
        });

        it('should accept custom period parameter', async () => {
            const { sequelize } = require('../../src/config/db');
            sequelize.query = (jest.fn() as jest.Mock<any>).mockResolvedValue([]);

            await invoiceService.getRevenueSummary(undefined, 6);

            const query = sequelize.query.mock.calls[0][0] as string;
            expect(query).toContain('6 months');
        });

        it('should clamp period to valid range (1-120)', async () => {
            const { sequelize } = require('../../src/config/db');
            sequelize.query = (jest.fn() as jest.Mock<any>).mockResolvedValue([]);

            // Negative period should clamp to 1
            await invoiceService.getRevenueSummary(undefined, -5);

            const query = sequelize.query.mock.calls[0][0] as string;
            expect(query).toContain('1 months');
        });
    });
});
