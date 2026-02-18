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

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public allDay!: boolean;

  @Column({ type: DataType.STRING(7), allowNull: true })
  public color?: string;

  @Column({ type: DataType.ENUM('MEETING', 'CALL', 'TASK', 'REMINDER', 'OTHER'), allowNull: false, defaultValue: 'OTHER' })
  public eventType!: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  public location?: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  public recurrence?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user?: User;
}

export default CalendarEvent;
