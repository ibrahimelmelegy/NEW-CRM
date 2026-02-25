import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { ActivityModelClass } from './activities';
import PurchaseOrder from '../../procurement/models/purchaseOrderModel';

@Table({
  tableName: 'purchaseOrderActivities',
  modelName: 'PurchaseOrderActivity',
  timestamps: true
})
export class PurchaseOrderActivity extends ActivityModelClass {
  @ForeignKey(() => PurchaseOrder)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public purchaseOrderId!: number;

  @BelongsTo(() => PurchaseOrder, { as: 'purchaseOrder' })
  public purchaseOrder!: PurchaseOrder;
}
