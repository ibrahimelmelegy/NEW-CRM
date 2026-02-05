import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import PurchaseOrder from './purchaseOrderModel';

@Table({
    tableName: 'PurchaseOrderItems',
    modelName: 'PurchaseOrderItem',
    timestamps: true
})
class PurchaseOrderItem extends Model {
    @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
    public id!: number;

    @ForeignKey(() => PurchaseOrder)
    @Column({ type: DataType.INTEGER, allowNull: false })
    public purchaseOrderId!: number;

    @BelongsTo(() => PurchaseOrder)
    public purchaseOrder!: PurchaseOrder;

    @Column({ type: DataType.STRING, allowNull: false })
    public description!: string;

    @Column({ type: DataType.INTEGER, allowNull: false })
    public quantity!: number;

    @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
    public unitPrice!: number;

    @Column({ type: DataType.DECIMAL(5, 2), defaultValue: 0 })
    public tax!: number;
}

export default PurchaseOrderItem;
