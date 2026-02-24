import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import Client from '../../client/clientModel';

export enum PaymentMethodEnum {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  CHECK = 'CHECK',
  ONLINE = 'ONLINE'
}

export enum PaymentStatusEnum {
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  VOIDED = 'VOIDED'
}

@Table({
  tableName: 'payments',
  modelName: 'Payment',
  timestamps: true
})
class Payment extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false
  })
  public paymentNumber!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  public invoiceId?: number;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  public clientId!: string;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false
  })
  public amount!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  public date!: Date;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentMethodEnum)),
    allowNull: false
  })
  public method!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public reference?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  public notes?: string;

  @Column({
    type: DataType.ENUM(...Object.values(PaymentStatusEnum)),
    allowNull: false,
    defaultValue: PaymentStatusEnum.COMPLETED
  })
  public status!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public tenantId?: string;

  @BelongsTo(() => Client, { as: 'client' })
  public client?: Client;
}

export default Payment;
