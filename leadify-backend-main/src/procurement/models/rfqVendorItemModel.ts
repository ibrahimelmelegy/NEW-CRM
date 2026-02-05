import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import RFQVendor from './rfqVendorModel';
import RFQItem from './rfqItemModel';

@Table({
    tableName: 'RFQVendorItems',
    modelName: 'RFQVendorItem',
    timestamps: true
})
class RFQVendorItem extends Model {
    @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
    public id!: string;

    @ForeignKey(() => RFQVendor)
    @Column({ type: DataType.UUID, allowNull: false })
    public rfqVendorId!: string;

    @BelongsTo(() => RFQVendor)
    public rfqVendor!: RFQVendor;

    @ForeignKey(() => RFQItem)
    @Column({ type: DataType.UUID, allowNull: false })
    public rfqItemId!: string;

    @BelongsTo(() => RFQItem)
    public rfqItem!: RFQItem;

    @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
    public price!: number;

    @Column({ type: DataType.TEXT, allowNull: true })
    public remarks?: string;
}

export default RFQVendorItem;
