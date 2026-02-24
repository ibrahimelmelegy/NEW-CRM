import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Index,
  Model,
  Table
} from 'sequelize-typescript';
import User from '../user/userModel';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  ASSIGNMENT = 'ASSIGNMENT',
  RESTORE = 'RESTORE',
  ARCHIVE = 'ARCHIVE'
}

export interface AuditFieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  fieldLabel?: string;
}

export interface AuditMetadata {
  ipAddress?: string;
  userAgent?: string;
  [key: string]: unknown;
}

@Table({
  tableName: 'audit_trail',
  modelName: 'AuditTrail',
  timestamps: true,
  updatedAt: false, // Audit records are immutable - never updated
  indexes: [
    { fields: ['entityType', 'entityId'], name: 'audit_entity_idx' },
    { fields: ['userId'], name: 'audit_user_idx' },
    { fields: ['createdAt'], name: 'audit_created_idx' }
  ]
})
class AuditTrail extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Index('audit_entity_idx')
  @Column({ type: DataType.STRING(50), allowNull: false })
  public entityType!: string;

  @Index('audit_entity_idx')
  @Column({ type: DataType.STRING, allowNull: false })
  public entityId!: string;

  @Column({
    type: DataType.ENUM(...Object.values(AuditAction)),
    allowNull: false
  })
  public action!: AuditAction;

  @ForeignKey(() => User)
  @Index('audit_user_idx')
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User, { as: 'user' })
  public user?: User;

  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: [] })
  public changes!: AuditFieldChange[];

  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: {} })
  public metadata!: AuditMetadata;
}

export default AuditTrail;
