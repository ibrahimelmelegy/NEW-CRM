export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  failureCount: number;
  lastTriggered?: string;
}

export const WEBHOOK_EVENTS = [
  'lead:created', 'lead:updated', 'lead:deleted',
  'deal:created', 'deal:updated', 'deal:stageChanged',
  'opportunity:created', 'opportunity:updated', 'opportunity:stageChanged',
  'client:created', 'client:updated'
];

export async function fetchWebhooks(): Promise<WebhookConfig[]> {
  const { body, success } = await useApiFetch('webhooks');
  if (success && Array.isArray(body)) return body;
  return [];
}

export async function createWebhook(data: Partial<WebhookConfig>) {
  return useApiFetch('webhooks', 'POST', data as any);
}

export async function updateWebhook(id: string, data: Partial<WebhookConfig>) {
  return useApiFetch(`webhooks/${id}`, 'PUT', data as any);
}

export async function deleteWebhook(id: string) {
  return useApiFetch(`webhooks/${id}`, 'DELETE');
}

export async function testWebhook(id: string) {
  return useApiFetch(`webhooks/${id}/test`, 'POST');
}
