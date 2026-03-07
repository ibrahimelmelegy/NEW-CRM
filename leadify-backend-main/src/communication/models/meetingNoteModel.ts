import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import CommActivity from './activityModel';

export enum MeetingType {
  INTERNAL = 'INTERNAL',
  CLIENT = 'CLIENT',
  TEAM = 'TEAM',
  BOARD = 'BOARD',
  SALES_CALL = 'SALES_CALL',
  SPRINT_REVIEW = 'SPRINT_REVIEW',
  CLIENT_ONBOARDING = 'CLIENT_ONBOARDING',
  ONE_ON_ONE = 'ONE_ON_ONE',
  STANDUP = 'STANDUP'
}

@Table({
  tableName: 'comm_meeting_notes',
  modelName: 'CommMeetingNote',
  timestamps: true
})
class CommMeetingNote extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => CommActivity)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public activityId!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  public title!: string;

  @Column({
    type: DataType.ENUM(...Object.values(MeetingType)),
    allowNull: false,
    defaultValue: MeetingType.INTERNAL
  })
  public meetingType!: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public meetingDate?: Date;

  @Column({ type: DataType.JSONB, allowNull: true })
  public attendees?: Array<{ id?: number; name: string; email?: string; type: string }>;

  @Column({ type: DataType.TEXT, allowNull: true })
  public minutes?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public actionItems?: Array<{
    task: string;
    assigneeId?: number;
    assigneeName?: string;
    dueDate?: string;
    completed: boolean;
    linkedTaskId?: number;
  }>;

  @Column({ type: DataType.JSONB, allowNull: true })
  public attachments?: Array<{ name: string; url: string; type: string; size: number }>;

  @Column({ type: DataType.STRING, allowNull: true })
  public calendarEventId?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public templateId?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public followUps?: Array<{ description: string; dueDate: string; status: string; reminderId?: number }>;

  @BelongsTo(() => CommActivity, { as: 'activity', foreignKey: 'activityId' })
  public activity?: CommActivity;
}

export default CommMeetingNote;
