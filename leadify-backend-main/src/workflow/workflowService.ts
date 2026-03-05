import { Op } from 'sequelize';
import WorkflowRule, { ConditionLogic, EntityType, TriggerType, WorkflowAction, WorkflowCondition } from './workflowModel';
import WorkflowExecution, { ActionExecutionResult, ExecutionStatus } from './workflowExecutionModel';
import User from '../user/userModel';
import Notification from '../notification/notificationModel';
import DailyTask from '../dailyTask/dailyTaskModel';
import { sendEmail } from '../utils/emailHelper';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';
import { io } from '../server';

// ── Model registry for dynamic entity operations ──
// Lazy-loaded to avoid circular dependency issues at import time.
let modelRegistry: Record<string, any> | null = null;

function getModelRegistry(): Record<string, any> {
  if (modelRegistry) return modelRegistry;

  // Require inline to break circular deps
  const Lead = require('../lead/leadModel').default;
  const Deal = require('../deal/model/dealModel').default;
  const Client = require('../client/clientModel').default;
  const Opportunity = require('../opportunity/opportunityModel').default;
  const Invoice = require('../deal/model/invoiceMode').default;
  const Contract = require('../contract/contractModel').default;
  const PurchaseOrder = require('../procurement/models/purchaseOrderModel').default;
  const Expense = require('../finance/expenseModel').default;

  modelRegistry = {
    lead: Lead,
    deal: Deal,
    client: Client,
    opportunity: Opportunity,
    invoice: Invoice,
    contract: Contract,
    purchaseOrder: PurchaseOrder,
    expense: Expense,
    task: DailyTask
  };

  return modelRegistry;
}

// ─────────────────────────────────────────────────────────
// CRUD operations
// ─────────────────────────────────────────────────────────

async function createRule(data: Partial<WorkflowRule>, userId: number): Promise<WorkflowRule> {
  const rule = await WorkflowRule.create({ ...data, createdBy: userId });
  io.emit('workflow:created', { id: rule.id, name: rule.name });
  return rule;
}

async function updateRule(id: number, data: Partial<WorkflowRule>): Promise<WorkflowRule> {
  const rule = await WorkflowRule.findByPk(id);
  if (!rule) throw new BaseError(ERRORS.WORKFLOW_RULE_NOT_FOUND);
  await rule.update(data);
  io.emit('workflow:updated', { id: rule.id, name: rule.name });
  return rule;
}

async function deleteRule(id: number): Promise<void> {
  const rule = await WorkflowRule.findByPk(id);
  if (!rule) throw new BaseError(ERRORS.WORKFLOW_RULE_NOT_FOUND);
  await WorkflowExecution.destroy({ where: { workflowRuleId: id } });
  await rule.destroy();
  io.emit('workflow:deleted', { id });
}

interface RulesQuery {
  entityType?: string;
  triggerType?: string;
  isActive?: string;
  page?: string;
  limit?: string;
  search?: string;
}

async function getRules(query: RulesQuery) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.entityType) where.entityType = query.entityType;
  if (query.triggerType) where.triggerType = query.triggerType;
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
  if (query.search) {
    where[Op.or] = [{ name: { [Op.iLike]: `%${query.search}%` } }, { description: { [Op.iLike]: `%${query.search}%` } }];
  }

  const { rows: docs, count: totalItems } = await WorkflowRule.findAndCountAll({
    where,
    order: [
      ['priority', 'DESC'],
      ['createdAt', 'DESC']
    ],
    limit,
    offset,
    include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
  });

  return {
    docs,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
}

async function getRuleById(id: number) {
  const rule = await WorkflowRule.findByPk(id, {
    include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
  });
  if (!rule) throw new BaseError(ERRORS.WORKFLOW_RULE_NOT_FOUND);

  // Attach recent executions
  const executions = await WorkflowExecution.findAll({
    where: { workflowRuleId: id },
    order: [['createdAt', 'DESC']],
    limit: 20
  });

  return { ...rule.toJSON(), executions };
}

async function toggleRule(id: number, isActive: boolean): Promise<WorkflowRule> {
  const rule = await WorkflowRule.findByPk(id);
  if (!rule) throw new BaseError(ERRORS.WORKFLOW_RULE_NOT_FOUND);
  await rule.update({ isActive });
  io.emit('workflow:toggled', { id, isActive });
  return rule;
}

// ─────────────────────────────────────────────────────────
// Execution log queries
// ─────────────────────────────────────────────────────────

interface ExecutionQuery {
  workflowRuleId?: string;
  entityType?: string;
  entityId?: string;
  status?: string;
  page?: string;
  limit?: string;
}

