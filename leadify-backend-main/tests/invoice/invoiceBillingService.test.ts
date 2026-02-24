
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import invoiceBillingService from '../../src/invoice/invoiceBillingService';
import Invoice from '../../src/deal/model/invoiceMode';
import InvoiceLineItem from '../../src/invoice/models/invoiceLineItemModel';
import CreditNote from '../../src/invoice/models/creditNoteModel';
import Deal from '../../src/deal/model/dealModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// Mocks
jest.mock('../../src/deal/model/invoiceMode');
jest.mock('../../src/invoice/models/invoiceLineItemModel');
jest.mock('../../src/invoice/models/creditNoteModel');
jest.mock('../../src/deal/model/dealModel');
jest.mock('../../src/salesOrder/models/salesOrderModel');
jest.mock('../../src/salesOrder/models/salesOrderItemModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

describe('InvoiceBillingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. generateInvoiceNumber
    // --------------------------------------------------------------------------
    describe('generateInvoiceNumber', () => {
        it('should return INV-0001 when no invoices exist', async () => {
            (Invoice.findOne as jest.Mock<any>).mockResolvedValue(null);

            const result = await invoiceBillingService.generateInvoiceNumber();
            expect(result).toBe('INV-0001');
        });

        it('should increment from last invoice number', async () => {
            (Invoice.findOne as jest.Mock<any>).mockResolvedValue({ invoiceNumber: 'INV-0005' });

            const result = await invoiceBillingService.generateInvoiceNumber();
            expect(result).toBe('INV-0006');
        });

        it('should handle large numbers correctly', async () => {
            (Invoice.findOne as jest.Mock<any>).mockResolvedValue({ invoiceNumber: 'INV-9999' });

            const result = await invoiceBillingService.generateInvoiceNumber();
            expect(result).toBe('INV-10000');
        });

        it('should return INV-0001 if latest has no valid number format', async () => {
            (Invoice.findOne as jest.Mock<any>).mockResolvedValue({ invoiceNumber: 'INVALID' });

            const result = await invoiceBillingService.generateInvoiceNumber();
            expect(result).toBe('INV-0001');
        });
    });

    // --------------------------------------------------------------------------
    // 2. generateCreditNoteNumber
    // --------------------------------------------------------------------------
    describe('generateCreditNoteNumber', () => {
        it('should return CN-0001 when no credit notes exist', async () => {
            (CreditNote.findOne as jest.Mock<any>).mockResolvedValue(null);

            const result = await invoiceBillingService.generateCreditNoteNumber();
            expect(result).toBe('CN-0001');
        });

        it('should increment from last credit note number', async () => {
            (CreditNote.findOne as jest.Mock<any>).mockResolvedValue({ creditNoteNumber: 'CN-0010' });

            const result = await invoiceBillingService.generateCreditNoteNumber();
            expect(result).toBe('CN-0011');
        });
    });

    // --------------------------------------------------------------------------
    // 3. createInvoice
    // --------------------------------------------------------------------------
    describe('createInvoice', () => {
        it('should create invoice with auto-generated number', async () => {
            (Invoice.findOne as jest.Mock<any>).mockResolvedValue(null); // For generateInvoiceNumber
            const mockInvoice = {
                id: 1,
                invoiceNumber: 'INV-0001',
                amount: 0,
                toJSON: jest.fn().mockReturnValue({ id: 1, invoiceNumber: 'INV-0001' }),
            };
            (Invoice.create as jest.Mock<any>).mockResolvedValue(mockInvoice);
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(mockInvoice);
            (InvoiceLineItem.findAll as jest.Mock<any>).mockResolvedValue([]);
            (CreditNote.findAll as jest.Mock<any>).mockResolvedValue([]);

            const result = await invoiceBillingService.createInvoice({
                dealId: 'deal-1',
            });

            expect(Invoice.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    invoiceNumber: 'INV-0001',
                    dealId: 'deal-1',
                    collected: false,
                })
            );
        });

        it('should create line items and calculate totals when provided', async () => {
            (Invoice.findOne as jest.Mock<any>).mockResolvedValue(null);
            const mockInvoice = {
                id: 1,
                invoiceNumber: 'INV-0001',
                amount: 0,
                collected: false,
                update: jest.fn(),
                toJSON: jest.fn().mockReturnValue({ id: 1 }),
            };
            (Invoice.create as jest.Mock<any>).mockResolvedValue(mockInvoice);
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(mockInvoice);
            (InvoiceLineItem.bulkCreate as jest.Mock<any>).mockResolvedValue([]);
            (InvoiceLineItem.findAll as jest.Mock<any>).mockResolvedValue([
                { quantity: 10, unitPrice: 100, taxRate: 15, discountRate: 0 },
            ]);
            (CreditNote.findAll as jest.Mock<any>).mockResolvedValue([]);

            await invoiceBillingService.createInvoice({
                dealId: 'deal-1',
                lineItems: [
                    { description: 'Item 1', quantity: 10, unitPrice: 100, taxRate: 15 },
                ],
            });

            expect(InvoiceLineItem.bulkCreate).toHaveBeenCalled();
            expect(mockInvoice.update).toHaveBeenCalled(); // calculateTotals
        });
    });

    // --------------------------------------------------------------------------
    // 4. voidInvoice
    // --------------------------------------------------------------------------
    describe('voidInvoice', () => {
        it('should void an uncollected invoice', async () => {
            const mockInvoice = {
                id: 1,
                collected: false,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(mockInvoice);

            await invoiceBillingService.voidInvoice(1);

            expect(mockInvoice.update).toHaveBeenCalledWith({ amount: 0 });
        });

        it('should throw when trying to void a collected invoice', async () => {
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue({ id: 1, collected: true });

            await expect(invoiceBillingService.voidInvoice(1))
                .rejects.toThrow();
        });

        it('should throw NOT_FOUND for missing invoice', async () => {
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(invoiceBillingService.voidInvoice(999))
                .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 5. createCreditNote
    // --------------------------------------------------------------------------
    describe('createCreditNote', () => {
        it('should create credit note for valid invoice', async () => {
            const mockInvoice = { id: 1, amount: 1000 };
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(mockInvoice);
            (CreditNote.findOne as jest.Mock<any>).mockResolvedValue(null); // For CN number
            (CreditNote.create as jest.Mock<any>).mockResolvedValue({
                id: 1,
                creditNoteNumber: 'CN-0001',
                amount: 500,
            });

            const result = await invoiceBillingService.createCreditNote(1, { amount: 500 });

            expect(CreditNote.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    invoiceId: 1,
                    creditNoteNumber: 'CN-0001',
                    amount: 500,
                })
            );
        });

        it('should reject credit note exceeding invoice amount', async () => {
            const mockInvoice = { id: 1, amount: 1000 };
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(mockInvoice);

            await expect(invoiceBillingService.createCreditNote(1, { amount: 1500 }))
                .rejects.toThrow();
        });
    });

    // --------------------------------------------------------------------------
    // 6. calculateTotals
    // --------------------------------------------------------------------------
    describe('calculateTotals', () => {
        it('should compute totals from line items correctly', async () => {
            const mockInvoice = {
                id: 1,
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (Invoice.findByPk as jest.Mock<any>).mockResolvedValue(mockInvoice);
            (InvoiceLineItem.findAll as jest.Mock<any>).mockResolvedValue([
                { quantity: 2, unitPrice: 100, taxRate: 15, discountRate: 10 },
                // subtotal: 200, discount: 20, taxable: 180, tax: 27, lineTotal: 207
            ]);

            const result = await invoiceBillingService.calculateTotals(1);

            expect(result.subtotal).toBe(200);
            expect(result.discount).toBe(20);
            expect(result.tax).toBe(27);
            expect(result.total).toBe(207);
            expect(mockInvoice.update).toHaveBeenCalledWith({ amount: 207 });
        });
    });
});
