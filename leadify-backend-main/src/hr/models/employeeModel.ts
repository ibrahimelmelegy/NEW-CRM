import { Column, DataType, Default, ForeignKey, BelongsTo, HasMany, Model, Table } from 'sequelize-typescript';
import User from '../../user/userModel';
import Department from './departmentModel';
import EmployeeDocument from './employeeDocumentModel';

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN'
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
  PROBATION = 'PROBATION'
}

export enum SalaryFrequency {
  MONTHLY = 'MONTHLY',
  BIWEEKLY = 'BIWEEKLY'
}

@Table({
  tableName: 'employees',
  modelName: 'Employee',
  timestamps: true
})
class Employee extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false
  })
  public employeeNumber!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  public userId?: number;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  public firstName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  public lastName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  public email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public phone?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  public hireDate!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  public terminationDate?: Date;

  @ForeignKey(() => Department)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  public departmentId?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public jobTitle?: string;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  public managerId?: string;

  @Default(EmploymentType.FULL_TIME)
  @Column({
    type: DataType.ENUM(...Object.values(EmploymentType)),
    allowNull: false
  })
  public employmentType!: string;

  @Default(EmployeeStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(EmployeeStatus)),
    allowNull: false
  })
  public status!: string;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true
  })
  public salary?: number;

  @Default(SalaryFrequency.MONTHLY)
  @Column({
    type: DataType.ENUM(...Object.values(SalaryFrequency)),
    allowNull: true
  })
  public salaryFrequency?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public bankName?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public bankAccount?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public iqamaNumber?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public nationalId?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public passportNumber?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public tenantId?: string;

  @BelongsTo(() => Department, { as: 'department', foreignKey: 'departmentId' })
  public department?: Department;

  @BelongsTo(() => User, { as: 'user', foreignKey: 'userId' })
  public user?: User;

  @BelongsTo(() => Employee, { as: 'manager', foreignKey: 'managerId' })
  public manager?: Employee;

  @HasMany(() => Employee, { as: 'directReports', foreignKey: 'managerId' })
  public directReports?: Employee[];

  @HasMany(() => EmployeeDocument, { as: 'documents', foreignKey: 'employeeId' })
  public documents?: EmployeeDocument[];
}

export default Employee;