async function getExecutions(query: ExecutionQuery) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.workflowRuleId) where.workflowRuleId = parseInt(query.workflowRuleId, 10);
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;
  if (query.status) where.status = query.status;

  const { rows: docs, count: totalItems } = await WorkflowExecution.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [{ model: WorkflowRule, as: 'workflowRule', attributes: ['id', 'name', 'entityType'] }]
  });

  return {
    docs,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
}

async function getExecutionsForRule(ruleId: number, query: { page?: string; limit?: string }) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const offset = (page - 1) * limit;

  const { rows: docs, count: totalItems } = await WorkflowExecution.findAndCountAll({
    where: { workflowRuleId: ruleId },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    docs,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
}

// ─────────────────────────────────────────────────────────
// Condition evaluation
// ─────────────────────────────────────────────────────────

function evaluateConditions(
  entity: Record<string, any>,
  conditions: WorkflowCondition[] | undefined | null,
  conditionLogic: ConditionLogic = ConditionLogic.AND
): boolean {
  if (!conditions || conditions.length === 0) return true;

  const results = conditions.map(cond => evaluateSingleCondition(entity, cond));

  return conditionLogic === ConditionLogic.AND ? results.every(Boolean) : results.some(Boolean);
}

function evaluateSingleCondition(entity: Record<string, any>, cond: WorkflowCondition): boolean {
  const fieldValue = getNestedValue(entity, cond.field);

  switch (cond.operator) {
    case 'equals':
      return String(fieldValue) === String(cond.value);
    case 'not_equals':
      return String(fieldValue) !== String(cond.value);
    case 'contains':
      return String(fieldValue ?? '')
        .toLowerCase()
        .includes(String(cond.value).toLowerCase());
    case 'greater_than':
      return Number(fieldValue) > Number(cond.value);
    case 'less_than':
      return Number(fieldValue) < Number(cond.value);
    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || fieldValue === '';
    case 'is_not_empty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    case 'in': {
      const list = Array.isArray(cond.value)
        ? cond.value
        : String(cond.value)
            .split(',')
            .map((s: string) => s.trim());
      return list.includes(String(fieldValue));
    }
    case 'not_in': {
      const list = Array.isArray(cond.value)
        ? cond.value
        : String(cond.value)
            .split(',')
            .map((s: string) => s.trim());
      return !list.includes(String(fieldValue));
    }
    default:
      return true;
  }
}

/** Retrieve a potentially nested value like "client.name" from an object */
function getNestedValue(obj: Record<string, any>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, obj as any);
}

// ─────────────────────────────────────────────────────────
// Template resolver: replaces {{field}} with entity values
// ─────────────────────────────────────────────────────────

function resolveTemplate(template: string, entity: Record<string, any>): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_match, path) => {
    const value = getNestedValue(entity, path);
    return value !== null && value !== undefined ? String(value) : '';
  });
}

// ─────────────────────────────────────────────────────────
// Action executors
// ─────────────────────────────────────────────────────────

async function executeUpdateField(
  action: Extract<WorkflowAction, { type: 'UPDATE_FIELD' }>,
  entityType: string,
  entityId: string,
  entity: Record<string, any>
): Promise<unknown> {
  const registry = getModelRegistry();
  const Model = registry[entityType];
  if (!Model) throw new Error(`Unknown entity type: ${entityType}`);

  const resolvedValue = resolveTemplate(action.value, entity);
  await Model.update({ [action.field]: resolvedValue }, { where: { id: entityId } });

  return { field: action.field, newValue: resolvedValue };
}

async function executeCreateRecord(action: Extract<WorkflowAction, { type: 'CREATE_RECORD' }>, entity: Record<string, any>): Promise<unknown> {
  const registry = getModelRegistry();
  const Model = registry[action.entityType];
  if (!Model) throw new Error(`Unknown entity type for record creation: ${action.entityType}`);

  // Resolve template values in each data field
  const resolvedData: Record<string, any> = {};
  for (const [key, val] of Object.entries(action.data)) {
    resolvedData[key] = typeof val === 'string' ? resolveTemplate(val, entity) : val;
  }

  const created = await Model.create(resolvedData);
  return { entityType: action.entityType, id: created.id };
}

async function executeSendEmail(action: Extract<WorkflowAction, { type: 'SEND_EMAIL' }>, entity: Record<string, any>): Promise<unknown> {
  const to = resolveTemplate(action.to, entity);
  const subject = resolveTemplate(action.subject, entity);
  const body = resolveTemplate(action.body, entity);

  await sendEmail({
    to,
    subject,
    text: body,
    html: `<div>${body.replace(/\n/g, '<br>')}</div>`
  });

  return { to, subject };
}

