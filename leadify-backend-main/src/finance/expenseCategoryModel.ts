import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'expense_categories',
  modelName: 'ExpenseCategory',
  timestamps: true
})
class ExpenseCategory extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false, unique: true })
  public name!: string;

  @Column({ type: DataType.STRING(7), allowNull: true })
  public color?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;
}

export default ExpenseCategory;
