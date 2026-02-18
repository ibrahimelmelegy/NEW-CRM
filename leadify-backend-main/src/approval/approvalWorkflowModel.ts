import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import ApprovalRequest from './approvalRequestModel';

@Table({ tableName: 'approval_workflows', timestamps: true })
export default class ApprovalWorkflow extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.TEXT })
  description!: string;

  @Column({ type: DataType.ENUM('PURCHASE_ORDER', 'INVOICE', 'EXPENSE', 'LEAVE_REQUEST', 'CONTRACT', 'GENERAL'), allowNull: false })
  entityType!: string;

  @Column({ type: DataType.JSON, allowNull: false })
  steps!: Array<{ order: number; approverUserId: number; approverName: string; required: boolean }>;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive!: boolean;

  @HasMany(() => ApprovalRequest)
  requests!: ApprovalRequest[];
}
