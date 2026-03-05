import WorkflowExecution, { ExecutionStatus } from '../workflowExecutionModel';
import WorkflowRule from '../workflowModel';
import { io } from '../../server';

export interface ApprovalConfig {
  approverUserId?: number;
  approverRole?: string;
  message: string;
  timeout?: number; // hours until auto-rejection
}

export interface ApprovalContext {
  executionId: number;
  workflowRuleId: number;
  entityType: string;
  entityId: string;
  nodeId: string;
  userId?: number;
}

export interface ApprovalRecord {
  id: string;
  executionId: number;
  workflowRuleId: number;
  nodeId: string;
  entityType: string;
  entityId: string;
  approverUserId?: number;
  approverRole?: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'TIMED_OUT';
  createdAt: string;
  timeoutAt?: string;
  resolvedAt?: string;
  resolvedBy?: number;
}

/**
 * Resolves the target approver user IDs from the config.
 * If approverUserId is provided, returns that directly.
 * If approverRole is specified, looks up users with that role.
 */
async function resolveApproverUserIds(config: ApprovalConfig): Promise<number[]> {
  if (config.approverUserId) {
    return [config.approverUserId];
  }

  if (config.approverRole) {
    try {
      const Role = require('../../role/roleModel').default;
      const User = require('../../user/userModel').default;

      const role = await Role.findOne({ where: { name: config.approverRole } });
      if (role) {
        const users = await User.findAll({
          where: { roleId: role.id, status: 'ACTIVE' },
          attributes: ['id']
        });
        return users.map((u) => u.id);
      }
    } catch (err: unknown) {
      console.error('Failed to resolve approver role:', err.message);
    }
  }

  return [];
}

/**
 * Executes an approval node within a workflow.
 *
 * This pauses the workflow by creating an approval record in the execution metadata.
 * The workflow remains in PARTIAL status until the approval is resolved via
 * the resolveApproval() function (called from the API when someone approves/rejects).
 *
 * Sends real-time notifications to the approver(s) via Socket.io.
 */
export async function executeApproval(nodeConfig: ApprovalConfig, context: ApprovalContext): Promise<ApprovalRecord> {
  const approverIds = await resolveApproverUserIds(nodeConfig);

  const timeoutAt = nodeConfig.timeout ? new Date(Date.now() + nodeConfig.timeout * 60 * 60 * 1000).toISOString() : undefined;

  const approvalId = `approval-${context.executionId}-${context.nodeId}-${Date.now()}`;

  const approvalRecord: ApprovalRecord = {
    id: approvalId,
    executionId: context.executionId,
    workflowRuleId: context.workflowRuleId,
    nodeId: context.nodeId,
    entityType: context.entityType,
    entityId: context.entityId,
    approverUserId: nodeConfig.approverUserId,
    approverRole: nodeConfig.approverRole,
    message: nodeConfig.message || 'Approval required',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    timeoutAt
  };

  // Store the approval in the execution record
  try {
    const execution = await WorkflowExecution.findByPk(context.executionId);
    if (execution) {
      const currentActions = execution.actionsExecuted || [];
      currentActions.push({
        actionType: 'APPROVAL',
        status: 'SUCCESS',
        result: approvalRecord
      });
      await execution.update({
        actionsExecuted: currentActions,
        status: ExecutionStatus.PARTIAL // Mark as partial until resolved
      });
    }
  } catch (err: unknown) {
    console.error('Failed to persist approval record:', err.message);
  }

  // Create notifications for approver(s)
  try {
    const Notification = require('../../notification/notificationModel').default;

    for (const userId of approverIds) {
      await Notification.create({
        body_en: `Workflow Approval Required: ${nodeConfig.message}`,
        body_ar: `${nodeConfig.message}`,
        userId,
        type: 'WORKFLOW',
        target: context.entityId
      });

      io.emit('notification:new', { userId });
      io.emit('workflow:approval_requested', {
        approvalId,
        userId,
        workflowRuleId: context.workflowRuleId,
        entityType: context.entityType,
        entityId: context.entityId,
        message: nodeConfig.message
      });
    }
  } catch (err: unknown) {
    console.error('Failed to create approval notifications:', err.message);
  }

  return approvalRecord;
}

/**
 * Resolves a pending approval by approving or rejecting it.
 * Called from the API when a user takes action on an approval.
 *
 * Returns the outcome path ('approved' or 'rejected') so the workflow
 * engine knows which branch to continue on.
 */
export async function resolveApproval(
  executionId: number,
  nodeId: string,
  decision: 'APPROVED' | 'REJECTED',
  resolvedBy: number
): Promise<{ path: 'approved' | 'rejected'; approvalRecord: ApprovalRecord | null }> {
  const execution = await WorkflowExecution.findByPk(executionId);
  if (!execution) {
    throw new Error(`Execution ${executionId} not found`);
  }

  const actions = execution.actionsExecuted || [];
  let targetApproval: ApprovalRecord | null = null;

  // Find and update the matching approval record
  for (const action of actions) {
    if (action.actionType === 'APPROVAL' && action.result?.nodeId === nodeId && action.result?.status === 'PENDING') {
      action.result.status = decision;
      action.result.resolvedAt = new Date().toISOString();
      action.result.resolvedBy = resolvedBy;
      targetApproval = action.result;
      break;
    }
  }

  if (!targetApproval) {
    throw new Error(`No pending approval found for node ${nodeId} in execution ${executionId}`);
  }

  // Update execution record
  await execution.update({ actionsExecuted: actions });

  const path: 'approved' | 'rejected' = decision === 'APPROVED' ? 'approved' : 'rejected';

  // Emit real-time update
  io.emit('workflow:approval_resolved', {
    executionId,
    nodeId,
    decision,
    resolvedBy,
    workflowRuleId: execution.workflowRuleId,
    entityType: execution.entityType,
    entityId: execution.entityId
  });

  return { path, approvalRecord: targetApproval };
}

/**
 * Checks for timed-out approvals and auto-rejects them.
 * Intended to be called by a cron job at regular intervals.
 */
export async function processTimedOutApprovals(): Promise<number> {
  const now = new Date();
  let timedOutCount = 0;

  const executions = await WorkflowExecution.findAll({
    where: { status: ExecutionStatus.PARTIAL },
    limit: 100,
    order: [['createdAt', 'ASC']]
  });

  for (const exec of executions) {
    const actions = exec.actionsExecuted || [];
    let modified = false;

    for (const action of actions) {
      if (action.actionType === 'APPROVAL' && action.result?.status === 'PENDING' && action.result?.timeoutAt) {
        if (new Date(action.result.timeoutAt) <= now) {
          action.result.status = 'TIMED_OUT';
          action.result.resolvedAt = now.toISOString();
          modified = true;
          timedOutCount++;

          io.emit('workflow:approval_timed_out', {
            executionId: exec.id,
            nodeId: action.result.nodeId,
            workflowRuleId: exec.workflowRuleId
          });
        }
      }
    }

    if (modified) {
      await exec.update({ actionsExecuted: actions });
    }
  }

  return timedOutCount;
}

export default {
  executeApproval,
  resolveApproval,
  processTimedOutApprovals
};
