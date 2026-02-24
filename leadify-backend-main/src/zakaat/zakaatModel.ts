import { BelongsTo, Column, DataType, Default, ForeignKey, Index, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

export interface ZakaatBreakdown {
  cashAndBank: number;
  receivables: number;
  inventory: number;
  investments: number;
  prepaidExpenses: number;
  fixedAssets: number;
  liabilities: number;
}

@Table({
  tableName: 'zakaat_assessments',
  modelName: 'ZakaatAssessment',
  timestamps: true
})
class ZakaatAssessment extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Index
  @Column({ type: DataType.STRING(10), allowNull: false })
  public fiscalYear!: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public companyId?: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  public assessmentDate!: string;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  public totalAssets!: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  public exemptAssets!: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  public zakaatableBase!: number;

  @Default(0.025)
  @Column({ type: DataType.DECIMAL(5, 4), allowNull: false, defaultValue: 0.025 })
  public zakaatRate!: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  public zakaatDue!: number;

  @Index
  @Default('DRAFT')
  @Column({
    type: DataType.ENUM('DRAFT', 'CALCULATED', 'SUBMITTED', 'PAID'),
    allowNull: false,
    defaultValue: 'DRAFT'
  })
  public status!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public breakdown?: ZakaatBreakdown;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public createdBy?: number;

  @BelongsTo(() => User)
  public creator?: User;
}

export default ZakaatAssessment;
