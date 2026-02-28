
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import approvalService from '../../src/approval/approvalService';
import ApprovalWorkflow from '../../src/approval/approvalWorkflowModel';
import ApprovalRequest from '../../src/approval/approvalRequestModel';
import User from '../../src/user/userModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock('../../src/approval/approvalWorkflowModel');
jest.mock('../../src/approval/approvalRequestModel');
jest.mock('../../src/user/userModel');

describe('ApprovalService', () => {
  const mockWorkflow: any = {
    id: 1,
    name: 'Purchase Approval',
    entityType: 'PURCHASE_ORDER',
    steps: [
      { order: 0, approverUserId: 10, approverName: 'Manager', required: true },
      { order: 1, approverUserId: 20, approverName: 'Director', required: true }
    ],
    isActive: true,
    update: jest.fn(),
    destroy: jest.fn()
  };

  const mockRequest: any = {
    id: 1,
    workflowId: 1,
    entityType: 'PURCHASE_ORDER',
    entityId: 100,
    title: 'PO Approval',
    status: 'PENDING',
    currentStep: 0,
    stepResults: [],
    requesterId: 5,
    workflow: mockWorkflow,
    update: jest.fn(),
    reload: (jest.fn() as jest.Mock<any>).mockResolvedValue(undefined)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset reload mock
    mockRequest.reload = (jest.fn() as jest.Mock<any>).mockResolvedValue(mockRequest);
  });

  // --------------------------------------------------------------------------
  // Workflow CRUD
  // --------------------------------------------------------------------------
  describe('getWorkflows', () => {
    it('should return all workflows ordered by createdAt DESC', async () => {
      (ApprovalWorkflow.findAll as jest.Mock<any>).mockResolvedValue([mockWorkflow]);

      const result = await approvalService.getWorkflows();

      expect(ApprovalWorkflow.findAll).toHaveBeenCalledWith({ order: [['createdAt', 'DESC']] });
      expect(result).toHaveLength(1);
    });
  });

  describe('createWorkflow', () => {
    it('should create a new approval workflow', async () => {
      const data = { name: 'New Workflow', entityType: 'INVOICE', steps: [] };
      (ApprovalWorkflow.create as jest.Mock<any>).mockResolvedValue({ id: 2, ...data });

      const result = await approvalService.createWorkflow(data as any);

      expect(ApprovalWorkflow.create).toHaveBeenCalledWith(data);
      expect(result).toHaveProperty('id', 2);
    });
  });

  describe('updateWorkflow', () => {
    it('should update an existing workflow', async () => {
      (ApprovalWorkflow.findByPk as jest.Mock<any>).mockResolvedValue(mockWorkflow);

      await approvalService.updateWorkflow(1, { name: 'Updated' });

      expect(mockWorkflow.update).toHaveBeenCalledWith({ name: 'Updated' });
    });

    it('should throw NOT_FOUND when workflow does not exist', async () => {
      (ApprovalWorkflow.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(approvalService.updateWorkflow(999, { name: 'X' }))
        .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete an existing workflow', async () => {
      (ApprovalWorkflow.findByPk as jest.Mock<any>).mockResolvedValue(mockWorkflow);

      await approvalService.deleteWorkflow(1);

      expect(mockWorkflow.destroy).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND when workflow does not exist', async () => {
      (ApprovalWorkflow.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(approvalService.deleteWorkflow(999))
        .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
    });
  });

  // --------------------------------------------------------------------------
  // Request CRUD
  // --------------------------------------------------------------------------
  describe('createRequest', () => {
    it('should create a request with PENDING status and step 0', async () => {
      (ApprovalWorkflow.findByPk as jest.Mock<any>).mockResolvedValue(mockWorkflow);
      (ApprovalRequest.create as jest.Mock<any>).mockResolvedValue(mockRequest);

      const data = { workflowId: 1, entityType: 'PURCHASE_ORDER', entityId: 100, title: 'PO Approval', requesterId: 5 };
      const result = await approvalService.createRequest(data);

      expect(ApprovalRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING', currentStep: 0, stepResults: [] })
      );
      expect(result).toHaveProperty('id');
    });

    it('should throw NOT_FOUND when workflow does not exist', async () => {
      (ApprovalWorkflow.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(approvalService.createRequest({ workflowId: 999, entityType: 'X', entityId: 1, title: 'T', requesterId: 1 }))
        .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
    });
  });

  // --------------------------------------------------------------------------
  // Approve / Reject
  // --------------------------------------------------------------------------
  describe('approveStep', () => {
    it('should approve the current step and advance to the next step', async () => {
      (ApprovalRequest.findByPk as jest.Mock<any>).mockResolvedValue(mockRequest);

      await approvalService.approveStep(1, 10, 'Looks good');

      expect(mockRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ currentStep: 1 })
      );
      expect(mockRequest.reload).toHaveBeenCalled();
    });

    it('should throw ACCESS_DENIED when user is not the current step approver', async () => {
      (ApprovalRequest.findByPk as jest.Mock<any>).mockResolvedValue(mockRequest);

      await expect(approvalService.approveStep(1, 999, 'Not my turn'))
        .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
    });

    it('should throw NOT_FOUND when request does not exist', async () => {
      (ApprovalRequest.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(approvalService.approveStep(999, 10, 'comment'))
        .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
    });
  });

  describe('rejectStep', () => {
    it('should reject the request and set status to REJECTED', async () => {
      (ApprovalRequest.findByPk as jest.Mock<any>).mockResolvedValue(mockRequest);

      await approvalService.rejectStep(1, 10, 'Not acceptable');

      expect(mockRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'REJECTED' })
      );
    });

    it('should throw ACCESS_DENIED when user is not the current step approver', async () => {
      (ApprovalRequest.findByPk as jest.Mock<any>).mockResolvedValue(mockRequest);

      await expect(approvalService.rejectStep(1, 999, 'Rejected'))
        .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
    });
  });

  // --------------------------------------------------------------------------
  // Cancel
  // --------------------------------------------------------------------------
  describe('cancelRequest', () => {
    it('should cancel a PENDING request by the requester', async () => {
      (ApprovalRequest.findByPk as jest.Mock<any>).mockResolvedValue(mockRequest);

      const result = await approvalService.cancelRequest(1, 5);

      expect(mockRequest.update).toHaveBeenCalledWith({ status: 'CANCELLED' });
      expect(result).toBe(mockRequest);
    });

    it('should throw ACCESS_DENIED when non-requester tries to cancel', async () => {
      (ApprovalRequest.findByPk as jest.Mock<any>).mockResolvedValue(mockRequest);

      await expect(approvalService.cancelRequest(1, 999))
        .rejects.toThrow(new BaseError(ERRORS.ACCESS_DENIED));
    });

    it('should throw SOMETHING_WENT_WRONG when request is not PENDING', async () => {
      const nonPending = { ...mockRequest, status: 'APPROVED', requesterId: 5 };
      (ApprovalRequest.findByPk as jest.Mock<any>).mockResolvedValue(nonPending);

      await expect(approvalService.cancelRequest(1, 5))
        .rejects.toThrow(new BaseError(ERRORS.SOMETHING_WENT_WRONG));
    });
  });
});
