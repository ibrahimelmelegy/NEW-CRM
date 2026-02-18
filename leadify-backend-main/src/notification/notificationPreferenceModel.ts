import { Column, DataType, ForeignKey, BelongsTo, Model, Table, Index } from 'sequelize-typescript';
import User from '../user/userModel';

export interface NotificationChannels {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export interface NotificationPreferencesMap {
  lead_assigned: NotificationChannels;
  deal_won: NotificationChannels;
  deal_assigned: NotificationChannels;
  task_due: NotificationChannels;
  approval_requested: NotificationChannels;
  comment_mention: NotificationChannels;
  workflow_triggered: NotificationChannels;
  sla_breach: NotificationChannels;
  sla_warning: NotificationChannels;
  opportunity_assigned: NotificationChannels;
  project_assigned: NotificationChannels;
  client_assigned: NotificationChannels;
  proposal_approved: NotificationChannels;
  proposal_rejected: NotificationChannels;
  proposal_assigned: NotificationChannels;
  invoice_overdue: NotificationChannels;
  contract_expiring: NotificationChannels;
  system_alert: NotificationChannels;
  [key: string]: NotificationChannels;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferencesMap = {
  lead_assigned: { inApp: true, email: true, push: false },
  deal_won: { inApp: true, email: true, push: true },
  deal_assigned: { inApp: true, email: true, push: false },
  task_due: { inApp: true, email: true, push: false },
  approval_requested: { inApp: true, email: true, push: false },
  comment_mention: { inApp: true, email: true, push: false },
  workflow_triggered: { inApp: true, email: false, push: false },
  sla_breach: { inApp: true, email: true, push: true },
  sla_warning: { inApp: true, email: true, push: false },
  opportunity_assigned: { inApp: true, email: true, push: false },
  project_assigned: { inApp: true, email: true, push: false },
  client_assigned: { inApp: true, email: true, push: false },
  proposal_approved: { inApp: true, email: true, push: false },
  proposal_rejected: { inApp: true, email: true, push: false },
  proposal_assigned: { inApp: true, email: true, push: false },
  invoice_overdue: { inApp: true, email: true, push: true },
  contract_expiring: { inApp: true, email: true, push: false },
  system_alert: { inApp: true, email: false, push: false }
};

@Table({
  tableName: 'notification_preferences',
  modelName: 'NotificationPreference',
  timestamps: true
})
export default class NotificationPreference extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true
  })
  userId!: number;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: DEFAULT_NOTIFICATION_PREFERENCES
  })
  preferences!: NotificationPreferencesMap;

  @BelongsTo(() => User, { as: 'user' })
  user!: User;
}
