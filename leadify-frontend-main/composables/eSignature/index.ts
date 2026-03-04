import { useApiFetch } from '~/composables/useApiFetch';

export const useESignature = () => {
  const getSignatures = (params?: any) => useApiFetch('e-signatures', 'GET', undefined, params);
  const getSignatureById = (id: string | number) => useApiFetch(`e-signatures/${id}`, 'GET');
  const createSignature = (data: any) => useApiFetch('e-signatures', 'POST', data);
  const updateSignature = (id: string | number, data: any) => useApiFetch(`e-signatures/${id}`, 'PUT', data);
  const deleteSignature = (id: string | number) => useApiFetch(`e-signatures/${id}`, 'DELETE');
  const signDocument = (id: string | number, data: any) => useApiFetch(`e-signatures/${id}/sign`, 'POST', data);
  const declineDocument = (id: string | number, data: any) => useApiFetch(`e-signatures/${id}/decline`, 'POST', data);
  const resendDocument = (id: string | number) => useApiFetch(`e-signatures/${id}/resend`, 'POST');
  return { getSignatures, getSignatureById, createSignature, updateSignature, deleteSignature, signDocument, declineDocument, resendDocument };
};
