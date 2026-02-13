import Workflow from './workflowModel';
import WorkflowLog from './workflowLogModel';
import { ConditionOperator, WorkflowActionType } from './workflowEnum';
import { sendEmail } from '../utils/emailHelper';
import Notification from '../notification/notificationModel';
import { io } from '../server';

class WorkflowEngine {
  async evaluate(trigger: string, entityData: any, entityId?: string) {
    const workflows = await Workflow.findAll({
      where: { trigger, isActive: true }
    });

    for (const workflow of workflows) {
      try {
        if (this.checkConditions(workflow.conditions || [], entityData)) {
          await this.executeActions(workflow.actions, entityData);
          await WorkflowLog.create({
            workflowId: workflow.id,
            trigger,
            entityId,
            status: 'SUCCESS',
            details: `Executed ${workflow.actions.length} actions`
          });
          await workflow.increment('executionCount');
        }
      } catch (error: any) {
        await WorkflowLog.create({
          workflowId: workflow.id,
          trigger,
          entityId,
          status: 'FAILED',
          details: error.message
        });
      }
    }
  }

  private checkConditions(conditions: any[], entityData: any): boolean {
    if (!conditions.length) return true;

    return conditions.every(cond => {
      const value = entityData[cond.field];
      switch (cond.operator) {
        case ConditionOperator.EQUALS: return value === cond.value;
        case ConditionOperator.NOT_EQUALS: return value !== cond.value;
        case ConditionOperator.CONTAINS: return String(value).includes(cond.value);
        case ConditionOperator.GREATER_THAN: return Number(value) > Number(cond.value);
        case ConditionOperator.LESS_THAN: return Number(value) < Number(cond.value);
        case ConditionOperator.IN: return Array.isArray(cond.value) && cond.value.includes(value);
        default: return true;
      }
    });
  }

  private async executeActions(actions: { type: string; config: any }[], entityData: any) {
    for (const action of actions) {
      switch (action.type) {
        case WorkflowActionType.SEND_EMAIL:
          await this.actionSendEmail(action.config, entityData);
          break;
        case WorkflowActionType.CREATE_NOTIFICATION:
          await this.actionCreateNotification(action.config, entityData);
          break;
        case WorkflowActionType.UPDATE_FIELD:
          // Field update would need model reference — skip for now
          break;
        case WorkflowActionType.ASSIGN_USER:
          // Assignment would need model reference — skip for now
          break;
      }
    }
  }

  private async actionSendEmail(config: { to: string; subject: string; body: string }, entityData: any) {
    const to = this.interpolate(config.to, entityData);
    const subject = this.interpolate(config.subject, entityData);
    const body = this.interpolate(config.body, entityData);

    await sendEmail({ to, subject, text: body, html: `<p>${body}</p>` });
  }

  private async actionCreateNotification(config: { userId?: number; message: string }, entityData: any) {
    const message = this.interpolate(config.message, entityData);
    const userId = config.userId || entityData.userId;

    if (userId) {
      await Notification.create({
        body_en: message,
        body_ar: message,
        userId,
        type: 'WORKFLOW',
        target: entityData.id
      });
      io.emit('notification:new', { userId });
    }
  }

  private interpolate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
  }
}

export default new WorkflowEngine();
