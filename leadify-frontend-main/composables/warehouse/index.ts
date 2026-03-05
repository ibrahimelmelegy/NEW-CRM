import { useApiFetch } from '~/composables/useApiFetch';

export const useWarehouse = () => {
  const getWarehouses = (params?: unknown) => useApiFetch('warehouse', 'GET', undefined, params);
  const getWarehouseById = (id: string | number) => useApiFetch(`warehouse/${id}`, 'GET');
  const createWarehouse = (data: unknown) => useApiFetch('warehouse', 'POST', data);
  const updateWarehouse = (id: string | number, data: unknown) => useApiFetch(`warehouse/${id}`, 'PUT', data);
  const deleteWarehouse = (id: string | number) => useApiFetch(`warehouse/${id}`, 'DELETE');
  const getZones = (params?: unknown) => useApiFetch('warehouse/zones', 'GET', undefined, params);
  const createZone = (data: unknown) => useApiFetch('warehouse/zones', 'POST', data);
  const deleteZone = (id: string | number) => useApiFetch(`warehouse/zones/${id}`, 'DELETE');
  const getStock = (params?: unknown) => useApiFetch('warehouse/stock', 'GET', undefined, params);
  const getTransfers = (params?: unknown) => useApiFetch('warehouse/transfers', 'GET', undefined, params);
  const createTransfer = (data: unknown) => useApiFetch('warehouse/transfers', 'POST', data);
  const updateTransfer = (id: string | number, data: unknown) => useApiFetch(`warehouse/transfers/${id}`, 'PUT', data);
  const getLowStock = () => useApiFetch('warehouse/low-stock', 'GET');
  return {
    getWarehouses,
    getWarehouseById,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getZones,
    createZone,
    deleteZone,
    getStock,
    getTransfers,
    createTransfer,
    updateTransfer,
    getLowStock
  };
};
