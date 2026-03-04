/**
 * useCampaigns - Unit Tests
 * ===========================
 * Tests for composables/useCampaigns.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  fetchCampaigns,
  fetchCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  fetchCampaignAnalytics,
  addRecipients,
  fetchTemplates,
  createTemplate,
  deleteTemplate
} from '~/composables/useCampaigns';

const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

const mockNotification = vi.fn();
(globalThis as any).ElNotification = mockNotification;

vi.mock('element-plus', () => ({
  ElNotification: (...args: any[]) => mockNotification(...args)
}));

describe('useCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // fetchCampaigns
  // ============================================
  describe('fetchCampaigns', () => {
    it('should return campaigns on success', async () => {
      const campaigns = [{ id: '1', name: 'Campaign 1', status: 'DRAFT' }];
      mockApiFetch.mockResolvedValue({ body: campaigns, success: true });

      const result = await fetchCampaigns();

      expect(mockApiFetch).toHaveBeenCalledWith('campaigns');
      expect(result).toEqual(campaigns);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchCampaigns();

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // fetchCampaign
  // ============================================
  describe('fetchCampaign', () => {
    it('should return single campaign on success', async () => {
      const campaign = { id: '1', name: 'Campaign 1' };
      mockApiFetch.mockResolvedValue({ body: campaign, success: true });

      const result = await fetchCampaign('1');

      expect(mockApiFetch).toHaveBeenCalledWith('campaigns/1');
      expect(result).toEqual(campaign);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchCampaign('999');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // createCampaign
  // ============================================
  describe('createCampaign', () => {
    it('should create campaign and show success notification', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createCampaign({ name: 'New Campaign', subject: 'Hello' });

      expect(mockApiFetch).toHaveBeenCalledWith('campaigns', 'POST', expect.objectContaining({ name: 'New Campaign' }));
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Campaign created' }));
    });

    it('should show error notification on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Validation error' });

      await createCampaign({ name: '' });

      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Validation error' }));
    });
  });

  // ============================================
  // updateCampaign
  // ============================================
  describe('updateCampaign', () => {
    it('should update campaign via PUT', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateCampaign('1', { name: 'Updated' });

      expect(mockApiFetch).toHaveBeenCalledWith('campaigns/1', 'PUT', { name: 'Updated' });
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Campaign updated' }));
    });

    it('should show error on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Not found' });

      await updateCampaign('999', { name: 'X' });

      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });
  });

  // ============================================
  // deleteCampaign
  // ============================================
  describe('deleteCampaign', () => {
    it('should delete campaign and show success notification', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteCampaign('1');

      expect(mockApiFetch).toHaveBeenCalledWith('campaigns/1', 'DELETE');
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Campaign deleted' }));
    });
  });

  // ============================================
  // sendCampaign
  // ============================================
  describe('sendCampaign', () => {
    it('should send campaign and show success notification', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await sendCampaign('1');

      expect(mockApiFetch).toHaveBeenCalledWith('campaigns/1/send', 'POST', {});
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Campaign sent' }));
    });

    it('should show error on send failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'No recipients' });

      await sendCampaign('1');

      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'No recipients' }));
    });
  });

  // ============================================
  // fetchCampaignAnalytics
  // ============================================
  describe('fetchCampaignAnalytics', () => {
    it('should return analytics on success', async () => {
      const analytics = { opens: 100, clicks: 50 };
      mockApiFetch.mockResolvedValue({ body: analytics, success: true });

      const result = await fetchCampaignAnalytics('1');

      expect(mockApiFetch).toHaveBeenCalledWith('campaigns/1/analytics');
      expect(result).toEqual(analytics);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchCampaignAnalytics('1');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // addRecipients
  // ============================================
  describe('addRecipients', () => {
    it('should add recipients via POST', async () => {
      const recipients = [{ email: 'test@test.com', name: 'Test' }];
      mockApiFetch.mockResolvedValue({ success: true });

      await addRecipients('1', recipients);

      expect(mockApiFetch).toHaveBeenCalledWith('campaigns/1/recipients', 'POST', { recipients });
    });
  });

  // ============================================
  // Templates
  // ============================================
  describe('fetchTemplates', () => {
    it('should return templates on success', async () => {
      const templates = [{ id: '1', name: 'Welcome', subject: 'Hello' }];
      mockApiFetch.mockResolvedValue({ body: templates, success: true });

      const result = await fetchTemplates();

      expect(mockApiFetch).toHaveBeenCalledWith('campaigns/templates');
      expect(result).toEqual(templates);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchTemplates();

      expect(result).toEqual([]);
    });
  });

  describe('createTemplate', () => {
    it('should create template and show success notification', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createTemplate({ name: 'New Template', subject: 'Test' });

      expect(mockApiFetch).toHaveBeenCalledWith('campaigns/templates', 'POST', expect.objectContaining({ name: 'New Template' }));
      expect(mockNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success', message: 'Template saved' }));
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template by id', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteTemplate('1');

      expect(mockApiFetch).toHaveBeenCalledWith('campaigns/templates/1', 'DELETE');
    });
  });
});
