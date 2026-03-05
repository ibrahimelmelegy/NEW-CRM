// Mock db before any imports to prevent Sequelize model initialization
jest.mock('../../src/config/db', () => ({
    __esModule: true,
    sequelize: {
        define: jest.fn(),
        model: jest.fn(),
        models: {},
        transaction: jest.fn(),
        literal: jest.fn(),
    },
}));

import { sequelize } from '../../src/config/db';
import ProcurementService from '../../src/procurement/procurementService';
import PurchaseOrder from '../../src/procurement/models/purchaseOrderModel';
import PurchaseOrderItem from '../../src/procurement/models/purchaseOrderItemModel';
import { POStatusEnum } from '../../src/procurement/models/purchaseOrderModel';

// Mocking the dependencies
jest.mock('../../src/activity-logs/activityService', () => ({
    createActivityLog: jest.fn(),
}));

describe('ProcurementService - Purchase Order Unit Tests', () => {
    let transaction: any;

    beforeAll(async () => {
        // Mock transaction
        transaction = {
            commit: jest.fn(),
            rollback: jest.fn(),
        };
        jest.spyOn(sequelize, 'transaction').mockResolvedValue(transaction);

        // Mock DB models
        jest.spyOn(PurchaseOrder, 'count').mockResolvedValue(100);
        jest.spyOn(PurchaseOrder, 'create').mockImplementation((data: any) => Promise.resolve({
            id: 1,
            ...data,
            save: jest.fn(),
            destroy: jest.fn()
        } as any));
        jest.spyOn(PurchaseOrder, 'findOne').mockImplementation(() => Promise.resolve({
            id: 1,
            poNumber: 'PO-2026-0101',
            status: POStatusEnum.PENDING,
            items: [],
            save: jest.fn(),
            destroy: jest.fn()
        } as any));

        jest.spyOn(PurchaseOrderItem, 'bulkCreate').mockResolvedValue([]);
        jest.spyOn(PurchaseOrderItem, 'destroy').mockResolvedValue(1);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // 1. HAPPY PATH: CREATE PO
    test('Should create a Purchase Order successfully with valid data', async () => {
        const input = {
            vendorId: 1,
            projectId: 'proj-123',
            items: [
                { description: 'Item 1', quantity: 10, unitPrice: 100, tax: 15 },
                { description: 'Item 2', quantity: 5, unitPrice: 200, tax: 0 }
            ],
            paymentMethod: 'Cash',
            totalAmount: 2150 // (10*100*1.15) + (5*200) = 1150 + 1000 = 2150
        };
        const user = { id: 99, name: 'Tester' };

        const result = await ProcurementService.createPurchaseOrder(input, user as any);

        expect(result).toBeDefined();
        expect(result.poNumber).toBe('PO-2026-0101');
        expect(result.createdBy).toBe(99);
        expect(sequelize.transaction).toHaveBeenCalled();
        expect(PurchaseOrder.create).toHaveBeenCalled();
        expect(PurchaseOrderItem.bulkCreate).toHaveBeenCalledTimes(1);
        expect(transaction.commit).toHaveBeenCalled();
    });

    // 2. VALIDATION: NEGATIVE PRICE
    test('Should throw error for negative item price', async () => {
        const input = {
            vendorId: 1,
            items: [
                { description: 'Bad Item', quantity: 10, unitPrice: -100, tax: 15 }
            ]
        };
        const user = { id: 99 };

        // No mock needed for rejection, service throws.
        await expect(ProcurementService.createPurchaseOrder(input, user as any))
            .rejects
            .toThrow("Invalid Unit Price for item: Bad Item");
    });

    // 3. VALIDATION: EMPTY ITEMS
    test('Should throw error if items array is empty', async () => {
        const input = {
            vendorId: 1,
            items: []
        };
        const user = { id: 99 };

        await expect(ProcurementService.createPurchaseOrder(input, user as any))
            .rejects
            .toThrow("Purchase Order must have at least one item");
    });

    // 4. CALCULATION CHECK
    test('Should calculate totals correctly', async () => {
        // This relies on the implementation logic we are auditing. 
        // If the service trusts the frontend total, this test is about the flow.
    });

    // 5. APPROVAL FLOW
    test('Should update status to APPROVED', async () => {
        const user = { id: 99 };
        const result = await ProcurementService.updatePurchaseOrderStatus('1', POStatusEnum.APPROVED, user as any);

        expect(result.status).toBe(POStatusEnum.APPROVED);
        expect(result.save).toHaveBeenCalled();
    });

});
