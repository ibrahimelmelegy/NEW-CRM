import { useApiFetch } from './useApiFetch';

export function useInventory() {
    const fetchProducts = (params?: Record<string, any>) => {
        const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
        return useApiFetch(`inventory/products${query}`);
    };

    const fetchProduct = (id: number) => useApiFetch(`inventory/products/${id}`);

    const createProduct = (data: any) => useApiFetch('inventory/products', 'POST', data);

    const updateProduct = (id: number, data: any) => useApiFetch(`inventory/products/${id}`, 'PUT', data);

    const deleteProduct = (id: number) => useApiFetch(`inventory/products/${id}`, 'DELETE');

    const fetchLowStock = () => useApiFetch('inventory/products/low-stock');

    const fetchCategories = () => useApiFetch('inventory/products/categories');

    const fetchWarehouses = () => useApiFetch('inventory/products/warehouses');

    const fetchMovements = (productId: number) => useApiFetch(`inventory/products/${productId}/movements`);

    const addMovement = (data: any) => useApiFetch('inventory/movements', 'POST', data);

    return {
        fetchProducts,
        fetchProduct,
        createProduct,
        updateProduct,
        deleteProduct,
        fetchLowStock,
        fetchCategories,
        fetchWarehouses,
        fetchMovements,
        addMovement
    };
}
