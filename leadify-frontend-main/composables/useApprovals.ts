import { useApiFetch } from './useApiFetch';

export function useApprovals() {
  const fetchWorkflows = () => useApiFetch('approvals/workflows');
  const createWorkflow = (data: Record<string, unknown>) => useApiFetch('approvals/workflows', 'POST', data);
  const updateWorkflow = (id: number, data: Record<string, unknown>) => useApiFetch(`approvals/workflows/${id}`, 'PUT', data);
  const deleteWorkflow = (id: number) => useApiFetch(`approvals/workflows/${id}`, 'DELETE');
  const fetchRequests = (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return useApiFetch(`approvals/requests${query}`);
  };
  const fetchPendingApprovals = () => useApiFetch('approvals/requests/pending');
  const createRequest = (data: Record<string, unknown>) => useApiFetch('approvals/requests', 'POST', data);
  const approveRequest = (id: number, comment: string) => useApiFetch(`approvals/requests/${id}/approve`, 'POST', { comment });
  const rejectRequest = (id: number, comment: string) => useApiFetch(`approvals/requests/${id}/reject`, 'POST', { comment });
  const cancelRequest = (id: number) => useApiFetch(`approvals/requests/${id}/cancel`, 'POST');

  return {
    fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    fetchRequests,
    fetchPendingApprovals,
    createRequest,
    approveRequest,
    rejectRequest,
    cancelRequest
  };
}
