import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'time_entries',
  modelName: 'TimeEntry',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['entityType', 'entityId'] },
    { fields: ['startTime'] }
  ]
})
class TimeEntry extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user!: User;

  @Column({ type: DataType.STRING, allowNull: true })
  public entityType?: string;

  @Column({ type: DataType.UUID, allowNull: true })
  public entityId?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public entityName?: string;

  @Column({ type: DataType.DATE, allowNull: false })
  public startTime!: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public endTime?: Date;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public duration?: number; // in seconds

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;
}

export default TimeEntry;
