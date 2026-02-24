import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'attendance',
  modelName: 'Attendance',
  timestamps: true
})
class Attendance extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user?: User;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  public date!: string;

  @Column({ type: DataType.TIME, allowNull: true })
  public checkIn?: string;

  @Column({ type: DataType.TIME, allowNull: true })
  public checkOut?: string;

  @Column({ type: DataType.ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE'), allowNull: false, defaultValue: 'PRESENT' })
  public status!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;
}

export default Attendance;
