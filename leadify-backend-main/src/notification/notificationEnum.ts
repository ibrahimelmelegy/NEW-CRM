export enum NotificationTypeEnums {
  LEAD_ASSIGNED = 'LEAD_ASSIGNED',
  OPPORTUNITY_ASSIGNED = 'OPPORTUNITY_ASSIGNED',
  DEAL_ASSIGNED = 'DEAL_ASSIGNED',
  DEAL_WON = 'DEAL_WON',
  PROJECT_ASSIGNED = 'PROJECT_ASSIGNED',
  CLIENT_ASSIGNED = 'CLIENT_ASSIGNED',
  PROPOSAL_APPROVED = 'PROPOSAL_APPROVED',
  PROPOSAL_REJECTED = 'PROPOSAL_REJECTED',
  PROPOSAL_ASSIGNED = 'PROPOSAL_ASSIGNED',
  TASK_DUE = 'TASK_DUE',
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED',
  COMMENT_MENTION = 'COMMENT_MENTION',
  WORKFLOW_TRIGGERED = 'WORKFLOW_TRIGGERED',
  SLA_BREACH = 'SLA_BREACH',
  SLA_WARNING = 'SLA_WARNING',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  CONTRACT_EXPIRING = 'CONTRACT_EXPIRING',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  DOCUMENT_APPROVAL_REQUESTED = 'DOCUMENT_APPROVAL_REQUESTED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED'
}

export enum NotificationReadEnums {
  READ = 'READ',
  UN_READ = 'UN_READ',
  CLICKED = 'CLICKED'
}

export enum NotificationPriorityEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Default priority mapping for notification types. Types not listed default to MEDIUM.
 */
export const TYPE_PRIORITY_MAP: Record<string, NotificationPriorityEnum> = {
  [NotificationTypeEnums.SLA_BREACH]: NotificationPriorityEnum.CRITICAL,
  [NotificationTypeEnums.INVOICE_OVERDUE]: NotificationPriorityEnum.HIGH,
  [NotificationTypeEnums.SLA_WARNING]: NotificationPriorityEnum.HIGH,
  [NotificationTypeEnums.CONTRACT_EXPIRING]: NotificationPriorityEnum.HIGH,
  [NotificationTypeEnums.DEAL_WON]: NotificationPriorityEnum.HIGH,
  [NotificationTypeEnums.APPROVAL_REQUESTED]: NotificationPriorityEnum.MEDIUM,
  [NotificationTypeEnums.DOCUMENT_APPROVAL_REQUESTED]: NotificationPriorityEnum.MEDIUM,
  [NotificationTypeEnums.SYSTEM_ALERT]: NotificationPriorityEnum.LOW,
  [NotificationTypeEnums.WORKFLOW_TRIGGERED]: NotificationPriorityEnum.LOW
};
