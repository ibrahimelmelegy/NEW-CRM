
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/inventory/productModel');
jest.mock('../../src/inventory/stockMovementModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

import inventoryService from '../../src/inventory/inventoryService';
import Product from '../../src/inventory/productModel';
import StockMovement from '../../src/inventory/stockMovementModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

describe('InventoryService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. getProducts
    // --------------------------------------------------------------------------
    describe('getProducts', () => {
        it('should return paginated products', async () => {
            const mockProducts = [{ id: 'prod-1', name: 'Widget', sku: 'WDG-001' }];
            (Product.findAndCountAll as jest.Mock<any>).mockResolvedValue({
                rows: mockProducts,
                count: 1,
            });

            const result = await inventoryService.getProducts({ page: 1, limit: 10 });

            expect(result.docs).toEqual(mockProducts);
            expect(result.pagination.totalItems).toBe(1);
            expect(result.pagination.page).toBe(1);
        });

        it('should apply category filter', async () => {
            (Product.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await inventoryService.getProducts({ page: 1, limit: 10, category: 'Electronics' });

            const callArgs = (Product.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.category).toBe('Electronics');
        });

        it('should apply isActive filter', async () => {
            (Product.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await inventoryService.getProducts({ page: 1, limit: 10, isActive: 'true' });

            const callArgs = (Product.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.isActive).toBe(true);
        });
    });

    // --------------------------------------------------------------------------
    // 2. getProductById
    // --------------------------------------------------------------------------
    describe('getProductById', () => {
        it('should return product by id', async () => {
            const mockProduct = { id: 'prod-1', name: 'Widget' };
            (Product.findByPk as jest.Mock<any>).mockResolvedValue(mockProduct);

            const result = await inventoryService.getProductById('prod-1');
            expect(result).toEqual(mockProduct);
        });

        it('should throw PRODUCT_NOT_FOUND when product does not exist', async () => {
            (Product.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(inventoryService.getProductById('nonexistent'))
                .rejects.toThrow(new BaseError(ERRORS.PRODUCT_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 3. createProduct
    // --------------------------------------------------------------------------
    describe('createProduct', () => {
        it('should create a product', async () => {
            const mockProduct = { id: 'prod-1', name: 'New Widget', sku: 'NW-001' };
            (Product.create as jest.Mock<any>).mockResolvedValue(mockProduct);

            const result = await inventoryService.createProduct({
                name: 'New Widget',
                sku: 'NW-001',
                currentStock: 100,
            });

            expect(result).toEqual(mockProduct);
            expect(Product.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'New Widget', sku: 'NW-001' })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 4. updateProduct
    // --------------------------------------------------------------------------
    describe('updateProduct', () => {
        it('should update a product', async () => {
            const mockProduct = {
                id: 'prod-1',
                set: jest.fn(),
                save: jest.fn().mockResolvedValue(true),
            };
            (Product.findOne as jest.Mock<any>).mockResolvedValue(mockProduct);

            await inventoryService.updateProduct('prod-1', { name: 'Updated Widget' });

            expect(mockProduct.set).toHaveBeenCalledWith({ name: 'Updated Widget' });
            expect(mockProduct.save).toHaveBeenCalled();
        });

        it('should throw PRODUCT_NOT_FOUND when product does not exist', async () => {
            (Product.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(inventoryService.updateProduct('nonexistent', { name: 'X' }))
                .rejects.toThrow(new BaseError(ERRORS.PRODUCT_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 5. deleteProduct
    // --------------------------------------------------------------------------
    describe('deleteProduct', () => {
        it('should delete a product', async () => {
            const mockProduct = { id: 'prod-1', destroy: jest.fn().mockResolvedValue(true) };
            (Product.findOne as jest.Mock<any>).mockResolvedValue(mockProduct);

            await inventoryService.deleteProduct('prod-1');

            expect(mockProduct.destroy).toHaveBeenCalled();
        });

        it('should throw PRODUCT_NOT_FOUND when product does not exist', async () => {
            (Product.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(inventoryService.deleteProduct('nonexistent'))
                .rejects.toThrow(new BaseError(ERRORS.PRODUCT_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 6. addStockMovement
    // --------------------------------------------------------------------------
    describe('addStockMovement', () => {
        it('should add IN stock movement and increase stock', async () => {
            const mockProduct = {
                id: 'prod-1',
                currentStock: 50,
                save: jest.fn().mockResolvedValue(true),
            };
            (Product.findOne as jest.Mock<any>).mockResolvedValue(mockProduct);

            const mockMovement = { id: 'mov-1', type: 'IN', quantity: 20 };
            (StockMovement.create as jest.Mock<any>).mockResolvedValue(mockMovement);

            const result = await inventoryService.addStockMovement({
                productId: 'prod-1',
                type: 'IN',
                quantity: 20,
            });

            expect(result).toEqual(mockMovement);
            expect(mockProduct.currentStock).toBe(70); // 50 + 20
            expect(mockProduct.save).toHaveBeenCalled();
        });

        it('should add OUT stock movement and decrease stock', async () => {
            const mockProduct = {
                id: 'prod-1',
                currentStock: 50,
                save: jest.fn().mockResolvedValue(true),
            };
            (Product.findOne as jest.Mock<any>).mockResolvedValue(mockProduct);
            (StockMovement.create as jest.Mock<any>).mockResolvedValue({ id: 'mov-2' });

            await inventoryService.addStockMovement({
                productId: 'prod-1',
                type: 'OUT',
                quantity: 10,
            });

            expect(mockProduct.currentStock).toBe(40); // 50 - 10
        });

        it('should set stock to exact quantity for ADJUSTMENT', async () => {
            const mockProduct = {
                id: 'prod-1',
                currentStock: 50,
                save: jest.fn().mockResolvedValue(true),
            };
            (Product.findOne as jest.Mock<any>).mockResolvedValue(mockProduct);
            (StockMovement.create as jest.Mock<any>).mockResolvedValue({ id: 'mov-3' });

            await inventoryService.addStockMovement({
                productId: 'prod-1',
                type: 'ADJUSTMENT',
                quantity: 75,
            });

            expect(mockProduct.currentStock).toBe(75);
        });

        it('should decrease stock for TRANSFER type', async () => {
            const mockProduct = {
                id: 'prod-1',
                currentStock: 100,
                save: jest.fn().mockResolvedValue(true),
            };
            (Product.findOne as jest.Mock<any>).mockResolvedValue(mockProduct);
            (StockMovement.create as jest.Mock<any>).mockResolvedValue({ id: 'mov-4' });

            await inventoryService.addStockMovement({
                productId: 'prod-1',
                type: 'TRANSFER',
                quantity: 30,
            });

            expect(mockProduct.currentStock).toBe(70); // 100 - 30
        });

        it('should throw PRODUCT_NOT_FOUND for invalid product', async () => {
            (Product.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(inventoryService.addStockMovement({
                productId: 'nonexistent',
                type: 'IN',
                quantity: 10,
            })).rejects.toThrow(new BaseError(ERRORS.PRODUCT_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // 7. getStockMovements
    // --------------------------------------------------------------------------
    describe('getStockMovements', () => {
        it('should return stock movements for a product', async () => {
            const mockMovements = [
                { id: 'mov-1', type: 'IN', quantity: 20 },
                { id: 'mov-2', type: 'OUT', quantity: 5 },
            ];
            (StockMovement.findAll as jest.Mock<any>).mockResolvedValue(mockMovements);

            const result = await inventoryService.getStockMovements('prod-1');

            expect(result).toEqual(mockMovements);
            expect(StockMovement.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: { productId: 'prod-1' } })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 8. getLowStockProducts
    // --------------------------------------------------------------------------
    describe('getLowStockProducts', () => {
        it('should return products where stock is at or below min level', async () => {
            const lowStockProducts = [
                { id: 'prod-1', name: 'Low Widget', currentStock: 2, minStockLevel: 10 },
            ];
            (Product.findAll as jest.Mock<any>).mockResolvedValue(lowStockProducts);

            const result = await inventoryService.getLowStockProducts();

            expect(result).toEqual(lowStockProducts);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });
});
