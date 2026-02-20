import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import Employee from '../../hr/models/employeeModel';

export enum EOSStatus {
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PAID = 'PAID'
}

@Table({
  tableName: 'end_of_service',
  modelName: 'EndOfService',
  timestamps: true
})
class EndOfService extends Model {
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
    type: DataType.DATEONLY,
    allowNull: false
  })
  public calculationDate!: string;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false
  })
  public yearsOfService!: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false
  })
  public lastSalary!: number;

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false
  })
  public benefitAmount!: number;

  @Default(EOSStatus.CALCULATED)
  @Column({
    type: DataType.ENUM(...Object.values(EOSStatus)),
    allowNull: false,
    defaultValue: EOSStatus.CALCULATED
  })
  public status!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public tenantId?: string;

  @BelongsTo(() => Employee, { as: 'employee', foreignKey: 'employeeId' })
  public employee?: Employee;
}

export default EndOfService;
