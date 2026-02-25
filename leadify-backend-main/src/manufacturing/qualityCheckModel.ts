import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import WorkOrder from './workOrderModel';

@Table({
  tableName: 'quality_checks',
  modelName: 'QualityCheck',
  timestamps: true,
  indexes: [{ fields: ['tenantId'] }, { fields: ['workOrderId'] }]
})
class QualityCheck extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => WorkOrder)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public workOrderId?: number;

  @BelongsTo(() => WorkOrder, { foreignKey: 'workOrderId', as: 'workOrder' })
  public workOrder?: WorkOrder;

  @Column({ type: DataType.STRING(30), allowNull: true })
  public woNumber?: string;

  @Column({ type: DataType.STRING(200), allowNull: true })
  public product?: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public inspector?: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public inspected!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public passed!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public defects!: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'PENDING' })
  public result!: 'PASS' | 'FAIL' | 'PENDING';

  @Column({ type: DataType.STRING(100), allowNull: true })
  public tenantId?: string;
}

export default QualityCheck;
