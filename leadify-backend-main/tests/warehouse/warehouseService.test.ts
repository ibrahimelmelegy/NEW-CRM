
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/warehouse/warehouseModel');
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

import warehouseService from '../../src/warehouse/warehouseService';
import { Warehouse, WarehouseZone, StockTransfer } from '../../src/warehouse/warehouseModel';
import { io } from '../../src/server';

describe('WarehouseService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. createWarehouse
    // --------------------------------------------------------------------------
    describe('createWarehouse', () => {
        it('should create a warehouse', async () => {
            const mockWarehouse = { id: 1, name: 'Main Warehouse', status: 'ACTIVE' };
            (Warehouse.create as jest.Mock<any>).mockResolvedValue(mockWarehouse);

            const result = await warehouseService.createWarehouse({ name: 'Main Warehouse', capacity: 1000 });

            expect(result).toEqual(mockWarehouse);
            expect(Warehouse.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Main Warehouse' })
            );
        });

        it('should include tenantId if provided', async () => {
            (Warehouse.create as jest.Mock<any>).mockResolvedValue({ id: 1 });

            await warehouseService.createWarehouse({ name: 'WH' }, 'tenant-1');

            expect(Warehouse.create).toHaveBeenCalledWith(
                expect.objectContaining({ tenantId: 'tenant-1' })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 2. getWarehouses
    // --------------------------------------------------------------------------
    describe('getWarehouses', () => {
        it('should return paginated warehouses', async () => {
            const mockRows = [{ id: 1, name: 'WH-1' }];
            (Warehouse.findAndCountAll as jest.Mock<any>).mockResolvedValue({
                rows: mockRows,
                count: 1,
            });

            const result = await warehouseService.getWarehouses({ page: 1, limit: 10 });

            expect(result.docs).toEqual(mockRows);
            expect(result.pagination.totalItems).toBe(1);
        });

        it('should apply status filter', async () => {
            (Warehouse.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await warehouseService.getWarehouses({ page: 1, limit: 10, status: 'ACTIVE' });

            const callArgs = (Warehouse.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.status).toBe('ACTIVE');
        });
    });

    // --------------------------------------------------------------------------
    // 3. updateWarehouse
    // --------------------------------------------------------------------------
    describe('updateWarehouse', () => {
        it('should update a warehouse', async () => {
            const mockWarehouse = {
                id: 1,
                name: 'Old Name',
                update: jest.fn().mockResolvedValue(true),
            };
            (Warehouse.findByPk as jest.Mock<any>).mockResolvedValue(mockWarehouse);

            const result = await warehouseService.updateWarehouse(1, { name: 'New Name' });

            expect(mockWarehouse.update).toHaveBeenCalledWith({ name: 'New Name' });
            expect(result).toBeDefined();
        });

        it('should return null when warehouse not found', async () => {
            (Warehouse.findByPk as jest.Mock<any>).mockResolvedValue(null);

            const result = await warehouseService.updateWarehouse(999, { name: 'X' });
            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 4. deleteWarehouse
    // --------------------------------------------------------------------------
    describe('deleteWarehouse', () => {
        it('should delete a warehouse and its zones', async () => {
            const mockWarehouse = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
            (Warehouse.findByPk as jest.Mock<any>).mockResolvedValue(mockWarehouse);
            (WarehouseZone.destroy as jest.Mock<any>).mockResolvedValue(3);

            const result = await warehouseService.deleteWarehouse(1);

            expect(result).toBe(true);
            expect(WarehouseZone.destroy).toHaveBeenCalledWith({ where: { warehouseId: 1 } });
            expect(mockWarehouse.destroy).toHaveBeenCalled();
        });

        it('should return false when warehouse not found', async () => {
            (Warehouse.findByPk as jest.Mock<any>).mockResolvedValue(null);

            const result = await warehouseService.deleteWarehouse(999);
            expect(result).toBe(false);
        });
    });

    // --------------------------------------------------------------------------
    // 5. createZone
    // --------------------------------------------------------------------------
    describe('createZone', () => {
        it('should create a warehouse zone', async () => {
            const mockZone = { id: 1, name: 'Zone A', type: 'STORAGE', warehouseId: 1 };
            (WarehouseZone.create as jest.Mock<any>).mockResolvedValue(mockZone);

            const result = await warehouseService.createZone({
                name: 'Zone A',
                type: 'STORAGE',
                warehouseId: 1,
            });

            expect(result).toEqual(mockZone);
        });
    });

    // --------------------------------------------------------------------------
    // 6. deleteZone
    // --------------------------------------------------------------------------
    describe('deleteZone', () => {
        it('should delete a zone', async () => {
            const mockZone = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
            (WarehouseZone.findByPk as jest.Mock<any>).mockResolvedValue(mockZone);

            const result = await warehouseService.deleteZone(1);

            expect(result).toBe(true);
            expect(mockZone.destroy).toHaveBeenCalled();
        });

        it('should return false when zone not found', async () => {
            (WarehouseZone.findByPk as jest.Mock<any>).mockResolvedValue(null);

            const result = await warehouseService.deleteZone(999);
            expect(result).toBe(false);
        });
    });

    // --------------------------------------------------------------------------
    // 7. createTransfer
    // --------------------------------------------------------------------------
    describe('createTransfer', () => {
        it('should create a stock transfer with generated number', async () => {
            const mockTransfer = {
                id: 1,
                transferNumber: 'TRF-ABC123',
                fromWarehouseId: 1,
                toWarehouseId: 2,
            };
            (StockTransfer.create as jest.Mock<any>).mockResolvedValue(mockTransfer);

            const result = await warehouseService.createTransfer({
                fromWarehouseId: 1,
                toWarehouseId: 2,
                items: [{ productName: 'Widget', quantity: 10 }],
            });

            expect(result).toEqual(mockTransfer);
            expect(StockTransfer.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    fromWarehouseId: 1,
                    toWarehouseId: 2,
                    transferNumber: expect.stringMatching(/^TRF-/),
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 8. getTransfers
    // --------------------------------------------------------------------------
    describe('getTransfers', () => {
        it('should return paginated transfers', async () => {
            const mockRows = [{ id: 1, transferNumber: 'TRF-001' }];
            (StockTransfer.findAndCountAll as jest.Mock<any>).mockResolvedValue({
                rows: mockRows,
                count: 1,
            });

            const result = await warehouseService.getTransfers({ page: 1, limit: 10 });

            expect(result.docs).toEqual(mockRows);
            expect(result.pagination.totalItems).toBe(1);
        });
    });

    // --------------------------------------------------------------------------
    // 9. updateTransfer
    // --------------------------------------------------------------------------
    describe('updateTransfer', () => {
        it('should update a transfer', async () => {
            const mockTransfer = {
                id: 1,
                status: 'PENDING',
                update: jest.fn().mockResolvedValue(true),
            };
            (StockTransfer.findByPk as jest.Mock<any>).mockResolvedValue(mockTransfer);

            const result = await warehouseService.updateTransfer(1, { notes: 'Updated' });

            expect(mockTransfer.update).toHaveBeenCalledWith({ notes: 'Updated' });
        });

        it('should return null when transfer not found', async () => {
            (StockTransfer.findByPk as jest.Mock<any>).mockResolvedValue(null);

            const result = await warehouseService.updateTransfer(999, {});
            expect(result).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 10. getStockSummary
    // --------------------------------------------------------------------------
    describe('getStockSummary', () => {
        it('should throw when warehouse not found', async () => {
            (Warehouse.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(warehouseService.getStockSummary(999))
                .rejects.toThrow('Warehouse not found');
        });

        it('should return stock summary with zone info', async () => {
            const mockWarehouse = {
                id: 1,
                name: 'Main WH',
                capacity: 1000,
                currentOccupancy: 100,
                zones: [{ id: 1, name: 'Zone A', type: 'STORAGE', capacity: 500 }],
            };
            (Warehouse.findByPk as jest.Mock<any>).mockResolvedValue(mockWarehouse);
            // Mock buildStockLedger: no transfers => empty ledger
            (StockTransfer.findAll as jest.Mock<any>).mockResolvedValue([]);

            const result = await warehouseService.getStockSummary(1);

            expect(result.warehouseId).toBe(1);
            expect(result.warehouseName).toBe('Main WH');
            expect(result.zones).toHaveLength(1);
        });
    });
});
