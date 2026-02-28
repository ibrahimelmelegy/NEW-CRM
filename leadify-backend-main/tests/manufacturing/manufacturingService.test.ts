
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/manufacturing/bomModel');
jest.mock('../../src/manufacturing/bomItemModel');
jest.mock('../../src/manufacturing/workOrderModel');
jest.mock('../../src/manufacturing/qualityCheckModel');
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

import manufacturingService from '../../src/manufacturing/manufacturingService';
import BOM from '../../src/manufacturing/bomModel';
import BOMItem from '../../src/manufacturing/bomItemModel';
import WorkOrder from '../../src/manufacturing/workOrderModel';
import QualityCheck from '../../src/manufacturing/qualityCheckModel';

describe('ManufacturingService', () => {
    const mockUser: any = { id: 1, tenantId: 'tenant-1' };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. getBOMs
    // --------------------------------------------------------------------------
    describe('getBOMs', () => {
        it('should return all BOMs for a tenant', async () => {
            const mockBOMs = [{ id: 1, productName: 'Widget', code: 'WDG-001' }];
            (BOM.findAll as jest.Mock<any>).mockResolvedValue(mockBOMs);

            const result = await manufacturingService.getBOMs(mockUser);

            expect(result).toEqual(mockBOMs);
            expect(BOM.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ tenantId: 'tenant-1' }),
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 2. getBOMById
    // --------------------------------------------------------------------------
    describe('getBOMById', () => {
        it('should return BOM by id', async () => {
            const mockBOM = { id: 1, productName: 'Widget', items: [] };
            (BOM.findOne as jest.Mock<any>).mockResolvedValue(mockBOM);

            const result = await manufacturingService.getBOMById(1, mockUser);
            expect(result).toEqual(mockBOM);
        });

        it('should throw when BOM not found', async () => {
            (BOM.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(manufacturingService.getBOMById(999, mockUser))
                .rejects.toThrow('BOM not found');
        });
    });

    // --------------------------------------------------------------------------
    // 3. createBOM
    // --------------------------------------------------------------------------
    describe('createBOM', () => {
        it('should create a BOM with items and calculate total cost', async () => {
            const mockBOM = {
                id: 1,
                productName: 'Widget',
                totalCost: 0,
                update: jest.fn().mockResolvedValue(true),
            };
            (BOM.create as jest.Mock<any>).mockResolvedValue(mockBOM);
            (BOMItem.create as jest.Mock<any>).mockResolvedValue({});
            // For getBOMById call after creation
            (BOM.findOne as jest.Mock<any>).mockResolvedValue({
                id: 1,
                productName: 'Widget',
                totalCost: 150,
                items: [
                    { name: 'Steel', quantity: 5, unitCost: 10 },
                    { name: 'Rubber', quantity: 10, unitCost: 10 },
                ],
            });

            const result = await manufacturingService.createBOM(
                {
                    productName: 'Widget',
                    code: 'WDG-001',
                    items: [
                        { name: 'Steel', quantity: 5, unitCost: 10 },
                        { name: 'Rubber', quantity: 10, unitCost: 10 },
                    ],
                },
                mockUser
            );

            expect(BOM.create).toHaveBeenCalled();
            expect(BOMItem.create).toHaveBeenCalledTimes(2);
            expect(mockBOM.update).toHaveBeenCalledWith(
                { totalCost: 150 }, // 5*10 + 10*10
                expect.anything()
            );
            expect(mockTransaction.commit).toHaveBeenCalled();
        });

        it('should rollback transaction on error', async () => {
            (BOM.create as jest.Mock<any>).mockRejectedValue(new Error('DB error'));

            await expect(manufacturingService.createBOM({ productName: 'Fail' }, mockUser))
                .rejects.toThrow('DB error');

            expect(mockTransaction.rollback).toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------------------
    // 4. deleteBOM
    // --------------------------------------------------------------------------
    describe('deleteBOM', () => {
        it('should delete a BOM and its items', async () => {
            const mockBOM = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
            (BOM.findOne as jest.Mock<any>).mockResolvedValue(mockBOM);
            (BOMItem.destroy as jest.Mock<any>).mockResolvedValue(3);

            const result = await manufacturingService.deleteBOM(1, mockUser);

            expect(result).toEqual({ deleted: true });
            expect(BOMItem.destroy).toHaveBeenCalledWith({ where: { bomId: 1 } });
            expect(mockBOM.destroy).toHaveBeenCalled();
        });

        it('should throw when BOM not found', async () => {
            (BOM.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(manufacturingService.deleteBOM(999, mockUser))
                .rejects.toThrow('BOM not found');
        });
    });

    // --------------------------------------------------------------------------
    // 5. getWorkOrders
    // --------------------------------------------------------------------------
    describe('getWorkOrders', () => {
        it('should return all work orders for a tenant', async () => {
            const mockWOs = [{ id: 1, woNumber: 'WO-001', status: 'PLANNED' }];
            (WorkOrder.findAll as jest.Mock<any>).mockResolvedValue(mockWOs);

            const result = await manufacturingService.getWorkOrders(mockUser);

            expect(result).toEqual(mockWOs);
        });

        it('should apply status filter', async () => {
            (WorkOrder.findAll as jest.Mock<any>).mockResolvedValue([]);

            await manufacturingService.getWorkOrders(mockUser, { status: 'IN_PROGRESS' });

            const callArgs = (WorkOrder.findAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.status).toBe('IN_PROGRESS');
        });
    });

    // --------------------------------------------------------------------------
    // 6. getWorkOrderById
    // --------------------------------------------------------------------------
    describe('getWorkOrderById', () => {
        it('should return work order by id', async () => {
            const mockWO = { id: 1, woNumber: 'WO-001' };
            (WorkOrder.findOne as jest.Mock<any>).mockResolvedValue(mockWO);

            const result = await manufacturingService.getWorkOrderById(1, mockUser);
            expect(result).toEqual(mockWO);
        });

        it('should throw when work order not found', async () => {
            (WorkOrder.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(manufacturingService.getWorkOrderById(999, mockUser))
                .rejects.toThrow('Work order not found');
        });
    });

    // --------------------------------------------------------------------------
    // 7. createWorkOrder
    // --------------------------------------------------------------------------
    describe('createWorkOrder', () => {
        it('should create a work order with generated WO number', async () => {
            // For generateWONumber
            (WorkOrder.findOne as jest.Mock<any>).mockResolvedValue(null); // No previous WOs
            (WorkOrder.create as jest.Mock<any>).mockResolvedValue({
                id: 1,
                woNumber: 'WO-001',
                status: 'PLANNED',
            });

            const result = await manufacturingService.createWorkOrder(
                { productName: 'Widget', quantity: 100 },
                mockUser
            );

            expect(result.woNumber).toBe('WO-001');
            expect(WorkOrder.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    woNumber: 'WO-001',
                    status: 'PLANNED',
                    planned: 100,
                    produced: 0,
                })
            );
        });

        it('should increment WO number from last work order', async () => {
            (WorkOrder.findOne as jest.Mock<any>).mockResolvedValue({ woNumber: 'WO-042' });
            (WorkOrder.create as jest.Mock<any>).mockResolvedValue({
                id: 2,
                woNumber: 'WO-043',
            });

            await manufacturingService.createWorkOrder({ productName: 'Gadget' }, mockUser);

            expect(WorkOrder.create).toHaveBeenCalledWith(
                expect.objectContaining({ woNumber: 'WO-043' })
            );
        });

        it('should populate productName from BOM if bomId provided', async () => {
            (WorkOrder.findOne as jest.Mock<any>).mockResolvedValue(null);
            (BOM.findByPk as jest.Mock<any>).mockResolvedValue({ id: 1, productName: 'BOM Product', code: 'BOM-001' });
            (WorkOrder.create as jest.Mock<any>).mockResolvedValue({ id: 1 });

            await manufacturingService.createWorkOrder({ bomId: 1 }, mockUser);

            expect(WorkOrder.create).toHaveBeenCalledWith(
                expect.objectContaining({ productName: 'BOM Product', bomCode: 'BOM-001' })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 8. updateProduction
    // --------------------------------------------------------------------------
    describe('updateProduction', () => {
        it('should update production count and set IN_PROGRESS', async () => {
            const mockWO = {
                id: 1,
                planned: 100,
                produced: 0,
                update: jest.fn().mockResolvedValue(true),
            };
            (WorkOrder.findOne as jest.Mock<any>).mockResolvedValue(mockWO);

            await manufacturingService.updateProduction(1, 50, mockUser);

            expect(mockWO.update).toHaveBeenCalledWith({
                produced: 50,
                status: 'IN_PROGRESS',
            });
        });

        it('should set status to COMPLETED when produced equals planned', async () => {
            const mockWO = {
                id: 1,
                planned: 100,
                produced: 80,
                update: jest.fn().mockResolvedValue(true),
            };
            (WorkOrder.findOne as jest.Mock<any>).mockResolvedValue(mockWO);

            await manufacturingService.updateProduction(1, 100, mockUser);

            expect(mockWO.update).toHaveBeenCalledWith({
                produced: 100,
                status: 'COMPLETED',
            });
        });

        it('should cap produced at planned quantity', async () => {
            const mockWO = {
                id: 1,
                planned: 100,
                produced: 0,
                update: jest.fn().mockResolvedValue(true),
            };
            (WorkOrder.findOne as jest.Mock<any>).mockResolvedValue(mockWO);

            await manufacturingService.updateProduction(1, 150, mockUser);

            expect(mockWO.update).toHaveBeenCalledWith({
                produced: 100, // Capped at planned
                status: 'COMPLETED',
            });
        });

        it('should throw when work order not found', async () => {
            (WorkOrder.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(manufacturingService.updateProduction(999, 50, mockUser))
                .rejects.toThrow('Work order not found');
        });
    });

    // --------------------------------------------------------------------------
    // 9. createQualityCheck
    // --------------------------------------------------------------------------
    describe('createQualityCheck', () => {
        it('should create quality check with PASS result when pass rate >= 95%', async () => {
            (QualityCheck.create as jest.Mock<any>).mockImplementation((data: any) =>
                Promise.resolve({ id: 1, ...data })
            );

            const result = await manufacturingService.createQualityCheck(
                { workOrderId: 1, inspected: 100, passed: 96 },
                mockUser
            );

            expect(QualityCheck.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    inspected: 100,
                    passed: 96,
                    defects: 4,
                    result: 'PASS',
                })
            );
        });

        it('should create quality check with FAIL result when pass rate < 95%', async () => {
            (QualityCheck.create as jest.Mock<any>).mockImplementation((data: any) =>
                Promise.resolve({ id: 1, ...data })
            );

            const result = await manufacturingService.createQualityCheck(
                { workOrderId: 1, inspected: 100, passed: 90 },
                mockUser
            );

            expect(QualityCheck.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    defects: 10,
                    result: 'FAIL',
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 10. getStats
    // --------------------------------------------------------------------------
    describe('getStats', () => {
        it('should return manufacturing statistics', async () => {
            (BOM.count as jest.Mock<any>).mockResolvedValue(10);
            (WorkOrder.count as jest.Mock<any>)
                .mockResolvedValueOnce(50)   // woCount
                .mockResolvedValueOnce(30)   // completed
                .mockResolvedValueOnce(15);  // inProgress
            (QualityCheck.count as jest.Mock<any>).mockResolvedValue(2); // qualityIssues
            (WorkOrder.sum as jest.Mock<any>)
                .mockResolvedValueOnce(1000)  // totalPlanned
                .mockResolvedValueOnce(850);  // totalProduced

            const result = await manufacturingService.getStats(mockUser);

            expect(result.bomCount).toBe(10);
            expect(result.woCount).toBe(50);
            expect(result.completed).toBe(30);
            expect(result.inProgress).toBe(15);
            expect(result.qualityIssues).toBe(2);
            expect(result.efficiency).toBe(85); // 850/1000 * 100
        });

        it('should return 0 efficiency when no planned production', async () => {
            (BOM.count as jest.Mock<any>).mockResolvedValue(0);
            (WorkOrder.count as jest.Mock<any>).mockResolvedValue(0);
            (QualityCheck.count as jest.Mock<any>).mockResolvedValue(0);
            (WorkOrder.sum as jest.Mock<any>).mockResolvedValue(0);

            const result = await manufacturingService.getStats(mockUser);

            expect(result.efficiency).toBe(0);
        });
    });
});