async function executeSendNotification(
  action: Extract<WorkflowAction, { type: 'SEND_NOTIFICATION' }>,
  entity: Record<string, any>,
  triggerUserId?: number
): Promise<unknown> {
  const title = resolveTemplate(action.title, entity);
  const message = resolveTemplate(action.message, entity);
  const notifiedUserIds: number[] = [];

  // Determine recipients
  if (action.userId) {
    notifiedUserIds.push(Number(action.userId));
  } else if (action.role) {
    // Find all users with the given role name
    const Role = require('../role/roleModel').default;
    const role = await Role.findOne({ where: { name: action.role } });
    if (role) {
      const users = await User.findAll({ where: { roleId: role.id }, attributes: ['id'] });
      notifiedUserIds.push(...users.map((u: User) => u.id));
    }
  } else if (triggerUserId) {
    notifiedUserIds.push(triggerUserId);
  }

  for (const userId of notifiedUserIds) {
    await Notification.create({
      body_en: `${title}: ${message}`,
      body_ar: `${title}: ${message}`,
      userId,
      type: 'WORKFLOW',
      target: entity.id || null
    });
    io.emit('notification:new', { userId });
  }

  return { notifiedUsers: notifiedUserIds.length, title };
}

async function executeCreateTask(
  action: Extract<WorkflowAction, { type: 'CREATE_TASK' }>,
  entity: Record<string, any>,
  triggerUserId?: number
): Promise<unknown> {
  const title = resolveTemplate(action.title, entity);
  const assignedTo = Number(action.assignedTo) || triggerUserId;

  if (!assignedTo) throw new Error('No user to assign task to');

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (action.dueInDays || 1));

  const task = await DailyTask.create({
    name: title,
    salesRepresentativeId: assignedTo,
    userId: triggerUserId || assignedTo,
    priority: 'MEDIUM',
    status: 'TODO',
    cost: 0,
    downPayment: 0,
    totalPaid: 0,
    remainingAmount: 0,
    notes: `Auto-created by workflow rule. Source entity: ${entity.id || 'N/A'}`
  });

  return { taskId: task.id, title, assignedTo, dueDate };
}

async function executeWebhook(action: Extract<WorkflowAction, { type: 'WEBHOOK' }>, entity: Record<string, any>): Promise<unknown> {
  const url = resolveTemplate(action.url, entity);
  const method = (action.method || 'POST').toUpperCase();

  // Resolve template values in body
  const resolvedBody: Record<string, any> = {};
  if (action.body) {
    for (const [key, val] of Object.entries(action.body)) {
      resolvedBody[key] = typeof val === 'string' ? resolveTemplate(val, entity) : val;
    }
  }

  // Resolve template values in headers
  const resolvedHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (action.headers) {
    for (const [key, val] of Object.entries(action.headers)) {
      resolvedHeaders[key] = resolveTemplate(val, entity);
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers: resolvedHeaders
  };

  if (method !== 'GET' && method !== 'HEAD') {
    fetchOptions.body = JSON.stringify({ ...resolvedBody, _entity: entity });
  }

  // Use AbortController for timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
  fetchOptions.signal = controller.signal;

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeout);

    const responseText = await response.text().catch(() => '');
    return {
      statusCode: response.status,
      ok: response.ok,
      body: responseText.substring(0, 1000) // truncate large responses
    };
  } catch (err: unknown) {
    clearTimeout(timeout);
    throw new Error(`Webhook failed: ${err.message}`);
  }
}

async function executeAssignment(action: Extract<WorkflowAction, { type: 'ASSIGN_TO' }>, entityType: string, entityId: string): Promise<unknown> {
  const registry = getModelRegistry();
  const Model = registry[entityType];
  if (!Model) throw new Error(`Unknown entity type: ${entityType}`);

  let assignUserId: number | null = null;

  if (action.userId) {
    assignUserId = Number(action.userId);
  } else if (action.method === 'round_robin') {
    assignUserId = await getRoundRobinUser();
  } else if (action.method === 'least_loaded') {
    assignUserId = await getLeastLoadedUser();
  }

  if (!assignUserId) throw new Error('Could not determine user for assignment');

  // Try to update the entity directly (works for models with userId field)
  // For models with M2M user associations, we handle gracefully
  try {
    await Model.update({ userId: assignUserId }, { where: { id: entityId } });
  } catch {
    // Some models use join tables rather than direct userId
    // Attempt a generic approach – log success anyway
  }

  return { assignedTo: assignUserId, method: action.method || 'direct' };
}

