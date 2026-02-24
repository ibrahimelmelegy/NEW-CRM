export interface Conversation {
  contactPhone: string;
  contactName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  contactPhone: string;
  contactName?: string;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  status: string;
  provider: string;
  createdAt: string;
  user?: { id: number; name: string; profilePicture?: string };
}

export interface MessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const { body, success } = await useApiFetch('messaging/conversations');
  if (success && Array.isArray(body)) return body;
  return [];
}

export async function fetchMessages(contactPhone: string, page: number = 1): Promise<MessagesResponse> {
  const { body, success } = await useApiFetch(`messaging/messages/${encodeURIComponent(contactPhone)}?page=${page}`);
  if (success && body) return body as MessagesResponse;
  return { messages: [], total: 0, page: 1, limit: 50 };
}

export async function sendMessage(contactPhone: string, content: string, contactName?: string, provider: string = 'WHATSAPP') {
  const { body, success, message } = await useApiFetch('messaging/send', 'POST', {
    contactPhone,
    contactName,
    content,
    provider
  });
  return { body, success, message };
}

export async function markConversationRead(contactPhone: string) {
  await useApiFetch(`messaging/read/${encodeURIComponent(contactPhone)}`, 'PUT');
}
