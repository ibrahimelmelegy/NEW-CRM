// ────────────────────────────────────────────────────────
// DEPRECATED: This file is kept for backward compatibility.
// The canonical workflow engine is now in workflowService.ts.
//
// If you previously used:
//   import workflowEngine from './workflowEngine';
//   workflowEngine.evaluate(trigger, entityData, entityId);
//
// Migrate to:
//   import workflowService from './workflowService';
//   workflowService.processEntityEvent(entityType, entityId, triggerType, oldData, newData, userId);
// ────────────────────────────────────────────────────────
import workflowService from './workflowService';
import { TriggerType } from './workflowModel';

/**
 * Legacy compatibility wrapper.
 * Maps the old evaluate(trigger, entityData, entityId) signature to
 * the new processEntityEvent() API.
 */
class WorkflowEngineLegacy {
  async evaluate(trigger: string, entityData: any, entityId?: string) {
    // Derive entityType from trigger string (e.g. LEAD_CREATED -> lead)
    const entityType = trigger.split('_')[0].toLowerCase();
    const triggerType = this.mapTrigger(trigger);

    await workflowService.processEntityEvent(
      entityType,
      entityId || entityData?.id || '',
      triggerType,
      null,
      entityData
    );
  }

  private mapTrigger(trigger: string): TriggerType {
    if (trigger.includes('CREATED')) return TriggerType.ON_CREATE;
    if (trigger.includes('UPDATED')) return TriggerType.ON_UPDATE;
    if (trigger.includes('CHANGED')) return TriggerType.ON_FIELD_CHANGE;
    if (trigger.includes('DELETED')) return TriggerType.ON_DELETE;
    return TriggerType.ON_UPDATE;
  }
}

export default new WorkflowEngineLegacy();
