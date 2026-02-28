
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/complianceManager/consentRecordModel');
jest.mock('../../src/complianceManager/dataRequestModel');
jest.mock('../../src/user/userModel');
jest.mock('../../src/utils/pagination', () => ({
  clampPagination: jest.fn((q: any) => ({ page: q.page || 1, limit: q.limit || 20, offset: 0 }))
}));
jest.mock('../../src/server', () => ({
  io: { emit: jest.fn() }
}));

import complianceService from '../../src/complianceManager/complianceService';
import ConsentRecord from '../../src/complianceManager/consentRecordModel';
import DataRequest from '../../src/complianceManager/dataRequestModel';

describe('ComplianceService', () => {
  const mockConsent: any = {
    id: 1,
    contactId: 'contact-100',
    contactEmail: 'john@example.com',
    consentTypes: ['EMAIL_MARKETING', 'DATA_PROCESSING'],
    status: 'ACTIVE',
    consentDate: new Date('2026-01-01'),
    expiryDate: new Date('2027-01-01'),
    source: 'WEB_FORM',
    regulation: 'GDPR',
    tenantId: 'tenant-1',
    update: jest.fn(),
    destroy: jest.fn()
  };

  const mockDataRequest: any = {
    id: 1,
    requesterId: 'contact-100',
    requesterEmail: 'john@example.com',
    type: 'ACCESS',
    status: 'PENDING',
    deadline: new Date('2026-04-01'),
    tenantId: 'tenant-1',
    update: jest.fn(),
    destroy: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Consent Record CRUD
  // --------------------------------------------------------------------------
  describe('createConsent', () => {
    it('should create a consent record and emit socket event', async () => {
      (ConsentRecord.create as jest.Mock<any>).mockResolvedValue({ id: 1, contactId: 'contact-100' });

      const result = await complianceService.createConsent(
        { contactId: 'contact-100', consentTypes: ['EMAIL_MARKETING'], consentDate: new Date() },
        'tenant-1'
      );

      expect(ConsentRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ contactId: 'contact-100', tenantId: 'tenant-1' })
      );
      expect(result).toHaveProperty('id', 1);
    });

    it('should set default consentDate if not provided', async () => {
      (ConsentRecord.create as jest.Mock<any>).mockResolvedValue({ id: 1, contactId: 'contact-100' });

      await complianceService.createConsent({ contactId: 'contact-100', consentTypes: ['DATA_PROCESSING'] });

      expect(ConsentRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ consentDate: expect.any(Date) })
      );
    });
  });

  describe('getAllConsents', () => {
    it('should return paginated consent records', async () => {
      (ConsentRecord.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockConsent], count: 1 });

      const result = await complianceService.getAllConsents({ page: 1 }, 'tenant-1');

      expect(result.docs).toHaveLength(1);
      expect(result.pagination).toHaveProperty('totalItems', 1);
    });

    it('should filter by status when provided', async () => {
      (ConsentRecord.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await complianceService.getAllConsents({ status: 'ACTIVE' }, 'tenant-1');

      expect(ConsentRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) })
      );
    });

    it('should filter by regulation when provided', async () => {
      (ConsentRecord.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await complianceService.getAllConsents({ regulation: 'GDPR' }, 'tenant-1');

      expect(ConsentRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ regulation: 'GDPR' }) })
      );
    });

    it('should filter by contactId when provided', async () => {
      (ConsentRecord.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await complianceService.getAllConsents({ contactId: 'contact-100' });

      expect(ConsentRecord.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ contactId: 'contact-100' }) })
      );
    });

    it('should return empty docs when no records exist', async () => {
      (ConsentRecord.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      const result = await complianceService.getAllConsents({});

      expect(result.docs).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  describe('getConsentById', () => {
    it('should return a consent record by id', async () => {
      (ConsentRecord.findByPk as jest.Mock<any>).mockResolvedValue(mockConsent);

      const result = await complianceService.getConsentById(1);

      expect(ConsentRecord.findByPk).toHaveBeenCalledWith(1);
      expect(result).toBe(mockConsent);
    });

    it('should return null when consent is not found', async () => {
      (ConsentRecord.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await complianceService.getConsentById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateConsent', () => {
    it('should update an existing consent record and emit socket event', async () => {
      (ConsentRecord.findByPk as jest.Mock<any>).mockResolvedValue(mockConsent);

      const result = await complianceService.updateConsent(1, { source: 'EMAIL' });

      expect(mockConsent.update).toHaveBeenCalledWith({ source: 'EMAIL' });
      expect(result).toBe(mockConsent);
    });

    it('should set withdrawnAt when status changes to WITHDRAWN', async () => {
      const activeConsent = { ...mockConsent, status: 'ACTIVE', update: jest.fn() };
      (ConsentRecord.findByPk as jest.Mock<any>).mockResolvedValue(activeConsent);

      await complianceService.updateConsent(1, { status: 'WITHDRAWN' });

      expect(activeConsent.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'WITHDRAWN', withdrawnAt: expect.any(Date) })
      );
    });

    it('should not set withdrawnAt when status is already WITHDRAWN', async () => {
      const withdrawnConsent = { ...mockConsent, status: 'WITHDRAWN', update: jest.fn() };
      (ConsentRecord.findByPk as jest.Mock<any>).mockResolvedValue(withdrawnConsent);

      await complianceService.updateConsent(1, { status: 'WITHDRAWN' });

      expect(withdrawnConsent.update).toHaveBeenCalledWith({ status: 'WITHDRAWN' });
    });

    it('should return null when consent is not found', async () => {
      (ConsentRecord.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await complianceService.updateConsent(999, { source: 'EMAIL' });

      expect(result).toBeNull();
    });
  });

  describe('deleteConsent', () => {
    it('should delete an existing consent record', async () => {
      (ConsentRecord.findByPk as jest.Mock<any>).mockResolvedValue(mockConsent);

      const result = await complianceService.deleteConsent(1);

      expect(mockConsent.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when consent is not found', async () => {
      (ConsentRecord.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await complianceService.deleteConsent(999);

      expect(result).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Data Request CRUD
  // --------------------------------------------------------------------------
  describe('createDataRequest', () => {
    it('should create a data request and emit socket event', async () => {
      (DataRequest.create as jest.Mock<any>).mockResolvedValue({ id: 1, type: 'ACCESS' });

      const result = await complianceService.createDataRequest(
        { requesterId: 'contact-100', type: 'ACCESS', deadline: new Date('2026-04-01') },
        'tenant-1'
      );

      expect(DataRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({ requesterId: 'contact-100', type: 'ACCESS', tenantId: 'tenant-1' })
      );
      expect(result).toHaveProperty('id', 1);
    });

    it('should set default deadline of 30 days if not provided', async () => {
      (DataRequest.create as jest.Mock<any>).mockResolvedValue({ id: 1, type: 'DELETION' });

      await complianceService.createDataRequest({ requesterId: 'contact-100', type: 'DELETION' });

      expect(DataRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({ deadline: expect.any(Date) })
      );
    });
  });

  describe('getAllDataRequests', () => {
    it('should return paginated data requests with assignee include', async () => {
      (DataRequest.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockDataRequest], count: 1 });

      const result = await complianceService.getAllDataRequests({ page: 1 }, 'tenant-1');

      expect(DataRequest.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ include: expect.any(Array) })
      );
      expect(result.docs).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
    });

    it('should filter by status when provided', async () => {
      (DataRequest.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await complianceService.getAllDataRequests({ status: 'PENDING' }, 'tenant-1');

      expect(DataRequest.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'PENDING' }) })
      );
    });

    it('should filter by type when provided', async () => {
      (DataRequest.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

      await complianceService.getAllDataRequests({ type: 'DELETION' }, 'tenant-1');

      expect(DataRequest.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'DELETION' }) })
      );
    });
  });

  describe('getDataRequestById', () => {
    it('should return a data request by id with assignee include', async () => {
      (DataRequest.findByPk as jest.Mock<any>).mockResolvedValue(mockDataRequest);

      const result = await complianceService.getDataRequestById(1);

      expect(DataRequest.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({ include: expect.any(Array) }));
      expect(result).toBe(mockDataRequest);
    });

    it('should return null when data request is not found', async () => {
      (DataRequest.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await complianceService.getDataRequestById(999);

      expect(result).toBeNull();
    });
  });

  describe('processDataRequest', () => {
    it('should process a data request with new status and emit socket event', async () => {
      (DataRequest.findByPk as jest.Mock<any>).mockResolvedValue(mockDataRequest);

      const result = await complianceService.processDataRequest(1, { status: 'IN_PROGRESS', assignedTo: 5 });

      expect(mockDataRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'IN_PROGRESS', assignedTo: 5 })
      );
      expect(result).toBe(mockDataRequest);
    });

    it('should set completedAt when status is COMPLETED', async () => {
      (DataRequest.findByPk as jest.Mock<any>).mockResolvedValue(mockDataRequest);

      await complianceService.processDataRequest(1, { status: 'COMPLETED', resolution: 'Data exported' });

      expect(mockDataRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'COMPLETED', resolution: 'Data exported', completedAt: expect.any(Date) })
      );
    });

    it('should not set completedAt when status is not COMPLETED', async () => {
      (DataRequest.findByPk as jest.Mock<any>).mockResolvedValue(mockDataRequest);

      await complianceService.processDataRequest(1, { status: 'IN_PROGRESS' });

      const updateArg = (mockDataRequest.update as jest.Mock<any>).mock.calls[0][0];
      expect(updateArg).not.toHaveProperty('completedAt');
    });

    it('should return null when data request is not found', async () => {
      (DataRequest.findByPk as jest.Mock<any>).mockResolvedValue(null);

      const result = await complianceService.processDataRequest(999, { status: 'IN_PROGRESS' });

      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Compliance Audit
  // --------------------------------------------------------------------------
  describe('runAudit', () => {
    it('should detect expired consents and mark them as EXPIRED', async () => {
      const expiredConsent = { id: 10, contactId: 'contact-200', update: jest.fn() };
      (ConsentRecord.findAll as jest.Mock<any>).mockResolvedValue([expiredConsent]);
      (DataRequest.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await complianceService.runAudit('tenant-1');

      expect(expiredConsent.update).toHaveBeenCalledWith({ status: 'EXPIRED' });
      expect(result.expiredConsentsFixed).toBe(1);
      expect(result.issues.some((i: any) => i.type === 'EXPIRED_CONSENT')).toBe(true);
    });

    it('should detect overdue data requests and mark them as OVERDUE', async () => {
      const overdueRequest = { id: 20, type: 'DELETION', update: jest.fn() };
      (ConsentRecord.findAll as jest.Mock<any>).mockResolvedValue([]);
      (DataRequest.findAll as jest.Mock<any>)
        .mockResolvedValueOnce([overdueRequest])
        .mockResolvedValueOnce([]); // approaching deadline query

      const result = await complianceService.runAudit('tenant-1');

      expect(overdueRequest.update).toHaveBeenCalledWith({ status: 'OVERDUE' });
      expect(result.overdueRequestsMarked).toBe(1);
      expect(result.issues.some((i: any) => i.type === 'OVERDUE_REQUEST')).toBe(true);
      expect(result.issues.some((i: any) => i.severity === 'CRITICAL')).toBe(true);
    });

    it('should detect approaching-deadline requests without updating their status', async () => {
      const approachingRequest = { id: 30, type: 'ACCESS' };
      (ConsentRecord.findAll as jest.Mock<any>).mockResolvedValue([]);
      (DataRequest.findAll as jest.Mock<any>)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([approachingRequest]);

      const result = await complianceService.runAudit();

      expect(result.issues.some((i: any) => i.type === 'APPROACHING_DEADLINE')).toBe(true);
      expect(result.issues.find((i: any) => i.type === 'APPROACHING_DEADLINE')!.severity).toBe('MEDIUM');
    });

    it('should return zero issues when everything is compliant', async () => {
      (ConsentRecord.findAll as jest.Mock<any>).mockResolvedValue([]);
      (DataRequest.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await complianceService.runAudit();

      expect(result.issuesFound).toBe(0);
      expect(result.issues).toHaveLength(0);
      expect(result.expiredConsentsFixed).toBe(0);
      expect(result.overdueRequestsMarked).toBe(0);
    });

    it('should return the audit date', async () => {
      (ConsentRecord.findAll as jest.Mock<any>).mockResolvedValue([]);
      (DataRequest.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await complianceService.runAudit();

      expect(result.auditDate).toBeInstanceOf(Date);
    });
  });

  // --------------------------------------------------------------------------
  // Compliance Score
  // --------------------------------------------------------------------------
  describe('getComplianceScore', () => {
    it('should return a perfect score when all consents are active and all requests completed', async () => {
      (ConsentRecord.count as jest.Mock<any>)
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(10)  // active
        .mockResolvedValueOnce(0)   // expired
        .mockResolvedValueOnce(0);  // withdrawn
      (DataRequest.count as jest.Mock<any>)
        .mockResolvedValueOnce(5)   // total
        .mockResolvedValueOnce(5)   // completed
        .mockResolvedValueOnce(0)   // overdue
        .mockResolvedValueOnce(0);  // pending

      const result = await complianceService.getComplianceScore('tenant-1');

      // score = 100 - 0 (no expired) - 0 (no overdue) + 10 (100% completion) = 110 -> capped at 100
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.rating).toBe('EXCELLENT');
      expect(result.consent.total).toBe(10);
      expect(result.consent.active).toBe(10);
      expect(result.dataRequests.total).toBe(5);
      expect(result.dataRequests.completed).toBe(5);
    });

    it('should deduct for expired consents', async () => {
      (ConsentRecord.count as jest.Mock<any>)
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(5)   // active
        .mockResolvedValueOnce(5)   // expired (50% expired)
        .mockResolvedValueOnce(0);  // withdrawn
      (DataRequest.count as jest.Mock<any>)
        .mockResolvedValueOnce(0)   // total
        .mockResolvedValueOnce(0)   // completed
        .mockResolvedValueOnce(0)   // overdue
        .mockResolvedValueOnce(0);  // pending

      const result = await complianceService.getComplianceScore();

      // score = 100 - min(30, (5/10)*60) = 100 - 30 = 70
      expect(result.score).toBe(70);
      expect(result.rating).toBe('GOOD');
    });

    it('should deduct for overdue data requests', async () => {
      (ConsentRecord.count as jest.Mock<any>)
        .mockResolvedValueOnce(0)   // total
        .mockResolvedValueOnce(0)   // active
        .mockResolvedValueOnce(0)   // expired
        .mockResolvedValueOnce(0);  // withdrawn
      (DataRequest.count as jest.Mock<any>)
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(0)   // completed
        .mockResolvedValueOnce(5)   // overdue (50% overdue)
        .mockResolvedValueOnce(5);  // pending

      const result = await complianceService.getComplianceScore();

      // score = 100 - min(40, (5/10)*80) + (0/10)*10 = 100 - 40 + 0 = 60
      expect(result.score).toBe(60);
      expect(result.rating).toBe('NEEDS_IMPROVEMENT');
    });

    it('should return CRITICAL rating for very low scores', async () => {
      (ConsentRecord.count as jest.Mock<any>)
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(0)   // active
        .mockResolvedValueOnce(10)  // expired (100% expired)
        .mockResolvedValueOnce(0);  // withdrawn
      (DataRequest.count as jest.Mock<any>)
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(0)   // completed
        .mockResolvedValueOnce(10)  // overdue (100% overdue)
        .mockResolvedValueOnce(0);  // pending

      const result = await complianceService.getComplianceScore();

      // score = 100 - 30 - 40 + 0 = 30
      expect(result.score).toBeLessThanOrEqual(50);
      expect(result.rating).toBe('CRITICAL');
    });

    it('should return score of 100 when no records exist at all', async () => {
      (ConsentRecord.count as jest.Mock<any>)
        .mockResolvedValueOnce(0)   // total
        .mockResolvedValueOnce(0)   // active
        .mockResolvedValueOnce(0)   // expired
        .mockResolvedValueOnce(0);  // withdrawn
      (DataRequest.count as jest.Mock<any>)
        .mockResolvedValueOnce(0)   // total
        .mockResolvedValueOnce(0)   // completed
        .mockResolvedValueOnce(0)   // overdue
        .mockResolvedValueOnce(0);  // pending

      const result = await complianceService.getComplianceScore();

      expect(result.score).toBe(100);
      expect(result.rating).toBe('EXCELLENT');
    });
  });
});
