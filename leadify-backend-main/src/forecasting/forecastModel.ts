import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'forecast_periods',
  modelName: 'ForecastPeriod',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['period'] },
    { fields: ['startDate'] }
  ]
})
class ForecastPeriod extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  public userId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public period!: 'monthly' | 'quarterly' | 'yearly';

  @Column({ type: DataType.DATE, allowNull: false })
  public startDate!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  public endDate!: Date;

  @Default(0)
  @Column({ type: DataType.FLOAT, allowNull: false })
  public target!: number;

  @Default(0)
  @Column({ type: DataType.FLOAT, allowNull: false })
  public predicted!: number;

  @Default(0)
  @Column({ type: DataType.FLOAT, allowNull: false })
  public actual!: number;

  @Default(0)
  @Column({ type: DataType.FLOAT, allowNull: false })
  public closedWon!: number;

  @Default(0)
  @Column({ type: DataType.FLOAT, allowNull: false })
  public closedLost!: number;

  @Default(0)
  @Column({ type: DataType.FLOAT, allowNull: false })
  public pipeline!: number;

  @BelongsTo(() => User)
  public user!: User;
}

export default ForecastPeriod;
