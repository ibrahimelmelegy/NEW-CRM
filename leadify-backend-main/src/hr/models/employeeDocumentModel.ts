import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import Employee from './employeeModel';

export enum DocumentType {
  CONTRACT = 'CONTRACT',
  ID = 'ID',
  CERTIFICATION = 'CERTIFICATION',
  VISA = 'VISA',
  MEDICAL = 'MEDICAL'
}

@Table({
  tableName: 'employee_documents',
  modelName: 'EmployeeDocument',
  timestamps: true
})
class EmployeeDocument extends Model {
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
    type: DataType.STRING,
    allowNull: false
  })
  public name!: string;

  @Column({
    type: DataType.ENUM(...Object.values(DocumentType)),
    allowNull: false
  })
  public type!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  public fileUrl!: string;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  public expiryDate?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  public notes?: string;

  @BelongsTo(() => Employee, { as: 'employee', foreignKey: 'employeeId' })
  public employee?: Employee;
}

export default EmployeeDocument;
