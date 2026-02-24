import { Column, DataType, Model, Table } from 'sequelize-typescript';

export enum FiscalYearStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

@Table({
  tableName: 'fiscal_years',
  modelName: 'FiscalYear',
  timestamps: true
})
class FiscalYear extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  public startDate!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  public endDate!: Date;

  @Column({
    type: DataType.ENUM(...Object.values(FiscalYearStatus)),
    defaultValue: FiscalYearStatus.OPEN
  })
  public status!: FiscalYearStatus;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

export default FiscalYear;
