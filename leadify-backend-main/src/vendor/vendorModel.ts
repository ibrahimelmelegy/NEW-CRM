import { Column, DataType, Model, Table, HasMany } from 'sequelize-typescript';
import PurchaseOrder from '../procurement/models/purchaseOrderModel';

export enum VendorTypeEnum {
    Vendor = 'Vendor',
    Distributor = 'Distributor',
    LocalSupplier = 'LocalSupplier',
    Showroom = 'Showroom'
}

@Table({
    tableName: 'Vendors',
    modelName: 'Vendor',
    timestamps: true
})
class Vendor extends Model {
    @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
    public id!: number;

    @Column({ type: DataType.STRING, allowNull: true })
    public name!: string;

    @Column({ type: DataType.ENUM(...Object.values(VendorTypeEnum)), defaultValue: VendorTypeEnum.Vendor })
    public type!: VendorTypeEnum;

    @Column({ type: DataType.STRING, allowNull: true })
    public firstName?: string;

    @Column({ type: DataType.STRING, allowNull: true })
    public lastName?: string;

    @Column({ type: DataType.STRING, allowNull: true })
    public phone?: string;

    @Column({ type: DataType.STRING, allowNull: true })
    public email?: string;

    @Column({ type: DataType.STRING, allowNull: true })
    public taxId?: string;

    @Column({ type: DataType.JSONB, allowNull: true })
    public address?: {
        street?: string;
        street2?: string;
        city?: string;
        state?: string;
        zip?: string;
    };

    @Column({ type: DataType.JSONB, allowNull: true })
    public principalContact?: {
        firstName?: string;
        lastName?: string;
    };

    @Column({ type: DataType.STRING, allowNull: true })
    public commercialRegistration?: string;

    @Column({ type: DataType.STRING, allowNull: true })
    public taxFile?: string;

    @Column({ type: DataType.INTEGER, allowNull: true })
    public evaluation?: number;

    @Column({ type: DataType.ENUM('Cash', 'Credit'), defaultValue: 'Cash' })
    public defaultPaymentMethod!: string;

    @Column({ type: DataType.ENUM('Hardware', 'Software', 'Both'), allowNull: true })
    public serviceType?: string;

    @Column({ type: DataType.JSONB, allowNull: true })
    public brands?: string[];

    @HasMany(() => PurchaseOrder)
    public purchaseOrders!: PurchaseOrder[];
}

export default Vendor;
