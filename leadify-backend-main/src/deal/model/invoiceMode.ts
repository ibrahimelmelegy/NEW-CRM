import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import Deal from './dealModel';
import Tenant from '../../tenant/tenantModel';

@Table({
  tableName: 'invoices',
  modelName: 'Invoice',
  timestamps: true
})
class Invoice extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  public invoiceNumber!: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public amount!: number;

  @Column({ type: DataType.DATE, allowNull: true })
  invoiceDate?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  dueDate?: Date;

  @Column({ type: DataType.BOOLEAN, allowNull: true })
  collected?: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  collectedDate?: Date;

  @ForeignKey(() => Deal)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  public dealId!: string;

  @BelongsTo(() => Deal, { as: 'deal' })
  public deal!: Deal;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: true })
  public tenantId?: string;

  @BelongsTo(() => Tenant)
  public tenant!: Tenant;
}

export default Invoice;
