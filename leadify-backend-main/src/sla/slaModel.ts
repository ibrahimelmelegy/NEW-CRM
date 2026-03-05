import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, Default, Index } from 'sequelize-typescript';
import User from '../user/userModel';

// ─── Interfaces ──────────────────────────────────────────────────────────

export interface SLAConditions {
  priority?: string;
  type?: string;
  category?: string;
  [key: string]: any;
}

export interface EscalationRule {
  afterMinutes: number;
  action: string; // 'notify' | 'reassign' | 'escalate'
  targetUserId?: number;
  targetRole?: string;
}

export interface BusinessHoursConfig {
  start: string; // e.g. '08:00'
  end: string; // e.g. '17:00'
  timezone: string; // e.g. 'Asia/Riyadh'
  workDays: number[]; // e.g. [0,1,2,3,4] (Sun-Thu for Saudi Arabia)
}

export enum SLAInstanceStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  BREACHED = 'BREACHED'
}

// ─── SLA Policy Model ───────────────────────────────────────────────────

@Table({
  tableName: 'sla_policies',
  modelName: 'SLAPolicy',
  timestamps: true,
  indexes: [{ fields: ['entityType'] }, { fields: ['isActive'] }]
})
export class SLAPolicy extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'Entity type this SLA applies to: ticket, task, approval_request, lead, deal'
  })
  entityType!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Conditions for when this SLA applies, e.g. { priority: "HIGH", type: "BUG" }'
  })
  conditions!: SLAConditions;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'Maximum minutes allowed for first response'
  })
  responseTimeMinutes!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'Maximum minutes allowed for full resolution'
  })
  resolutionTimeMinutes!: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: 'Escalation rules: array of { afterMinutes, action, targetUserId?, targetRole? }'
  })
  escalationRules!: EscalationRule[];

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  businessHoursOnly!: boolean;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {
      start: '08:00',
      end: '17:00',
      timezone: 'Asia/Riyadh',
      workDays: [0, 1, 2, 3, 4]
    }
  })
  businessHours!: BusinessHoursConfig;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive!: boolean;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  createdBy!: number;

  @BelongsTo(() => User, { as: 'creator', foreignKey: 'createdBy' })
  creator!: User;

  @HasMany(() => SLAInstance)
  instances!: SLAInstance[];
}

// ─── SLA Instance Model ─────────────────────────────────────────────────

@Table({
  tableName: 'sla_instances',
  modelName: 'SLAInstance',
  timestamps: true,
  indexes: [
    { fields: ['entityType', 'entityId'] },
    { fields: ['status'] },
    { fields: ['responseDeadline'] },
    { fields: ['resolutionDeadline'] },
    { fields: ['slaPolicyId'] }
  ]
})
export class SLAInstance extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @ForeignKey(() => SLAPolicy)
  @Column({ type: DataType.INTEGER, allowNull: false })
  slaPolicyId!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  entityType!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  entityId!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  startedAt!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  responseDeadline!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  resolutionDeadline!: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  firstRespondedAt!: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  resolvedAt!: Date | null;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  responseBreached!: boolean;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  resolutionBreached!: boolean;

  @Default(0)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  currentEscalationLevel!: number;

  @Default(SLAInstanceStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(SLAInstanceStatus)),
    defaultValue: SLAInstanceStatus.ACTIVE
  })
  status!: string;

  @Column({ type: DataType.DATE, allowNull: true })
  pausedAt!: Date | null;

  @Default(0)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  pausedDurationMinutes!: number;

  @BelongsTo(() => SLAPolicy, { as: 'policy', foreignKey: 'slaPolicyId' })
  policy!: SLAPolicy;
}
