
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/ecommerce/category/categoryModel');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

import categoryService from '../../src/ecommerce/category/categoryService';
import EcCategory from '../../src/ecommerce/category/categoryModel';

describe('CategoryService (ecommerce)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. getCategories
    // --------------------------------------------------------------------------
    describe('getCategories', () => {
        it('should return paginated categories', async () => {
            const mockCategories = [{ id: 'cat-1', name: 'Electronics', slug: 'electronics' }];
            (EcCategory.findAndCountAll as jest.Mock<any>).mockResolvedValue({
                rows: mockCategories,
                count: 1,
            });

            const result = await categoryService.getCategories({ page: 1, limit: 10 });

            expect(result.docs).toEqual(mockCategories);
            expect(result.pagination.totalItems).toBe(1);
            expect(result.pagination.page).toBe(1);
        });

        it('should apply isActive filter', async () => {
            (EcCategory.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await categoryService.getCategories({ page: 1, limit: 10, isActive: 'true' });

            const callArgs = (EcCategory.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.isActive).toBe(true);
        });

        it('should filter by parentId null for root categories', async () => {
            (EcCategory.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            await categoryService.getCategories({ page: 1, limit: 10, parentId: 'null' });

            const callArgs = (EcCategory.findAndCountAll as jest.Mock<any>).mock.calls[0][0] as any;
            expect(callArgs.where.parentId).toBeNull();
        });
    });

    // --------------------------------------------------------------------------
    // 2. getCategoryById
    // --------------------------------------------------------------------------
    describe('getCategoryById', () => {
        it('should return category by id', async () => {
            const mockCategory = { id: 'cat-1', name: 'Electronics' };
            (EcCategory.findByPk as jest.Mock<any>).mockResolvedValue(mockCategory);

            const result = await categoryService.getCategoryById('cat-1');
            expect(result).toEqual(mockCategory);
        });

        it('should throw when category not found', async () => {
            (EcCategory.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(categoryService.getCategoryById('nonexistent'))
                .rejects.toThrow('Category not found');
        });
    });

    // --------------------------------------------------------------------------
    // 3. getCategoryTree
    // --------------------------------------------------------------------------
    describe('getCategoryTree', () => {
        it('should return nested category tree', async () => {
            const mockTree = [
                {
                    id: 'cat-1',
                    name: 'Electronics',
                    children: [{ id: 'cat-2', name: 'Phones', children: [] }],
                },
            ];
            (EcCategory.findAll as jest.Mock<any>).mockResolvedValue(mockTree);

            const result = await categoryService.getCategoryTree();

            expect(result).toEqual(mockTree);
            expect(EcCategory.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: { parentId: null } })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 4. createCategory
    // --------------------------------------------------------------------------
    describe('createCategory', () => {
        it('should create category with generated slug', async () => {
            (EcCategory.findOne as jest.Mock<any>).mockResolvedValue(null); // Slug not taken
            const mockCategory = { id: 'cat-1', name: 'Smart Phones', slug: 'smart-phones' };
            (EcCategory.create as jest.Mock<any>).mockResolvedValue(mockCategory);

            const result = await categoryService.createCategory({ name: 'Smart Phones' });

            expect(result).toEqual(mockCategory);
            expect(EcCategory.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Smart Phones', slug: 'smart-phones' })
            );
        });

        it('should append suffix when slug already exists', async () => {
            // First call: slug exists, second call: slug-1 does not exist
            (EcCategory.findOne as jest.Mock<any>)
                .mockResolvedValueOnce({ id: 'existing' })   // 'electronics' taken
                .mockResolvedValueOnce(null);                  // 'electronics-1' available
            (EcCategory.create as jest.Mock<any>).mockResolvedValue({ id: 'cat-2', slug: 'electronics-1' });

            const result = await categoryService.createCategory({ name: 'Electronics' });

            expect(EcCategory.create).toHaveBeenCalledWith(
                expect.objectContaining({ slug: 'electronics-1' })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 5. updateCategory
    // --------------------------------------------------------------------------
    describe('updateCategory', () => {
        it('should update category', async () => {
            const mockCategory = {
                id: 'cat-1',
                name: 'Old Name',
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (EcCategory.findByPk as jest.Mock<any>).mockResolvedValue(mockCategory);

            await categoryService.updateCategory('cat-1', { sortOrder: 5 });

            expect(mockCategory.update).toHaveBeenCalledWith({ sortOrder: 5 });
        });

        it('should regenerate slug when name changes', async () => {
            const mockCategory = {
                id: 'cat-1',
                name: 'Old Name',
                update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (EcCategory.findByPk as jest.Mock<any>).mockResolvedValue(mockCategory);
            (EcCategory.findOne as jest.Mock<any>).mockResolvedValue(null); // New slug available

            await categoryService.updateCategory('cat-1', { name: 'New Name' });

            expect(mockCategory.update).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'New Name', slug: 'new-name' })
            );
        });

        it('should throw when category not found', async () => {
            (EcCategory.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(categoryService.updateCategory('nonexistent', { name: 'X' }))
                .rejects.toThrow('Category not found');
        });
    });

    // --------------------------------------------------------------------------
    // 6. deleteCategory
    // --------------------------------------------------------------------------
    describe('deleteCategory', () => {
        it('should delete a category without children', async () => {
            const mockCategory = {
                id: 'cat-1',
                children: [],
                destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
            };
            (EcCategory.findByPk as jest.Mock<any>).mockResolvedValue(mockCategory);

            await categoryService.deleteCategory('cat-1');

            expect(mockCategory.destroy).toHaveBeenCalled();
        });

        it('should throw when category not found', async () => {
            (EcCategory.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(categoryService.deleteCategory('nonexistent'))
                .rejects.toThrow('Category not found');
        });

        it('should throw when category has subcategories', async () => {
            const mockCategory = {
                id: 'cat-1',
                children: [{ id: 'cat-2', name: 'Child' }],
            };
            (EcCategory.findByPk as jest.Mock<any>).mockResolvedValue(mockCategory);

            await expect(categoryService.deleteCategory('cat-1'))
                .rejects.toThrow('Cannot delete category with subcategories');
        });
    });
});
