import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import PayrollRun from './payrollRunModel';
import Employee from '../../hr/models/employeeModel';

@Table({
  tableName: 'payslips',
  modelName: 'Payslip',
  timestamps: true
})
class Payslip extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @ForeignKey(() => PayrollRun)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  public payrollRunId!: string;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  public employeeId!: string;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false
  })
  public basicSalary!: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0
  })
  public housingAllowance!: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0
  })
  public transportAllowance!: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0
  })
  public otherAllowances!: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false
  })
  public grossSalary!: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false
  })
  public gosiDeduction!: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0
  })
  public absentDeduction!: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0
  })
  public loanDeduction!: number;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(12, 2),
    defaultValue: 0
  })
  public otherDeductions!: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false
  })
  public totalDeductions!: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false
  })
  public netSalary!: number;

  @Default(30)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 30
  })
  public workingDays!: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  public absentDays!: number;

  @BelongsTo(() => PayrollRun, { as: 'payrollRun', foreignKey: 'payrollRunId' })
  public payrollRun?: PayrollRun;

  @BelongsTo(() => Employee, { as: 'employee', foreignKey: 'employeeId' })
  public employee?: Employee;
}

export default Payslip;
