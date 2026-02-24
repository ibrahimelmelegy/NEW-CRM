import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table
} from 'sequelize-typescript';
import User from '../../user/userModel';

export enum ActivityType {
  EMAIL = 'EMAIL',
  CALL = 'CALL',
  NOTE = 'NOTE',
  MEETING = 'MEETING',
  TASK = 'TASK'
}

export enum ContactType {
  CLIENT = 'CLIENT',
  LEAD = 'LEAD',
  DEAL = 'DEAL'
}

export enum ActivityDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

@Table({
  tableName: 'comm_activities',
  modelName: 'CommActivity',
  timestamps: true,
  indexes: [
    { fields: ['contactId', 'contactType'] },
    { fields: ['userId'] },
    { fields: ['type'] },
    { fields: ['createdAt'] }
  ]
})
class CommActivity extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({
    type: DataType.ENUM(...Object.values(ActivityType)),
    allowNull: false
  })
  public type!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public contactId!: string;

  @Column({
    type: DataType.ENUM(...Object.values(ContactType)),
    allowNull: false
  })
  public contactType!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  public subject!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public body?: string;

  @Column({
    type: DataType.ENUM(...Object.values(ActivityDirection)),
    allowNull: true
  })
  public direction?: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public duration?: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  public metadata?: Record<string, any>;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @BelongsTo(() => User, { as: 'user', foreignKey: 'userId' })
  public user?: User;
}

export default CommActivity;
