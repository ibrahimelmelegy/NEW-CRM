import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import Invoice from '../../deal/model/invoiceMode';

export enum CreditNoteStatusEnum {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  APPLIED = 'APPLIED',
  VOIDED = 'VOIDED'
}

@Table({
  tableName: 'credit_notes',
  modelName: 'CreditNote',
  timestamps: true
})
class CreditNote extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @ForeignKey(() => Invoice)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public invoiceId!: number;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  public creditNoteNumber!: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public amount!: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public reason?: string;

  @Column({
    type: DataType.ENUM(...Object.values(CreditNoteStatusEnum)),
    defaultValue: CreditNoteStatusEnum.DRAFT
  })
  public status!: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public date?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @BelongsTo(() => Invoice, { as: 'invoice' })
  public invoice!: Invoice;
}

export default CreditNote;