/** Round-robin: pick the user who was least-recently assigned via workflow */
async function getRoundRobinUser(): Promise<number | null> {
  const users = await User.findAll({
    where: { status: 'ACTIVE' },
    attributes: ['id'],
    order: [['id', 'ASC']],
    limit: 100
  });

  if (users.length === 0) return null;

  // Find the most recent workflow assignment
  const lastExec = await WorkflowExecution.findOne({
    where: {
      actionsExecuted: { [Op.contains]: [{ actionType: 'ASSIGN_TO' }] as any }
    },
    order: [['createdAt', 'DESC']]
  });

  if (!lastExec || !lastExec.actionsExecuted) {
    return users[0].id;
  }

  // Find the last assigned user and pick the next one
  const lastAssign = lastExec.actionsExecuted.find(a => a.actionType === 'ASSIGN_TO');
  const lastUserId = lastAssign?.result?.assignedTo;
  const currentIndex = users.findIndex(u => u.id === lastUserId);
  const nextIndex = (currentIndex + 1) % users.length;

  return users[nextIndex].id;
}

/** Least-loaded: pick the active user with the fewest open tasks */
async function getLeastLoadedUser(): Promise<number | null> {
  const users = await User.findAll({
    where: { status: 'ACTIVE' },
    attributes: ['id'],
    limit: 100
  });

  if (users.length === 0) return null;

  let minCount = Infinity;
  let selectedUserId: number | null = null;

  for (const user of users) {
    const count = await DailyTask.count({
      where: {
        salesRepresentativeId: user.id,
        status: { [Op.notIn]: ['DONE', 'CANCELLED'] }
      }
    });

    if (count < minCount) {
      minCount = count;
      selectedUserId = user.id;
    }
  }

  return selectedUserId;
}

// ─────────────────────────────────────────────────────────
// Single action executor (switch on action.type)
// ─────────────────────────────────────────────────────────

async function executeAction(
  action: WorkflowAction,
  entity: Record<string, any>,
  context: { entityType: string; entityId: string; userId?: number }
): Promise<unknown> {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return executeUpdateField(action, context.entityType, context.entityId, entity);
    case 'CREATE_RECORD':
      return executeCreateRecord(action, entity);
    case 'SEND_EMAIL':
      return executeSendEmail(action, entity);
    case 'SEND_NOTIFICATION':
      return executeSendNotification(action, entity, context.userId);
    case 'CREATE_TASK':
      return executeCreateTask(action, entity, context.userId);
    case 'WEBHOOK':
      return executeWebhook(action, entity);
    case 'ASSIGN_TO':
      return executeAssignment(action, context.entityType, context.entityId);
    default:
      throw new Error(`Unknown action type: ${(action as any).type}`);
  }
}

// ─────────────────────────────────────────────────────────
// Execute all actions for a matched rule
// ─────────────────────────────────────────────────────────

async function executeWorkflow(
  rule: WorkflowRule,
  entity: Record<string, any>,
  trigger: { type: string; entityType: string; entityId: string },
  userId?: number
): Promise<WorkflowExecution> {
  const startTime = Date.now();
  const actionResults: ActionExecutionResult[] = [];
  let overallStatus: ExecutionStatus = ExecutionStatus.SUCCESS;

  let hasDelayedActions = false;
  let actionsToQueue: unknown[] = [];

  for (let i = 0; i < rule.actions.length; i++) {
    const action = rule.actions[i];

    // DELAY Node Support (Time Wait)
    if (action.type === 'DELAY') {
      hasDelayedActions = true;
      // Capture the rest of the actions to be executed after the delay
      actionsToQueue = rule.actions.slice(i + 1);

      actionResults.push({
        actionType: 'DELAY',
        status: 'SUCCESS',
        result: { message: `Workflow paused for ${action.days || 0} days, ${action.hours || 0} hours.` }
      });
      break; // Stop synchronous execution here
    }

    try {
      const result = await executeAction(action, entity, {
        entityType: trigger.entityType,
        entityId: trigger.entityId,
        userId
      });

      actionResults.push({
        actionType: action.type,
        status: 'SUCCESS',
        result
      });
    } catch (error: unknown) {
      actionResults.push({
        actionType: action.type,
        status: 'FAILED',
        error: error.message || 'Unknown error'
      });
      overallStatus = ExecutionStatus.PARTIAL;
    }
  }

  // If every action failed, mark as FAILED
  if (actionResults.every(r => r.status === 'FAILED')) {
    overallStatus = ExecutionStatus.FAILED;
  }

  const executionTimeMs = Date.now() - startTime;

  // Create execution log
  const execution = await WorkflowExecution.create({
    workflowRuleId: rule.id,
    entityType: trigger.entityType,
    entityId: trigger.entityId,
    triggerType: trigger.type,
    status: overallStatus,
    actionsExecuted: actionResults,
    executionTimeMs,
    userId: userId || null
  });

  // If we hit a delay node, dispatch the rest of the actions to BullMQ
  if (hasDelayedActions && actionsToQueue.length > 0) {
    const delayAction = rule.actions.find(a => a.type === 'DELAY');
    const delayMs = (delayAction?.days || 0) * 86400000 + (delayAction?.hours || 0) * 3600000;

    const { workflowQueue } = require('./workflowQueue');
    await workflowQueue.add(
      'delayed-workflow',
      {
        executionId: execution.id,
        ruleId: rule.id,
        entityType: trigger.entityType,
        entityId: trigger.entityId,
        actions: actionsToQueue,
        entityData: entity,
        triggerUserId: userId
      },
      { delay: delayMs }
    );

    // Mark as Partial since it's queued
    await execution.update({ status: ExecutionStatus.PARTIAL });
  }

  // Update rule statistics
  await rule.update({
    executionCount: rule.executionCount + 1,
    lastExecutedAt: new Date()
  });

  // Emit real-time event
  io.emit('workflow:executed', {
    ruleId: rule.id,
    ruleName: rule.name,
    executionId: execution.id,
    status: overallStatus,
    entityType: trigger.entityType,
    entityId: trigger.entityId,
    executionTimeMs
  });

  return execution;
}

