import {
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  Model,
  Table
} from 'sequelize-typescript';
import CommActivity from './activityModel';

export enum CallOutcome {
  CONNECTED = 'CONNECTED',
  NO_ANSWER = 'NO_ANSWER',
  VOICEMAIL = 'VOICEMAIL',
  BUSY = 'BUSY',
  LEFT_MESSAGE = 'LEFT_MESSAGE'
}

@Table({
  tableName: 'comm_call_logs',
  modelName: 'CommCallLog',
  timestamps: true
})
class CommCallLog extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => CommActivity)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public activityId!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  public phoneNumber!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public duration!: number;

  @Column({
    type: DataType.ENUM(...Object.values(CallOutcome)),
    allowNull: false
  })
  public outcome!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public recordingUrl?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @BelongsTo(() => CommActivity, { as: 'activity', foreignKey: 'activityId' })
  public activity?: CommActivity;
}

export default CommCallLog;
