import { useApiFetch } from '~/composables/useApiFetch';

export const useShipping = () => {
  const getShipments = (params?: any) => useApiFetch('shipping', 'GET', undefined, params);
  const getShipmentById = (id: string | number) => useApiFetch(`shipping/${id}`, 'GET');
  const createShipment = (data: any) => useApiFetch('shipping', 'POST', data);
  const updateShipment = (id: string | number, data: any) => useApiFetch(`shipping/${id}`, 'PUT', data);
  const deleteShipment = (id: string | number) => useApiFetch(`shipping/${id}`, 'DELETE');
  const getShippingRates = (params?: any) => useApiFetch('shipping/rates', 'GET', undefined, params);
  const createShippingRate = (data: any) => useApiFetch('shipping/rates', 'POST', data);
  const updateShippingRate = (id: string | number, data: any) => useApiFetch(`shipping/rates/${id}`, 'PUT', data);
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
