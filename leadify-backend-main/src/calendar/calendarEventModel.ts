import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'calendar_events',
  modelName: 'CalendarEvent',
  timestamps: true
})
class CalendarEvent extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(500), allowNull: false })
  public title!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.DATE, allowNull: false })
  public startDate!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  public endDate!: Date;

  @Column({ type: DataType.STRING(5), allowNull: true })
  public startTime?: string;

  @Column({ type: DataType.STRING(5), allowNull: true })
  public endTime?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public allDay!: boolean;

  @Column({ type: DataType.STRING(7), allowNull: true })
  public color?: string;

  @Column({
    type: DataType.ENUM('MEETING', 'CALL', 'TASK', 'REMINDER', 'BOOKING', 'FOLLOW_UP', 'DEADLINE', 'OTHER'),
    allowNull: false,
    defaultValue: 'OTHER'
  })
  public eventType!: string;

  @Column({
    type: DataType.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
    allowNull: false,
    defaultValue: 'MEDIUM'
  })
  public priority!: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  public location?: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  public meetingLink?: string;

  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: [] })
  public attendees?: Array<{
    userId?: number;
    name: string;
    email?: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  }>;

  @Column({ type: DataType.JSONB, allowNull: true })
  public recurrence?: {
    pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    interval: number;
    endDate?: string;
    daysOfWeek?: number[];
  } | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public isPrivate!: boolean;

  @Column({ type: DataType.STRING(50), allowNull: true })
  public relatedEntityType?: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public relatedEntityId?: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public reminder?: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: []
  })
  public reminders?: Array<{ minutes: number; type: 'email' | 'push' | 'sms' }>;

  @Column({
    type: DataType.ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'SCHEDULED'
  })
  public status!: string;

  // ─── External Calendar Sync Fields ────────────────────────────────────────
  @Column({ type: DataType.STRING(500), allowNull: true })
  public externalId?: string;

  @Column({
    type: DataType.ENUM('google', 'outlook'),
    allowNull: true
  })
  public externalProvider?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public lastSyncedAt?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user?: User;
}

export default CalendarEvent;
