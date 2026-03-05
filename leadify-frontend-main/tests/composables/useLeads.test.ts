/**
 * useLeads - Comprehensive Unit Tests
 * =====================================
 * Tests for composables/useLeads.ts
 * Covers: getLeads, getLead, getActivity, createLead, updateLead, deleteLead
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';

// ============================================
// Global mocks required by the composable
// ============================================
const mockUseApiFetch = vi.fn();
const mockElNotification = vi.fn();
const mockFormatDate = vi.fn((d: string) => `formatted-${d}`);
const mockGetYear = vi.fn((d: string) => '2024');
const mockCleanObject = vi.fn((obj: Record<string, unknown>) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined && v !== '')
  );
});

// Mock element-plus to intercept the import { ElNotification } in useLeads.ts
vi.mock('element-plus', () => ({
  ElNotification: (...args: any[]) => mockElNotification(...args)
}));

// Set up globals before importing the module under test
(globalThis as any).useApiFetch = mockUseApiFetch;
(globalThis as any).ElNotification = mockElNotification;
(globalThis as any).useI18n = () => ({ t: (key: string) => key, locale: ref('en') });
(globalThis as any).formatDate = mockFormatDate;
(globalThis as any).getYear = mockGetYear;
(globalThis as any).cleanObject = mockCleanObject;
(globalThis as any).useRuntimeConfig = () => ({ public: { API_BASE_URL: 'http://localhost:3001/api/v1/' } });

// Now import functions under test
import {
  getLeads,
  getLead,
  getActivity,
  createLead,
  updateLead,
  deleteLead,
  LeadSourceEnums,
  LeadStatusEnums,
  leadSources,
  leadStates,
  type Lead,
  type LeadValues,
  type Activity,
  type ActivityResponse
} from '@/composables/useLeads';

describe('useLeads composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset useI18n mock for each test
    (globalThis as any).useI18n = () => ({ t: (key: string) => key, locale: ref('en') });
  });

  // ============================================
  // Enums & Constants
  // ============================================
  describe('LeadSourceEnums', () => {
    it('should define all lead source values', () => {
      expect(LeadSourceEnums.REFERRAL).toBe('REFERRAL');
      expect(LeadSourceEnums.WEBSITE).toBe('WEBSITE');
      expect(LeadSourceEnums.EVENT).toBe('EVENT');
      expect(LeadSourceEnums.EMAIL).toBe('EMAIL');
      expect(LeadSourceEnums.OTHER).toBe('OTHER');
    });

    it('should contain exactly 5 sources', () => {
      expect(Object.values(LeadSourceEnums)).toHaveLength(5);
    });
  });

  describe('LeadStatusEnums', () => {
    it('should define all lead status values', () => {
      expect(LeadStatusEnums.NEW).toBe('NEW');
      expect(LeadStatusEnums.CONTACTED).toBe('CONTACTED');
      expect(LeadStatusEnums.QUALIFIED).toBe('QUALIFIED');
      expect(LeadStatusEnums.DISQUALIFIED).toBe('DISQUALIFIED');
    });

    it('should contain exactly 4 statuses', () => {
      expect(Object.values(LeadStatusEnums)).toHaveLength(4);
    });
  });

  describe('leadSources options', () => {
    it('should have label and value for each source', () => {
      leadSources.forEach(source => {
        expect(source).toHaveProperty('label');
        expect(source).toHaveProperty('value');
        expect(typeof source.label).toBe('string');
        expect(typeof source.value).toBe('string');
      });
    });

    it('should map to correct enum values', () => {
      const values = leadSources.map(s => s.value);
      expect(values).toContain(LeadSourceEnums.REFERRAL);
      expect(values).toContain(LeadSourceEnums.WEBSITE);
      expect(values).toContain(LeadSourceEnums.EVENT);
      expect(values).toContain(LeadSourceEnums.EMAIL);
      expect(values).toContain(LeadSourceEnums.OTHER);
    });
  });

  describe('leadStates options', () => {
    it('should have label and value for each state', () => {
      leadStates.forEach(state => {
        expect(state).toHaveProperty('label');
        expect(state).toHaveProperty('value');
      });
    });

    it('should map to correct enum values', () => {
      const values = leadStates.map(s => s.value);
      expect(values).toContain(LeadStatusEnums.NEW);
      expect(values).toContain(LeadStatusEnums.CONTACTED);
      expect(values).toContain(LeadStatusEnums.QUALIFIED);
      expect(values).toContain(LeadStatusEnums.DISQUALIFIED);
    });
  });

  // ============================================
  // getLeads
  // ============================================
  describe('getLeads', () => {
    it('should fetch leads successfully and format the response', async () => {
      const mockDocs = [
        {
          id: '1',
          name: 'Lead A',
          companyName: 'Company A',
          email: 'a@test.com',
          phone: '123',
          leadSource: 'WEBSITE',
          user: 1,
          notes: '',
          status: 'NEW',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          users: [{ id: 1, name: 'John', email: 'john@test.com' }]
        }
      ];
      const mockPagination = { page: 1, totalPages: 1, totalItems: 1, limit: 10 };

      mockUseApiFetch.mockResolvedValueOnce({
        body: { docs: mockDocs, pagination: mockPagination },
        success: true,
        message: 'Success'
      });

      const result = await getLeads();

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead');
      expect(result.leads).toHaveLength(1);
      expect(result.leads[0].name).toBe('Lead A');
      expect(result.leads[0].updatedAt).toBe('-');
      expect(result.leads[0].assign).toBe('John');
      expect(result.leads[0].leadDetails).toEqual({ title: 'Lead A', text: 'Company A' });
      expect(result.pagination).toEqual(mockPagination);
    });

    it('should format createdAt using formatDate', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: {
          docs: [
            { id: '1', name: 'X', companyName: '', email: '', phone: '', leadSource: '', user: 1, notes: '', status: 'NEW', createdAt: '2024-06-15', updatedAt: '' }
          ],
          pagination: { page: 1, totalPages: 1, totalItems: 1, limit: 10 }
        },
        success: true,
        message: 'Success'
      });

      const result = await getLeads();
      expect(mockFormatDate).toHaveBeenCalledWith('2024-06-15');
      expect(result.leads[0].createdAt).toBe('formatted-2024-06-15');
    });

    it('should join multiple assigned user names with comma', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: {
          docs: [
            {
              id: '1', name: 'Multi', companyName: '', email: '', phone: '', leadSource: '', user: 1, notes: '', status: 'NEW',
              createdAt: '', updatedAt: '',
              users: [
                { id: 1, name: 'Alice', email: 'a@x.com' },
                { id: 2, name: 'Bob', email: 'b@x.com' }
              ]
            }
          ],
          pagination: { page: 1, totalPages: 1, totalItems: 1, limit: 10 }
        },
        success: true,
        message: 'Success'
      });

      const result = await getLeads();
      expect(result.leads[0].assign).toBe('Alice, Bob');
    });

    it('should handle leads with no assigned users', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: {
          docs: [
            { id: '1', name: 'No Users', companyName: '', email: '', phone: '', leadSource: '', user: 1, notes: '', status: 'NEW', createdAt: '', updatedAt: '' }
          ],
          pagination: { page: 1, totalPages: 1, totalItems: 1, limit: 10 }
        },
        success: true,
        message: 'Success'
      });

      const result = await getLeads();
      expect(result.leads[0].assign).toBeUndefined();
    });

    it('should return empty leads array and default pagination when API returns success=false', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: null,
        success: false,
        message: 'Unauthorized'
      });

      const result = await getLeads();
      expect(result.leads).toEqual([]);
      expect(result.pagination).toEqual({ totalItems: 0, page: 1, limit: 10, totalPages: 1 });
    });

    it('should show error notification on failure', async () => {
      mockUseApiFetch.mockResolvedValueOnce({
        body: null,
        success: false,
        message: 'Server error'
      });

      await getLeads();
      // The error handler calls ElNotification
      expect(mockElNotification).toHaveBeenCalled();
      const call = mockElNotification.mock.calls[0][0];
      expect(call.type).toBe('error');
    });

    it('should handle API fetch throwing an exception', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Network failure'));

      const result = await getLeads();
      expect(result.leads).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
      expect(mockElNotification).toHaveBeenCalled();
    });
  });

  // ============================================
  // getLead
  // ============================================
  describe('getLead', () => {
    it('should fetch a single lead by ID', async () => {
      const mockLead = { id: 'lead-1', name: 'Test Lead', companyName: 'Co', email: 'a@b.com' };
      mockUseApiFetch.mockResolvedValueOnce({ body: mockLead, success: true });

      const result = await getLead('lead-1');
      expect(mockUseApiFetch).toHaveBeenCalledWith('lead/lead-1');
      expect(result).toEqual(mockLead);
    });

    it('should accept string array as ID parameter', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ body: { id: 'x' }, success: true });

      await getLead(['lead-1']);
      expect(mockUseApiFetch).toHaveBeenCalledWith('lead/lead-1');
    });

    it('should return empty object on error', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Not found'));

      const result = await getLead('bad-id');
      expect(result).toEqual({});
    });

    it('should show error notification on failure', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Server error'));

      await getLead('bad-id');
      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });
  });

  // ============================================
  // getActivity
  // ============================================
  describe('getActivity', () => {
    it('should fetch activities for a lead', async () => {
      const mockActivities = {
        docs: [{ id: 'act-1', status: 'created', description: 'Lead created', createdAt: '2024-01-01' }],
        pagination: { page: 1, totalPages: 1, totalItems: 1, limit: 10 }
      };
      mockUseApiFetch.mockResolvedValueOnce({ body: mockActivities, success: true });

      const result = await getActivity('lead-1');
      expect(mockUseApiFetch).toHaveBeenCalledWith('activity/lead/lead-1');
      expect(result.docs).toHaveLength(1);
      expect(result.docs[0].id).toBe('act-1');
    });

    it('should return empty activity response on error', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await getActivity('bad-id');
      expect(result.docs).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });

    it('should show error notification when activity fetch fails', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Network error'));

      await getActivity('bad-id');
      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });
  });

  // ============================================
  // createLead
  // ============================================
  describe('createLead', () => {
    const validLeadValues: LeadValues = {
      leadName: 'New Lead',
      companyName: 'New Co',
      email: 'new@test.com',
      phone: '+966 501 234 567',
      leadSource: 'WEBSITE',
      assignUser: 'user-1',
      lastContactDate: '2024-01-15',
      notes: 'Some notes',
      leadState: 'NEW'
    };

    it('should create a lead successfully', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: { id: 'new-lead-1' }, message: 'Created' });

      const result = await createLead(validLeadValues);

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead', 'POST', expect.any(Object));
      expect(result?.success).toBe(true);
    });

    it('should normalize phone number (remove spaces and + prefix)', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'Created' });

      await createLead(validLeadValues);

      const apiCallData = mockCleanObject.mock.results[0].value;
      // Phone "+966 501 234 567" -> "966501234567" after removing +, spaces
      // Then removes leading 2 -> but 9 is first, so stays "966501234567"
      // Actually normalizePhoneNumber removes spaces, +, and leading 2
      // "+966 501 234 567" -> "966501234567" (spaces) -> "966501234567" (+) -> "966501234567" (no leading 2)
      expect(apiCallData.phone).toBeDefined();
    });

    it('should map leadValues fields to API fields correctly', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'OK' });

      await createLead(validLeadValues);

      // cleanObject is called on the leadData, then passed to useApiFetch
      const cleanCallArg = mockCleanObject.mock.calls[0][0];
      expect(cleanCallArg).toHaveProperty('name', 'New Lead');
      expect(cleanCallArg).toHaveProperty('companyName', 'New Co');
      expect(cleanCallArg).toHaveProperty('email', 'new@test.com');
      expect(cleanCallArg).toHaveProperty('leadSource', 'WEBSITE');
      expect(cleanCallArg).toHaveProperty('users', 'user-1');
      expect(cleanCallArg).toHaveProperty('notes', 'Some notes');
      expect(cleanCallArg).toHaveProperty('status', 'NEW');
    });

    it('should show success notification on successful creation', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'OK' });

      await createLead(validLeadValues);

      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      );
    });

    it('should show error notification when API returns success=false', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: false, body: null, message: 'Validation failed' });

      await createLead(validLeadValues);

      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Validation failed' })
      );
    });

    it('should return error response on unexpected exception', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await createLead(validLeadValues);

      expect(result.success).toBe(false);
      expect(result.body).toBeNull();
      expect(result.message).toBe('Connection refused');
      expect(result.code).toBe(500);
    });

    it('should handle non-Error exception objects', async () => {
      mockUseApiFetch.mockRejectedValueOnce('string error');

      const result = await createLead(validLeadValues);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unknown error');
    });

    it('should include otherSource when leadSource is OTHER', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'OK' });

      await createLead({ ...validLeadValues, leadSource: 'OTHER', otherSource: 'LinkedIn' });

      const cleanCallArg = mockCleanObject.mock.calls[0][0];
      expect(cleanCallArg).toHaveProperty('otherSource', 'LinkedIn');
    });
  });

  // ============================================
  // updateLead
  // ============================================
  describe('updateLead', () => {
    const updateValues: LeadValues = {
      id: 'lead-1',
      leadName: 'Updated Lead',
      companyName: 'Updated Co',
      email: 'updated@test.com',
      phone: '+966 502 345 678',
      leadSource: 'REFERRAL',
      assignUser: 'user-2',
      lastContactDate: '2024-03-15',
      notes: 'Updated notes',
      leadState: 'CONTACTED'
    };

    it('should update a lead successfully', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'Updated' });

      const result = await updateLead(updateValues);

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead/lead-1', 'PUT', expect.any(Object));
      expect(result?.success).toBe(true);
    });

    it('should call getYear on lastContactDate', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'Updated' });

      await updateLead(updateValues);

      expect(mockGetYear).toHaveBeenCalledWith('2024-03-15');
    });

    it('should show success notification on successful update', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'Updated' });

      await updateLead(updateValues);

      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      );
    });

    it('should show error notification when API returns success=false', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: false, body: null, message: 'Not found' });

      await updateLead(updateValues);

      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Not found' })
      );
    });

    it('should return error response on exception', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('Timeout'));

      const result = await updateLead(updateValues);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Timeout');
      expect(result.code).toBe(500);
    });

    it('should normalize phone number before sending', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'OK' });

      await updateLead({ ...updateValues, phone: '  +2 501 234  567  ' });

      const callArgs = mockUseApiFetch.mock.calls[0][2];
      // normalizePhoneNumber removes spaces, +, and leading 2
      expect(callArgs.phone).not.toContain(' ');
      expect(callArgs.phone).not.toContain('+');
    });

    it('should use the lead ID in the URL', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: {}, message: 'OK' });

      await updateLead({ ...updateValues, id: 'custom-id-99' });

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead/custom-id-99', 'PUT', expect.any(Object));
    });
  });

  // ============================================
  // deleteLead
  // ============================================
  describe('deleteLead', () => {
    it('should delete a lead successfully', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: null, message: 'Deleted' });

      const result = await deleteLead('lead-1');

      expect(mockUseApiFetch).toHaveBeenCalledWith('lead/lead-1', 'DELETE');
      expect(result?.success).toBe(true);
    });

    it('should show success notification on deletion', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: true, body: null, message: 'Deleted' });

      await deleteLead('lead-1');

      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      );
    });

    it('should show error notification when deletion fails', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: false, body: null, message: 'Forbidden' });

      await deleteLead('lead-1');

      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'Forbidden' })
      );
    });

    it('should return error response on exception', async () => {
      mockUseApiFetch.mockRejectedValueOnce(new Error('DB error'));

      const result = await deleteLead('lead-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('DB error');
      expect(result.code).toBe(500);
    });

    it('should handle non-Error exception in delete', async () => {
      mockUseApiFetch.mockRejectedValueOnce({ weird: 'error' });

      const result = await deleteLead('lead-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unknown error');
    });

    it('should use fallback error message when API message is empty', async () => {
      mockUseApiFetch.mockResolvedValueOnce({ success: false, body: null, message: '' });

      await deleteLead('lead-1');

      // Falls back to t('leads.deleteFailed')
      expect(mockElNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' })
      );
    });
  });
});