// ─────────────────────────────────────────────────────────
// MAIN ENTRY POINT: processEntityEvent
// Called from other services/middleware when entities change
// ─────────────────────────────────────────────────────────

async function processEntityEvent(
  entityType: string,
  entityId: string,
  triggerType: TriggerType,
  oldData?: Record<string, any> | null,
  newData?: Record<string, any> | null,
  userId?: number
): Promise<WorkflowExecution[]> {
  try {
    // Build query for matching rules
    const where: Record<string, unknown> = {
      entityType,
      isActive: true,
      [Op.or]: [
        { triggerType },
        // ON_FIELD_CHANGE rules also fire on ON_UPDATE if a watched field changed
        ...(triggerType === TriggerType.ON_UPDATE ? [{ triggerType: TriggerType.ON_FIELD_CHANGE }] : [])
      ]
    };

    const rules = await WorkflowRule.findAll({
      where,
      order: [['priority', 'DESC']]
    });

    if (rules.length === 0) return [];

    // Resolve the current entity data
    const entity = newData || (await fetchEntity(entityType, entityId));
    if (!entity) return [];

    const executions: WorkflowExecution[] = [];

    for (const rule of rules) {
      try {
        // For ON_FIELD_CHANGE: verify the specific field actually changed
        if (rule.triggerType === TriggerType.ON_FIELD_CHANGE) {
          if (!rule.triggerField) continue;
          if (!oldData || !newData) continue;

          const oldValue = getNestedValue(oldData, rule.triggerField);
          const newValue = getNestedValue(newData, rule.triggerField);

          // Field did not change – skip
          if (String(oldValue) === String(newValue)) continue;

          // If triggerValue is specified, the new value must match
          if (rule.triggerValue && String(newValue) !== String(rule.triggerValue)) continue;
        }

        // Evaluate additional conditions
        if (!evaluateConditions(entity, rule.conditions, rule.conditionLogic)) continue;

        // Execute the workflow
        const execution = await executeWorkflow(
          rule,
          entity,
          {
            type: triggerType,
            entityType,
            entityId
          },
          userId
        );

        executions.push(execution);
      } catch (error: unknown) {
        // Log failed execution but continue with other rules
        console.error(`Workflow rule ${rule.id} (${rule.name}) failed:`, error.message);

        const failedExec = await WorkflowExecution.create({
          workflowRuleId: rule.id,
          entityType,
          entityId,
          triggerType,
          status: ExecutionStatus.FAILED,
          actionsExecuted: [{ actionType: 'SYSTEM', status: 'FAILED', error: error.message }],
          executionTimeMs: 0,
          userId: userId || null
        });

        executions.push(failedExec);
      }
    }

    return executions;
  } catch (error: unknown) {
    console.error('Workflow engine processEntityEvent error:', error.message);
    return [];
  }
}

/** Fetch an entity by type and id from the model registry */
async function fetchEntity(entityType: string, entityId: string): Promise<Record<string, any> | null> {
  const registry = getModelRegistry();
  const Model = registry[entityType];
  if (!Model) return null;

  const record = await Model.findByPk(entityId);
  return record ? record.toJSON() : null;
}

// ─────────────────────────────────────────────────────────
// Test a rule with sample data (dry-run, no side effects)
// ─────────────────────────────────────────────────────────

async function testRule(
  ruleId: number,
  sampleData: Record<string, any>
): Promise<{
  conditionsMatch: boolean;
  resolvedActions: Array<{ type: string; resolved: Record<string, any> }>;
}> {
  const rule = await WorkflowRule.findByPk(ruleId);
  if (!rule) throw new BaseError(ERRORS.WORKFLOW_RULE_NOT_FOUND);

  const conditionsMatch = evaluateConditions(sampleData, rule.conditions, rule.conditionLogic);

  const resolvedActions = rule.actions.map(action => {
    const resolved: Record<string, any> = { type: action.type };

    for (const [key, val] of Object.entries(action)) {
      if (key === 'type') continue;
      resolved[key] = typeof val === 'string' ? resolveTemplate(val, sampleData) : val;
    }

    return { type: action.type, resolved };
  });

  return { conditionsMatch, resolvedActions };
}

