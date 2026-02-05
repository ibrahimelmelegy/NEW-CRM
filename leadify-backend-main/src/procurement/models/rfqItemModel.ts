import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import RFQ from './rfqModel';
import RFQVendorItem from './rfqVendorItemModel';

@Table({
    tableName: 'RFQItems',
    modelName: 'RFQItem',
    timestamps: true
})
class RFQItem extends Model {
    @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
    public id!: string;

    @ForeignKey(() => RFQ)
    @Column({ type: DataType.UUID, allowNull: false })
    public rfqId!: string;

    @BelongsTo(() => RFQ)
    public rfq!: RFQ;

    @Column({ type: DataType.STRING, allowNull: false })
    public name!: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    public description?: string;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
    public quantity!: number;

    @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'PCS' })
    public uom!: string;

    @HasMany(() => RFQVendorItem)
    public vendorResponses!: RFQVendorItem[];
}

export default RFQItem;
