import { useApiFetch } from '~/composables/useApiFetch';

export const useWarehouse = () => {
  const getWarehouses = (params?: any) => useApiFetch('warehouse', 'GET', undefined, params);
  const getWarehouseById = (id: string | number) => useApiFetch(`warehouse/${id}`, 'GET');
  const createWarehouse = (data: any) => useApiFetch('warehouse', 'POST', data);
  const updateWarehouse = (id: string | number, data: any) => useApiFetch(`warehouse/${id}`, 'PUT', data);
  const deleteWarehouse = (id: string | number) => useApiFetch(`warehouse/${id}`, 'DELETE');
  const getZones = (params?: any) => useApiFetch('warehouse/zones', 'GET', undefined, params);
  const createZone = (data: any) => useApiFetch('warehouse/zones', 'POST', data);
  const deleteZone = (id: string | number) => useApiFetch(`warehouse/zones/${id}`, 'DELETE');
  const getStock = (params?: any) => useApiFetch('warehouse/stock', 'GET', undefined, params);
  const getTransfers = (params?: any) => useApiFetch('warehouse/transfers', 'GET', undefined, params);
  const createTransfer = (data: any) => useApiFetch('warehouse/transfers', 'POST', data);
  const updateTransfer = (id: string | number, data: any) => useApiFetch(`warehouse/transfers/${id}`, 'PUT', data);
  const getLowStock = () => useApiFetch('warehouse/low-stock', 'GET');
  return { getWarehouses, getWarehouseById, createWarehouse, updateWarehouse, deleteWarehouse, getZones, createZone, deleteZone, getStock, getTransfers, createTransfer, updateTransfer, getLowStock };
};
