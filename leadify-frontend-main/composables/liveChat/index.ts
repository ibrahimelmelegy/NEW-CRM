import { useApiFetch } from '~/composables/useApiFetch';

export const useLiveChat = () => {
  const getConversations = (params?: any) => useApiFetch('live-chat/conversations', 'GET', undefined, params);
  const getConversation = (id: number) => useApiFetch(`live-chat/conversations/${id}`, 'GET');
  const getMessages = (conversationId: number, params?: any) => useApiFetch(`live-chat/conversations/${conversationId}/messages`, 'GET', undefined, params);
  const sendMessage = (data: any) => useApiFetch('live-chat/messages', 'POST', data);
  const markAsRead = (id: number) => useApiFetch(`live-chat/conversations/${id}/read`, 'PUT');
  const assignAgent = (id: number, agentId: string | number) => useApiFetch(`live-chat/conversations/${id}/assign`, 'PUT', { agentId });
  const transferConversation = (id: number, toAgentId: string | number, reason?: string) => useApiFetch(`live-chat/conversations/${id}/transfer`, 'PUT', { toAgentId, reason });
  const resolveConversation = (id: number, resolution?: string) => useApiFetch(`live-chat/conversations/${id}/resolve`, 'PUT', { resolution });
  const closeConversation = (id: number) => useApiFetch(`live-chat/conversations/${id}/close`, 'PUT');
  const getCannedResponses = () => useApiFetch('live-chat/canned-responses', 'GET');
  const getMetrics = () => useApiFetch('live-chat/metrics', 'GET');
  const getUnreadCount = () => useApiFetch('live-chat/unread-count', 'GET');

  return {
    getConversations,
    getConversation,
    getMessages,
    sendMessage,
    markAsRead,
    assignAgent,
    transferConversation,
    resolveConversation,
    closeConversation,
    getCannedResponses,
    getMetrics,
    getUnreadCount
  };
};