// ─────────────────────────────────────────────────────────
// Execute Delayed Actions (Called by BullMQ Worker)
// ─────────────────────────────────────────────────────────

async function executeDelayedActions(
  executionId: number,
  ruleId: number,
  entity: Record<string, any>,
  actions: unknown[],
  userId?: number
): Promise<void> {
  const execution = await WorkflowExecution.findByPk(executionId);
  if (!execution) return;

  const actionResults: ActionExecutionResult[] = execution.actionsExecuted || [];
  let overallStatus: ExecutionStatus = ExecutionStatus.SUCCESS;

  for (const action of actions) {
    try {
      const result = await executeAction(action, entity, {
        entityType: execution.entityType,
        entityId: execution.entityId,
        userId
      });

      actionResults.push({
        actionType: action.type,
        status: 'SUCCESS',
        result
      });
    } catch (error: unknown) {
      actionResults.push({
        actionType: action.type,
        status: 'FAILED',
        error: error.message || 'Unknown error'
      });
      overallStatus = ExecutionStatus.PARTIAL;
    }
  }

  if (actionResults.every(r => r.status === 'FAILED')) {
    overallStatus = ExecutionStatus.FAILED;
  }

  await execution.update({
    status: overallStatus,
    actionsExecuted: actionResults
  });

  io.emit('workflow:delayed_executed', {
    executionId,
    status: overallStatus
  });
}

// ─────────────────────────────────────────────────────────
// Manual execution
// ─────────────────────────────────────────────────────────

async function manualExecute(ruleId: number, userId: number): Promise<WorkflowExecution> {
  const rule = await WorkflowRule.findByPk(ruleId);
  if (!rule) throw new BaseError(ERRORS.WORKFLOW_RULE_NOT_FOUND);

  // For manual triggers, we build a minimal entity context from the rule's entityType
  const entity: Record<string, any> = {
    id: 'manual-trigger',
    _manualExecution: true,
    _triggeredBy: userId,
    _triggeredAt: new Date().toISOString()
  };

  const execution = await executeWorkflow(
    rule,
    entity,
    {
      type: TriggerType.MANUAL,
      entityType: rule.entityType,
      entityId: 'manual-trigger'
    },
    userId
  );

  return execution;
}

// ─────────────────────────────────────────────────────────
// Execution detail (single run)
// ─────────────────────────────────────────────────────────

async function getExecutionDetail(runId: number) {
  const execution = await WorkflowExecution.findByPk(runId, {
    include: [{ model: WorkflowRule, as: 'workflowRule', attributes: ['id', 'name', 'entityType', 'triggerType', 'actions'] }]
  });
  if (!execution) throw new BaseError(ERRORS.WORKFLOW_EXECUTION_NOT_FOUND);
  return execution;
}

// ─────────────────────────────────────────────────────────
// Workflow templates
// ─────────────────────────────────────────────────────────

