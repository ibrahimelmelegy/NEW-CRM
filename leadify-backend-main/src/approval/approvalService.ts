import User from '../user/userModel';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import ApprovalWorkflow from './approvalWorkflowModel';
import ApprovalRequest from './approvalRequestModel';

class ApprovalService {
  // ---- Workflow CRUD ----

  async getWorkflows(): Promise<ApprovalWorkflow[]> {
    return ApprovalWorkflow.findAll({ order: [['createdAt', 'DESC']] });
  }

  async createWorkflow(data: {
    name: string;
    description?: string;
    entityType: string;
    steps: Array<{ order: number; approverUserId: number; approverName: string; required: boolean }>;
    isActive?: boolean;
  }): Promise<ApprovalWorkflow> {
    return ApprovalWorkflow.create(data);
  }

  async updateWorkflow(
    id: number,
    data: Partial<{
      name: string;
      description: string;
      entityType: string;
      steps: Array<{ order: number; approverUserId: number; approverName: string; required: boolean }>;
      isActive: boolean;
    }>
  ): Promise<ApprovalWorkflow> {
    const workflow = await ApprovalWorkflow.findByPk(id);
    if (!workflow) throw new BaseError(ERRORS.NOT_FOUND);
    await workflow.update(data);
    return workflow;
  }

  async deleteWorkflow(id: number): Promise<void> {
    const workflow = await ApprovalWorkflow.findByPk(id);
    if (!workflow) throw new BaseError(ERRORS.NOT_FOUND);
    await workflow.destroy();
  }

  // ---- Request CRUD ----

  async getRequests(filters: {
    status?: string;
    entityType?: string;
    requesterId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ docs: ApprovalRequest[]; pagination: any }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.requesterId) where.requesterId = filters.requesterId;

    const { rows, count } = await ApprovalRequest.findAndCountAll({
      where,
      include: [
        { model: ApprovalWorkflow, as: 'workflow' },
        { model: User, as: 'requester', attributes: ['id', 'name', 'email', 'profilePicture'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return {
      docs: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getMyPendingApprovals(userId: number): Promise<ApprovalRequest[]> {
    // Fetch all PENDING requests, then filter by current step's approver
    const pendingRequests = await ApprovalRequest.findAll({
      where: { status: 'PENDING' },
      include: [
        { model: ApprovalWorkflow, as: 'workflow' },
        { model: User, as: 'requester', attributes: ['id', 'name', 'email', 'profilePicture'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return pendingRequests.filter(request => {
      const workflow = request.workflow;
      if (!workflow || !workflow.steps) return false;
      const currentStepDef = workflow.steps.find((s: any) => s.order === request.currentStep);
      return currentStepDef && currentStepDef.approverUserId === userId;
    });
  }

  async createRequest(data: {
    workflowId: number;
    entityType: string;
    entityId: number;
    title: string;
    description?: string;
    requesterId: number;
  }): Promise<ApprovalRequest> {
    const workflow = await ApprovalWorkflow.findByPk(data.workflowId);
    if (!workflow) throw new BaseError(ERRORS.NOT_FOUND);

    return ApprovalRequest.create({
      ...data,
      status: 'PENDING',
      currentStep: 0,
      stepResults: []
    });
  }

  async approveStep(requestId: number, userId: number, comment: string): Promise<ApprovalRequest> {
    const request = await ApprovalRequest.findByPk(requestId, {
      include: [{ model: ApprovalWorkflow, as: 'workflow' }]
    });
    if (!request) throw new BaseError(ERRORS.NOT_FOUND);
    if (request.status !== 'PENDING') throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);

    const workflow = request.workflow;
    if (!workflow || !workflow.steps) throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);

    const currentStepDef = workflow.steps.find((s: any) => s.order === request.currentStep);
    if (!currentStepDef || currentStepDef.approverUserId !== userId) {
      throw new BaseError(ERRORS.ACCESS_DENIED);
    }

    const stepResults = [...(request.stepResults || [])];
    stepResults.push({
      step: request.currentStep,
      approverUserId: userId,
      status: 'APPROVED',
      comment: comment || '',
      date: new Date().toISOString()
    });

    const nextStep = request.currentStep + 1;
    const hasNextStep = workflow.steps.some((s: any) => s.order === nextStep);

    if (hasNextStep) {
      await request.update({ currentStep: nextStep, stepResults });
    } else {
      // Last step approved - mark the whole request as APPROVED
      await request.update({ currentStep: nextStep, stepResults, status: 'APPROVED' });
    }

    return request.reload({
      include: [
        { model: ApprovalWorkflow, as: 'workflow' },
        { model: User, as: 'requester', attributes: ['id', 'name', 'email', 'profilePicture'] }
      ]
    });
  }

  async rejectStep(requestId: number, userId: number, comment: string): Promise<ApprovalRequest> {
    const request = await ApprovalRequest.findByPk(requestId, {
      include: [{ model: ApprovalWorkflow, as: 'workflow' }]
    });
    if (!request) throw new BaseError(ERRORS.NOT_FOUND);
    if (request.status !== 'PENDING') throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);

    const workflow = request.workflow;
    if (!workflow || !workflow.steps) throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);

    const currentStepDef = workflow.steps.find((s: any) => s.order === request.currentStep);
    if (!currentStepDef || currentStepDef.approverUserId !== userId) {
      throw new BaseError(ERRORS.ACCESS_DENIED);
    }

    const stepResults = [...(request.stepResults || [])];
    stepResults.push({
      step: request.currentStep,
      approverUserId: userId,
      status: 'REJECTED',
      comment: comment || '',
      date: new Date().toISOString()
    });

    await request.update({ stepResults, status: 'REJECTED' });

    return request.reload({
      include: [
        { model: ApprovalWorkflow, as: 'workflow' },
        { model: User, as: 'requester', attributes: ['id', 'name', 'email', 'profilePicture'] }
      ]
    });
  }

  async cancelRequest(requestId: number, userId: number): Promise<ApprovalRequest> {
    const request = await ApprovalRequest.findByPk(requestId);
    if (!request) throw new BaseError(ERRORS.NOT_FOUND);
    if (request.requesterId !== userId) throw new BaseError(ERRORS.ACCESS_DENIED);
    if (request.status !== 'PENDING') throw new BaseError(ERRORS.SOMETHING_WENT_WRONG);

    await request.update({ status: 'CANCELLED' });
    return request;
  }
}

export default new ApprovalService();
