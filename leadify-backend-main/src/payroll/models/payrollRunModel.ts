import { Column, DataType, Default, HasMany, Model, Table } from 'sequelize-typescript';
import Payslip from './payslipModel';

export enum PayrollRunStatus {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PROCESSED = 'PROCESSED'
}

@Table({
  tableName: 'payroll_runs',
  modelName: 'PayrollRun',
  timestamps: true
})
class PayrollRun extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public month!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public year!: number;

  @Default(PayrollRunStatus.DRAFT)
  @Column({
    type: DataType.ENUM(...Object.values(PayrollRunStatus)),
    allowNull: false,
    defaultValue: PayrollRunStatus.DRAFT
  })
  public status!: string;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(14, 2),
    defaultValue: 0
  })
  public totalGross!: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(14, 2),
    defaultValue: 0
  })
  public totalDeductions!: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(14, 2),
    defaultValue: 0
  })
  public totalNet!: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  public employeeCount!: number;

  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  public processedBy?: string;

  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  public approvedBy?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public tenantId?: string;

  @HasMany(() => Payslip, { as: 'payslips', foreignKey: 'payrollRunId' })
  public payslips?: Payslip[];
}

export default PayrollRun;