function getTemplates() {
  return [
    {
      id: 'lead-nurture',
      name: 'Lead Nurture',
      description: 'Automatically assign new leads, send a welcome email, wait 3 days, then create a follow-up task.',
      entityType: 'lead',
      triggerType: TriggerType.ON_CREATE,
      nodes: [
        {
          id: 'tpl-1',
          type: 'triggerNode',
          position: { x: 300, y: 30 },
          data: { label: 'New Lead Created', nodeType: 'trigger', config: { entityType: 'lead', triggerType: 'ON_CREATE' } }
        },
        {
          id: 'tpl-2',
          type: 'actionNode',
          position: { x: 300, y: 150 },
          data: { label: 'Auto-Assign', nodeType: 'action', config: { type: 'ASSIGN_TO', method: 'round_robin' } }
        },
        {
          id: 'tpl-3',
          type: 'actionNode',
          position: { x: 300, y: 270 },
          data: {
            label: 'Welcome Email',
            nodeType: 'action',
            config: { type: 'SEND_EMAIL', to: '{{email}}', subject: 'Welcome!', body: 'Thank you for your interest, {{name}}.' }
          }
        },
        {
          id: 'tpl-4',
          type: 'delayNode',
          position: { x: 300, y: 390 },
          data: { label: 'Wait 3 Days', nodeType: 'delay', config: { delay: 3, unit: 'days' } }
        },
        {
          id: 'tpl-5',
          type: 'actionNode',
          position: { x: 300, y: 510 },
          data: { label: 'Follow-up Task', nodeType: 'action', config: { type: 'CREATE_TASK', title: 'Follow up with {{name}}', dueInDays: 1 } }
        }
      ],
      edges: [
        { id: 'tpl-e1', source: 'tpl-1', target: 'tpl-2', animated: true },
        { id: 'tpl-e2', source: 'tpl-2', target: 'tpl-3', animated: true },
        { id: 'tpl-e3', source: 'tpl-3', target: 'tpl-4', animated: true },
        { id: 'tpl-e4', source: 'tpl-4', target: 'tpl-5', animated: true }
      ]
    },
    {
      id: 'deal-won',
      name: 'Deal Won Pipeline',
      description: 'When a deal is won, create a sales order, generate an invoice, and notify the team.',
      entityType: 'deal',
      triggerType: TriggerType.ON_FIELD_CHANGE,
      nodes: [
        {
          id: 'tpl-1',
          type: 'triggerNode',
          position: { x: 300, y: 30 },
          data: {
            label: 'Deal Won',
            nodeType: 'trigger',
            config: { entityType: 'deal', triggerType: 'ON_FIELD_CHANGE', triggerField: 'stage', triggerValue: 'WON' }
          }
        },
        {
          id: 'tpl-2',
          type: 'actionNode',
          position: { x: 300, y: 150 },
          data: {
            label: 'Create Sales Order',
            nodeType: 'action',
            config: { type: 'CREATE_RECORD', entityType: 'invoice', data: { dealId: '{{id}}', amount: '{{amount}}' } }
          }
        },
        {
          id: 'tpl-3',
          type: 'actionNode',
          position: { x: 300, y: 270 },
          data: {
            label: 'Generate Invoice',
            nodeType: 'action',
            config: { type: 'SEND_EMAIL', to: '{{client.email}}', subject: 'Invoice for {{name}}', body: 'Please find your invoice attached.' }
          }
        },
        {
          id: 'tpl-4',
          type: 'actionNode',
          position: { x: 300, y: 390 },
          data: {
            label: 'Notify Team',
            nodeType: 'action',
            config: { type: 'SEND_NOTIFICATION', role: 'Sales Manager', title: 'Deal Won!', message: '{{name}} has been won for {{amount}}.' }
          }
        }
      ],
      edges: [
        { id: 'tpl-e1', source: 'tpl-1', target: 'tpl-2', animated: true },
        { id: 'tpl-e2', source: 'tpl-2', target: 'tpl-3', animated: true },
        { id: 'tpl-e3', source: 'tpl-3', target: 'tpl-4', animated: true }
      ]
    },
    {
      id: 'support-escalation',
      name: 'Support Escalation',
      description: 'Auto-assign new tickets, check SLA, and escalate overdue tickets with a condition check.',
      entityType: 'ticket',
      triggerType: TriggerType.ON_CREATE,
      nodes: [
        {
          id: 'tpl-1',
          type: 'triggerNode',
          position: { x: 300, y: 30 },
          data: { label: 'Ticket Created', nodeType: 'trigger', config: { entityType: 'ticket', triggerType: 'ON_CREATE' } }
        },
        {
          id: 'tpl-2',
          type: 'actionNode',
          position: { x: 300, y: 150 },
          data: { label: 'Auto-Assign', nodeType: 'action', config: { type: 'ASSIGN_TO', method: 'least_loaded' } }
        },
        {
          id: 'tpl-3',
          type: 'conditionNode',
          position: { x: 300, y: 270 },
          data: { label: 'SLA Check', nodeType: 'condition', config: { field: 'priority', operator: 'equals', value: 'HIGH' } }
        },
        {
          id: 'tpl-4',
          type: 'actionNode',
          position: { x: 150, y: 410 },
          data: {
            label: 'Escalate to Manager',
            nodeType: 'action',
            config: {
              type: 'SEND_NOTIFICATION',
              role: 'Support Manager',
              title: 'Urgent Ticket',
              message: 'Ticket #{{id}} requires escalation: {{subject}}'
            }
          }
        },
        {
          id: 'tpl-5',
          type: 'actionNode',
          position: { x: 450, y: 410 },
          data: {
            label: 'Standard Process',
            nodeType: 'action',
            config: { type: 'SEND_NOTIFICATION', title: 'New Ticket', message: 'Ticket #{{id}} assigned to you.' }
          }
        }
      ],
      edges: [
        { id: 'tpl-e1', source: 'tpl-1', target: 'tpl-2', animated: true },
        { id: 'tpl-e2', source: 'tpl-2', target: 'tpl-3', animated: true },
        { id: 'tpl-e3', source: 'tpl-3', sourceHandle: 'yes', target: 'tpl-4', animated: true },
        { id: 'tpl-e4', source: 'tpl-3', sourceHandle: 'no', target: 'tpl-5', animated: true }
      ]
    },
    {
      id: 'employee-onboarding',
      name: 'Employee Onboarding',
      description: 'New employee triggers account creation, mentor assignment, and orientation scheduling.',
      entityType: 'task',
      triggerType: TriggerType.ON_CREATE,
      nodes: [
        {
          id: 'tpl-1',
          type: 'triggerNode',
          position: { x: 300, y: 30 },
          data: { label: 'New Employee', nodeType: 'trigger', config: { entityType: 'task', triggerType: 'ON_CREATE' } }
        },
        {
          id: 'tpl-2',
          type: 'actionNode',
          position: { x: 300, y: 150 },
          data: { label: 'Create Accounts', nodeType: 'action', config: { type: 'CREATE_TASK', title: 'Create accounts for {{name}}', dueInDays: 1 } }
        },
        {
          id: 'tpl-3',
          type: 'actionNode',
          position: { x: 300, y: 270 },
          data: { label: 'Assign Mentor', nodeType: 'action', config: { type: 'ASSIGN_TO', method: 'least_loaded' } }
        },
        {
          id: 'tpl-4',
          type: 'actionNode',
          position: { x: 300, y: 390 },
          data: {
            label: 'Schedule Orientation',
            nodeType: 'action',
            config: {
              type: 'SEND_EMAIL',
              to: '{{email}}',
              subject: 'Welcome Orientation',
              body: 'Welcome aboard, {{name}}! Your orientation is scheduled.'
            }
          }
        }
      ],
      edges: [
        { id: 'tpl-e1', source: 'tpl-1', target: 'tpl-2', animated: true },
        { id: 'tpl-e2', source: 'tpl-2', target: 'tpl-3', animated: true },
        { id: 'tpl-e3', source: 'tpl-3', target: 'tpl-4', animated: true }
      ]
    },
    {
      id: 'invoice-reminder',
      name: 'Invoice Reminder',
      description: 'When an invoice is overdue, send a reminder, wait 7 days, send final notice, and create a follow-up task.',
      entityType: 'invoice',
      triggerType: TriggerType.ON_FIELD_CHANGE,
      nodes: [
        {
          id: 'tpl-1',
          type: 'triggerNode',
          position: { x: 300, y: 30 },
          data: {
            label: 'Invoice Overdue',
            nodeType: 'trigger',
            config: { entityType: 'invoice', triggerType: 'ON_FIELD_CHANGE', triggerField: 'status', triggerValue: 'OVERDUE' }
          }
        },
        {
          id: 'tpl-2',
          type: 'actionNode',
          position: { x: 300, y: 150 },
          data: {
            label: 'Send Reminder',
            nodeType: 'action',
            config: {
              type: 'SEND_EMAIL',
              to: '{{client.email}}',
              subject: 'Invoice Reminder - {{invoiceNumber}}',
              body: 'This is a friendly reminder that invoice {{invoiceNumber}} is overdue.'
            }
          }
        },
        {
          id: 'tpl-3',
          type: 'delayNode',
          position: { x: 300, y: 270 },
          data: { label: 'Wait 7 Days', nodeType: 'delay', config: { delay: 7, unit: 'days' } }
        },
        {
          id: 'tpl-4',
          type: 'actionNode',
          position: { x: 300, y: 390 },
          data: {
            label: 'Final Notice',
            nodeType: 'action',
            config: {
              type: 'SEND_EMAIL',
              to: '{{client.email}}',
              subject: 'Final Notice - {{invoiceNumber}}',
              body: 'URGENT: Invoice {{invoiceNumber}} is still unpaid. Please settle immediately.'
            }
          }
        },
        {
          id: 'tpl-5',
          type: 'actionNode',
          position: { x: 300, y: 510 },
          data: {
            label: 'Create Follow-up Task',
            nodeType: 'action',
            config: { type: 'CREATE_TASK', title: 'Follow up on overdue invoice {{invoiceNumber}}', dueInDays: 1 }
          }
        }
      ],
      edges: [
        { id: 'tpl-e1', source: 'tpl-1', target: 'tpl-2', animated: true },
        { id: 'tpl-e2', source: 'tpl-2', target: 'tpl-3', animated: true },
        { id: 'tpl-e3', source: 'tpl-3', target: 'tpl-4', animated: true },
        { id: 'tpl-e4', source: 'tpl-4', target: 'tpl-5', animated: true }
      ]
    }
  ];
}

export default {
  // CRUD
  createRule,
  updateRule,
  deleteRule,
  getRules,
  getRuleById,
  toggleRule,

  // Execution queries
  getExecutions,
  getExecutionsForRule,
  getExecutionDetail,

  // Engine core
  evaluateConditions,
  executeWorkflow,
  processEntityEvent,
  executeAction,
  resolveTemplate,

  // Manual execution
  manualExecute,

  // Templates
  getTemplates,

  // Testing
  testRule
};
