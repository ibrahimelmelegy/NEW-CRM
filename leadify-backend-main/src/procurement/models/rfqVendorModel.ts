import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import RFQ from './rfqModel';
import Vendor from '../../vendor/vendorModel';
import RFQVendorItem from './rfqVendorItemModel';

export enum RFQVendorStatusEnum {
    PENDING = 'Pending',
    VIEWED = 'Viewed',
    RESPONDED = 'Responded',
    DECLINED = 'Declined',
    WON = 'Won',
    LOST = 'Lost'
}

@Table({
    tableName: 'RFQVendors',
    modelName: 'RFQVendor',
    timestamps: true
})
class RFQVendor extends Model {
    @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
    public id!: string;

    @ForeignKey(() => RFQ)
    @Column({ type: DataType.UUID, allowNull: false })
    public rfqId!: string;

    @BelongsTo(() => RFQ)
    public rfq!: RFQ;

    @ForeignKey(() => Vendor)
    @Column({ type: DataType.INTEGER, allowNull: false })
    public vendorId!: number;

    @BelongsTo(() => Vendor)
    public vendor!: Vendor;

    @Column({ type: DataType.ENUM(...Object.values(RFQVendorStatusEnum)), defaultValue: RFQVendorStatusEnum.PENDING })
    public status!: string;

    @Column({ type: DataType.DECIMAL(15, 2), defaultValue: 0 })
    public totalOfferAmount!: number;

    @Column({ type: DataType.TEXT, allowNull: true })
    public notes?: string;

    @HasMany(() => RFQVendorItem)
    public items!: RFQVendorItem[];
}

export default RFQVendor;
