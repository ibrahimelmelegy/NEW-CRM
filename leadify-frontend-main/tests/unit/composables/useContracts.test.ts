/**
 * useContracts - Unit Tests
 * ==========================
 * Tests for composables/useContracts.ts
 *
 * The module exports:
 * - Contract interface
 * - CONTRACT_STATUSES array
 * - getContractStatusType(status: string): string
 * - fetchContracts(): Promise<Contract[]>
 * - fetchContract(id: string): Promise<Contract | null>
 * - createContract(data: Partial<Contract>): Promise<response>
 * - updateContract(id: string, data: Partial<Contract>): Promise<response>
 * - deleteContract(id: string): Promise<response>
 * - sendForSignature(id: string): Promise<response>
 * - fetchContractByToken(token: string): Promise<Contract | null>
 * - signContract(token: string, signatureData: string, signerName: string): Promise<response>
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// Mock useApiFetch globally
// ============================================
const mockApiFetch = vi.fn();
(globalThis as any).useApiFetch = mockApiFetch;

// ============================================
// Mock ElNotification
// ============================================
const mockNotification = vi.fn();
(globalThis as any).ElNotification = mockNotification;

// Must mock element-plus before importing
vi.mock('element-plus', () => ({
  ElNotification: (...args: any[]) => mockNotification(...args)
}));

import {
  type Contract,
  CONTRACT_STATUSES,
  getContractStatusType,
  fetchContracts,
  fetchContract,
  createContract,
  updateContract,
  deleteContract,
  sendForSignature,
  fetchContractByToken,
  signContract
} from '~/composables/useContracts';

// ============================================
// Test Data Factories
// ============================================
function createMockContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'contract-1',
    title: 'Test Contract',
    content: '<p>Contract content</p>',
    status: 'DRAFT',
    signerName: 'John Doe',
    signerEmail: 'john@example.com',
    signatureData: '',
    signatureHash: '',
    signedAt: null,
    expiresAt: null,
    dealId: 'deal-1',
    userId: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('useContracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // CONTRACT_STATUSES
  // ============================================
  describe('CONTRACT_STATUSES', () => {
    it('should have 6 status options', () => {
      expect(CONTRACT_STATUSES).toHaveLength(6);
    });

    it('should contain all expected statuses', () => {
      const values = CONTRACT_STATUSES.map(s => s.value);
      expect(values).toContain('DRAFT');
      expect(values).toContain('SENT');
      expect(values).toContain('VIEWED');
      expect(values).toContain('SIGNED');
      expect(values).toContain('EXPIRED');
      expect(values).toContain('CANCELLED');
    });

    it('should have correct structure for each status', () => {
      CONTRACT_STATUSES.forEach(status => {
        expect(status).toHaveProperty('value');
        expect(status).toHaveProperty('label');
        expect(status).toHaveProperty('type');
        expect(typeof status.value).toBe('string');
        expect(typeof status.label).toBe('string');
      });
    });

    it('should have SIGNED with success type', () => {
      const signed = CONTRACT_STATUSES.find(s => s.value === 'SIGNED');
      expect(signed?.type).toBe('success');
    });

    it('should have EXPIRED with danger type', () => {
      const expired = CONTRACT_STATUSES.find(s => s.value === 'EXPIRED');
      expect(expired?.type).toBe('danger');
    });

    it('should have DRAFT with info type', () => {
      const draft = CONTRACT_STATUSES.find(s => s.value === 'DRAFT');
      expect(draft?.type).toBe('info');
    });

    it('should have SENT with warning type', () => {
      const sent = CONTRACT_STATUSES.find(s => s.value === 'SENT');
      expect(sent?.type).toBe('warning');
    });
  });

  // ============================================
  // getContractStatusType
  // ============================================
  describe('getContractStatusType', () => {
    it('should return "info" for DRAFT status', () => {
      expect(getContractStatusType('DRAFT')).toBe('info');
    });

    it('should return "warning" for SENT status', () => {
      expect(getContractStatusType('SENT')).toBe('warning');
    });

    it('should return "" for VIEWED status', () => {
      expect(getContractStatusType('VIEWED')).toBe('');
    });

    it('should return "success" for SIGNED status', () => {
      expect(getContractStatusType('SIGNED')).toBe('success');
    });

    it('should return "danger" for EXPIRED status', () => {
      expect(getContractStatusType('EXPIRED')).toBe('danger');
    });

    it('should return "danger" for CANCELLED status', () => {
      expect(getContractStatusType('CANCELLED')).toBe('danger');
    });

    it('should return "info" for unknown status', () => {
      expect(getContractStatusType('UNKNOWN')).toBe('info');
    });

    it('should return "info" for empty string', () => {
      expect(getContractStatusType('')).toBe('info');
    });
  });

  // ============================================
  // Contract Interface
  // ============================================
  describe('Contract interface', () => {
    it('should create a valid Contract object', () => {
      const contract = createMockContract();
      expect(contract.id).toBe('contract-1');
      expect(contract.title).toBe('Test Contract');
      expect(contract.status).toBe('DRAFT');
      expect(contract.signerName).toBe('John Doe');
    });

    it('should allow null values for optional date fields', () => {
      const contract = createMockContract({
        signedAt: null,
        expiresAt: null,
        dealId: null
      });
      expect(contract.signedAt).toBeNull();
      expect(contract.expiresAt).toBeNull();
      expect(contract.dealId).toBeNull();
    });

    it('should allow deal association', () => {
      const contract = createMockContract({
        deal: { id: 'deal-1', name: 'Big Deal' }
      });
      expect(contract.deal?.id).toBe('deal-1');
      expect(contract.deal?.name).toBe('Big Deal');
    });
  });

  // ============================================
  // fetchContracts
  // ============================================
  describe('fetchContracts', () => {
    it('should call useApiFetch with contracts endpoint', async () => {
      mockApiFetch.mockResolvedValue({ body: [], success: true });

      await fetchContracts();

      expect(mockApiFetch).toHaveBeenCalledWith('contracts');
    });

    it('should return contracts array on success', async () => {
      const mockContracts = [createMockContract(), createMockContract({ id: 'contract-2' })];
      mockApiFetch.mockResolvedValue({ body: mockContracts, success: true });

      const result = await fetchContracts();

      expect(result).toEqual(mockContracts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchContracts();

      expect(result).toEqual([]);
    });

    it('should return empty array when body is null', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: true });

      const result = await fetchContracts();

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // fetchContract
  // ============================================
  describe('fetchContract', () => {
    it('should call useApiFetch with correct endpoint', async () => {
      mockApiFetch.mockResolvedValue({ body: createMockContract(), success: true });

      await fetchContract('contract-1');

      expect(mockApiFetch).toHaveBeenCalledWith('contracts/contract-1');
    });

    it('should return contract on success', async () => {
      const mockContract = createMockContract();
      mockApiFetch.mockResolvedValue({ body: mockContract, success: true });

      const result = await fetchContract('contract-1');

      expect(result).toEqual(mockContract);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchContract('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // createContract
  // ============================================
  describe('createContract', () => {
    it('should call useApiFetch with POST method', async () => {
      mockApiFetch.mockResolvedValue({ success: true });
      const data = { title: 'New Contract', content: 'Content' };

      await createContract(data);

      expect(mockApiFetch).toHaveBeenCalledWith('contracts', 'POST', data);
    });

    it('should show success notification on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await createContract({ title: 'New Contract' });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Success',
          message: 'Contract created'
        })
      );
    });

    it('should show error notification on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Validation error' });

      await createContract({ title: '' });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Error',
          message: 'Validation error'
        })
      );
    });

    it('should return the API response', async () => {
      const mockResponse = { success: true, body: createMockContract() };
      mockApiFetch.mockResolvedValue(mockResponse);

      const result = await createContract({ title: 'New Contract' });

      expect(result).toEqual(mockResponse);
    });
  });

  // ============================================
  // updateContract
  // ============================================
  describe('updateContract', () => {
    it('should call useApiFetch with PUT method and correct endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateContract('contract-1', { title: 'Updated Title' });

      expect(mockApiFetch).toHaveBeenCalledWith('contracts/contract-1', 'PUT', { title: 'Updated Title' });
    });

    it('should show success notification on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await updateContract('contract-1', { title: 'Updated' });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: 'Contract updated'
        })
      );
    });

    it('should show error notification on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Not found' });

      await updateContract('nonexistent', { title: 'Updated' });

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Not found'
        })
      );
    });

    it('should return the API response', async () => {
      const mockResponse = { success: true, body: createMockContract({ title: 'Updated' }) };
      mockApiFetch.mockResolvedValue(mockResponse);

      const result = await updateContract('contract-1', { title: 'Updated' });

      expect(result).toEqual(mockResponse);
    });
  });

  // ============================================
  // deleteContract
  // ============================================
  describe('deleteContract', () => {
    it('should call useApiFetch with DELETE method', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteContract('contract-1');

      expect(mockApiFetch).toHaveBeenCalledWith('contracts/contract-1', 'DELETE');
    });

    it('should show success notification on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await deleteContract('contract-1');

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: 'Contract deleted'
        })
      );
    });

    it('should not show notification on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false });

      await deleteContract('contract-1');

      expect(mockNotification).not.toHaveBeenCalled();
    });

    it('should return the API response', async () => {
      const mockResponse = { success: true };
      mockApiFetch.mockResolvedValue(mockResponse);

      const result = await deleteContract('contract-1');

      expect(result).toEqual(mockResponse);
    });
  });

  // ============================================
  // sendForSignature
  // ============================================
  describe('sendForSignature', () => {
    it('should call useApiFetch with POST to send endpoint', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await sendForSignature('contract-1');

      expect(mockApiFetch).toHaveBeenCalledWith('contracts/contract-1/send', 'POST', {});
    });

    it('should show success notification on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await sendForSignature('contract-1');

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: 'Contract sent for signature'
        })
      );
    });

    it('should show error notification on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Email sending failed' });

      await sendForSignature('contract-1');

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Email sending failed'
        })
      );
    });
  });

  // ============================================
  // fetchContractByToken
  // ============================================
  describe('fetchContractByToken', () => {
    it('should call useApiFetch with sign token endpoint', async () => {
      mockApiFetch.mockResolvedValue({ body: createMockContract(), success: true });

      await fetchContractByToken('abc123');

      expect(mockApiFetch).toHaveBeenCalledWith('contracts/sign/abc123');
    });

    it('should return contract on success', async () => {
      const mockContract = createMockContract({ status: 'SENT' });
      mockApiFetch.mockResolvedValue({ body: mockContract, success: true });

      const result = await fetchContractByToken('abc123');

      expect(result).toEqual(mockContract);
    });

    it('should return null on failure', async () => {
      mockApiFetch.mockResolvedValue({ body: null, success: false });

      const result = await fetchContractByToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // signContract
  // ============================================
  describe('signContract', () => {
    it('should call useApiFetch with POST and signature data', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await signContract('token-123', 'data:image/png;base64,...', 'John Doe');

      expect(mockApiFetch).toHaveBeenCalledWith(
        'contracts/sign/token-123',
        'POST',
        {
          signatureData: 'data:image/png;base64,...',
          signerName: 'John Doe'
        }
      );
    });

    it('should show success notification on success', async () => {
      mockApiFetch.mockResolvedValue({ success: true });

      await signContract('token-123', 'sig-data', 'Jane Doe');

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: 'Contract signed successfully'
        })
      );
    });

    it('should show error notification on failure', async () => {
      mockApiFetch.mockResolvedValue({ success: false, message: 'Token expired' });

      await signContract('expired-token', 'sig-data', 'Jane Doe');

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Token expired'
        })
      );
    });

    it('should return the API response', async () => {
      const mockResponse = { success: true, body: createMockContract({ status: 'SIGNED' }) };
      mockApiFetch.mockResolvedValue(mockResponse);

      const result = await signContract('token-123', 'sig-data', 'John Doe');

      expect(result).toEqual(mockResponse);
    });
  });
});
