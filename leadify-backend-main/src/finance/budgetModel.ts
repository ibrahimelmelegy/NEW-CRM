import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import ExpenseCategory from './expenseCategoryModel';

@Table({
  tableName: 'budgets',
  modelName: 'Budget',
  timestamps: true
})
class Budget extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public amount!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  public spent!: number;

  @ForeignKey(() => ExpenseCategory)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public categoryId?: number;

  @BelongsTo(() => ExpenseCategory)
  public category?: ExpenseCategory;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  public startDate!: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  public endDate!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;
}

export default Budget;
