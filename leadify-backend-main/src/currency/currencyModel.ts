import { Column, DataType, Default, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'currencies',
  modelName: 'Currency',
  timestamps: true
})
class Currency extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(3), allowNull: false, unique: true })
  public code!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING(5), allowNull: true })
  public symbol?: string;

  @Column({ type: DataType.DECIMAL(12, 6), allowNull: false, defaultValue: 1 })
  public exchangeRate!: number;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isDefault!: boolean;
}

export default Currency;
