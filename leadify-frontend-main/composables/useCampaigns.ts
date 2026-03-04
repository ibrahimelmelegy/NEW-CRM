/* eslint-disable no-use-before-define */
/* eslint-disable require-await */
import { ElNotification } from 'element-plus';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  userId: number;
  recipients?: CampaignRecipient[];
  createdAt: string;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  contactEmail: string;
  contactName: string;
  status: string;
  openedAt: string | null;
  clickedAt: string | null;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  variables: string[];
  userId: number;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const { body, success } = await useApiFetch('campaigns');
  return success && body ? body : [];
}

export async function fetchCampaign(id: string): Promise<Campaign | null> {
  const { body, success } = await useApiFetch(`campaigns/${id}`);
  return success ? body : null;
}

export async function createCampaign(data: Partial<Campaign>) {
  const response = await useApiFetch('campaigns', 'POST', data as Record<string, unknown>);
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Campaign created' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
  }
  return response;
}

export async function updateCampaign(id: string, data: Partial<Campaign>) {
  const response = await useApiFetch(`campaigns/${id}`, 'PUT', data as Record<string, unknown>);
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Campaign updated' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
  }
  return response;
}

export async function deleteCampaign(id: string) {
  const response = await useApiFetch(`campaigns/${id}`, 'DELETE');
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Campaign deleted' });
  }
  return response;
}

export async function sendCampaign(id: string) {
  const response = await useApiFetch(`campaigns/${id}/send`, 'POST', {});
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Campaign sent' });
  } else {
    ElNotification({ type: 'error', title: 'Error', message: response.message });
  }
  return response;
}

export async function fetchCampaignAnalytics(id: string) {
  const { body, success } = await useApiFetch(`campaigns/${id}/analytics`);
  return success ? body : null;
}

export async function addRecipients(id: string, recipients: { email: string; name: string }[]) {
  return useApiFetch(`campaigns/${id}/recipients`, 'POST', { recipients } as Record<string, unknown>);
}

// Templates
export async function fetchTemplates(): Promise<EmailTemplate[]> {
  const { body, success } = await useApiFetch('campaigns/templates');
  return success && body ? body : [];
}

export async function createTemplate(data: Partial<EmailTemplate>) {
  const response = await useApiFetch('campaigns/templates', 'POST', data as Record<string, unknown>);
  if (response.success) {
    ElNotification({ type: 'success', title: 'Success', message: 'Template saved' });
  }
  return response;
}

export async function deleteTemplate(id: string) {
  return useApiFetch(`campaigns/templates/${id}`, 'DELETE');
}
