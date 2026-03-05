import { useApiFetch } from '~/composables/useApiFetch';

export const useBooking = () => {
  const getBookings = (params?: unknown) => useApiFetch('bookings', 'GET', undefined, params);
  const getBookingById = (id: string | number) => useApiFetch(`bookings/${id}`, 'GET');
  const createBooking = (data: unknown) => useApiFetch('bookings', 'POST', data);
  const updateBooking = (id: string | number, data: unknown) => useApiFetch(`bookings/${id}`, 'PUT', data);
  const deleteBooking = (id: string | number) => useApiFetch(`bookings/${id}`, 'DELETE');
  const cancelBooking = (id: string | number) => useApiFetch(`bookings/${id}/cancel`, 'POST');
  const getSlots = (params?: unknown) => useApiFetch('bookings/slots', 'GET', undefined, params);
  const getPages = (params?: unknown) => useApiFetch('bookings/pages', 'GET', undefined, params);
  const createPage = (data: unknown) => useApiFetch('bookings/pages', 'POST', data);
  const updatePage = (id: string | number, data: unknown) => useApiFetch(`bookings/pages/${id}`, 'PUT', data);
  const deletePage = (id: string | number) => useApiFetch(`bookings/pages/${id}`, 'DELETE');
  const getAnalytics = () => useApiFetch('bookings/analytics', 'GET');
  return {
    getBookings,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking,
    cancelBooking,
    getSlots,
    getPages,
    createPage,
    updatePage,
    deletePage,
    getAnalytics
  };
};
