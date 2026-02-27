import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../user/userModel';
import Tenant from '../tenant/tenantModel';

@Table({ tableName: 'as_meeting_notes', timestamps: true })
export default class MeetingNote extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING(300), allowNull: false })
  public title!: string;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'INTERNAL' })
  public type!: 'INTERNAL' | 'CLIENT' | 'TEAM' | 'BOARD';

  @Column({ type: DataType.DATE, allowNull: false })
  public date!: Date;

  @Column({ type: DataType.JSONB, allowNull: true })
  public attendees?: string[];

  @Column({ type: DataType.TEXT, allowNull: true })
  public minutes?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public actionItems?: Array<{ task: string; assignee: string; dueDate: string; completed: boolean }>;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public createdBy?: number;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  public creator?: User;
}
