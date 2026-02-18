import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import ApprovalWorkflow from './approvalWorkflowModel';
import User from '../user/userModel';

@Table({ tableName: 'approval_requests', timestamps: true })
export default class ApprovalRequest extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @ForeignKey(() => ApprovalWorkflow)
  @Column({ type: DataType.INTEGER, allowNull: false })
  workflowId!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  entityType!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  entityId!: number;

  @Column({ type: DataType.STRING })
  title!: string;

  @Column({ type: DataType.TEXT })
  description!: string;

  @Column({ type: DataType.ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'), defaultValue: 'PENDING' })
  status!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  currentStep!: number;

  @Column({ type: DataType.JSON })
  stepResults!: Array<{ step: number; approverUserId: number; status: string; comment: string; date: string }>;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  requesterId!: number;

  @BelongsTo(() => ApprovalWorkflow)
  workflow!: ApprovalWorkflow;

  @BelongsTo(() => User)
  requester!: User;
}
