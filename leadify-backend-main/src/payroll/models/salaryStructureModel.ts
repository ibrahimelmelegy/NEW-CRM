import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import Employee from '../../hr/models/employeeModel';

@Table({
  tableName: 'salary_structures',
  modelName: 'SalaryStructure',
  timestamps: true
})
class SalaryStructure extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

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

  @Default(0.0975)
  @Column({
    type: DataType.DECIMAL(5, 4),
    defaultValue: 0.0975
  })
  public gosiEmployeeRate!: number;

  @Default(0.1175)
  @Column({
    type: DataType.DECIMAL(5, 4),
    defaultValue: 0.1175
  })
  public gosiEmployerRate!: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false
  })
  public effectiveDate!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public tenantId?: string;

  @BelongsTo(() => Employee, { as: 'employee', foreignKey: 'employeeId' })
  public employee?: Employee;
}

export default SalaryStructure;
