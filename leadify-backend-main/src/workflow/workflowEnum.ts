// ── Re-exported from workflowModel.ts for backward compatibility ──
// The canonical type definitions now live in workflowModel.ts and
// workflowExecutionModel.ts. This file re-exports them so that any
// existing imports from workflowEnum still resolve correctly.

export { TriggerType, ConditionLogic, ENTITY_TYPES } from './workflowModel';
export type { EntityType, WorkflowCondition, WorkflowAction } from './workflowModel';
export { ExecutionStatus } from './workflowExecutionModel';
export type { ActionExecutionResult } from './workflowExecutionModel';
