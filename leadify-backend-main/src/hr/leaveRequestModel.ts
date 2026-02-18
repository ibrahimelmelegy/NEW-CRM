import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  PERSONAL = 'PERSONAL',
  UNPAID = 'UNPAID',
  MATERNITY = 'MATERNITY',
  EMERGENCY = 'EMERGENCY'
}

@Table({
  tableName: 'leave_requests',
  modelName: 'LeaveRequest',
  timestamps: true
})
class LeaveRequest extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User, 'userId')
  public user?: User;

  @Column({ type: DataType.ENUM(...Object.values(LeaveType)), allowNull: false })
  public leaveType!: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  public startDate!: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  public endDate!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public reason?: string;

  @Default(LeaveStatus.PENDING)
  @Column({ type: DataType.ENUM(...Object.values(LeaveStatus)), allowNull: false })
  public status!: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public approvedBy?: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public rejectionReason?: string;
}

export default LeaveRequest;
