import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({ tableName: 'user_streaks', modelName: 'UserStreak', timestamps: true })
class UserStreak extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  public userId!: number;

  @BelongsTo(() => User)
  public user?: User;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public currentStreak!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public longestStreak!: number;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public lastActivityDate?: string;
}

export default UserStreak;
