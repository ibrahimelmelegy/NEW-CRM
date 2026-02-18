import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';
import ExpenseCategory from './expenseCategoryModel';

@Table({
  tableName: 'expenses',
  modelName: 'Expense',
  timestamps: true
})
class Expense extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(500), allowNull: false })
  public description!: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public amount!: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  public date!: string;

  @ForeignKey(() => ExpenseCategory)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public categoryId?: number;

  @BelongsTo(() => ExpenseCategory)
  public category?: ExpenseCategory;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public vendor?: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public receiptNumber?: string;

  @Column({ type: DataType.ENUM('PENDING', 'APPROVED', 'REJECTED'), allowNull: false, defaultValue: 'PENDING' })
  public status!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public submittedBy?: number;

  @BelongsTo(() => User)
  public submitter?: User;
}

export default Expense;
