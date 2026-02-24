import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table
} from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'daily_habits',
  modelName: 'DailyHabit',
  timestamps: true,
  indexes: [
    { fields: ['userId'] }
  ]
})
class DailyHabit extends Model {
  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true
  })
  public id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public userId!: number;

  @BelongsTo(() => User, { as: 'user', foreignKey: 'userId' })
  public user?: User;

  @Column({
    type: DataType.STRING(200),
    allowNull: false
  })
  public name!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    defaultValue: 'ph:check-circle'
  })
  public icon?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0
  })
  public streak!: number;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: []
  })
  public completedDates!: string[];
}

export default DailyHabit;
