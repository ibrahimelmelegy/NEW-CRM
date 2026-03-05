import { useApiFetch } from '~/composables/useApiFetch';

export const useShipping = () => {
  const getShipments = (params?: unknown) => useApiFetch('shipping', 'GET', undefined, params);
  const getShipmentById = (id: string | number) => useApiFetch(`shipping/${id}`, 'GET');
  const createShipment = (data: unknown) => useApiFetch('shipping', 'POST', data);
  const updateShipment = (id: string | number, data: unknown) => useApiFetch(`shipping/${id}`, 'PUT', data);
  const deleteShipment = (id: string | number) => useApiFetch(`shipping/${id}`, 'DELETE');
  const getShippingRates = (params?: unknown) => useApiFetch('shipping/rates', 'GET', undefined, params);
  const createShippingRate = (data: unknown) => useApiFetch('shipping/rates', 'POST', data);
  const updateShippingRate = (id: string | number, data: unknown) => useApiFetch(`shipping/rates/${id}`, 'PUT', data);
  const deleteShippingRate = (id: string | number) => useApiFetch(`shipping/rates/${id}`, 'DELETE');
  const trackShipment = (trackingNumber: string) => useApiFetch(`shipping/track/${trackingNumber}`, 'GET');
  return {
    getShipments,
    getShipmentById,
    createShipment,
    updateShipment,
    deleteShipment,
    getShippingRates,
    createShippingRate,
    updateShippingRate,
    deleteShippingRate,
    trackShipment
  };
};
