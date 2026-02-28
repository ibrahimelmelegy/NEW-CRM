import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({ tableName: 'data_requests', timestamps: true })
export default class DataRequest extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.UUID, allowNull: false })
  public requesterId!: string; // contactId of the person making the request

  @Column({ type: DataType.STRING(200), allowNull: true })
  public requesterEmail?: string;

  @Column({ type: DataType.STRING(30), allowNull: false })
  public type!: 'ACCESS' | 'DELETION' | 'RECTIFICATION' | 'PORTABILITY' | 'RESTRICTION';

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'PENDING' })
  public status!: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'OVERDUE';

  @Column({ type: DataType.DATE, allowNull: false })
  public deadline!: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public completedAt?: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public resolution?: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  public regulation?: string; // e.g. 'GDPR', 'CCPA'

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public assignedTo?: number;

  @BelongsTo(() => User, { foreignKey: 'assignedTo', as: 'assignee' })
  public assignee?: User;
}
