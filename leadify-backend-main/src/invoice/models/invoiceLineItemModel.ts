import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import Invoice from '../../deal/model/invoiceMode';

@Table({
    tableName: 'invoice_line_items',
    modelName: 'InvoiceLineItem',
    timestamps: true
})
class InvoiceLineItem extends Model {
    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    public id!: string;

    @ForeignKey(() => Invoice)
    @Column({ type: DataType.INTEGER, allowNull: false })
    public invoiceId!: number;

    @Column({ type: DataType.UUID, allowNull: true })
    public productId?: string;

    @Column({ type: DataType.STRING, allowNull: false })
    public description!: string;

    @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 1 })
    public quantity!: number;

    @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
    public unitPrice!: number;

    @Column({ type: DataType.DECIMAL(5, 2), defaultValue: 0 })
    public taxRate!: number;

    @Column({ type: DataType.DECIMAL(5, 2), defaultValue: 0 })
    public discountRate!: number;

    @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
    public lineTotal!: number;

    @BelongsTo(() => Invoice, { as: 'invoice' })
    public invoice!: Invoice;
}

export default InvoiceLineItem;
