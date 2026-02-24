import { Column, DataType, Model, Table } from 'sequelize-typescript';

export enum ReminderTypeEnum {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  FINAL = 'FINAL'
}

export enum ReminderMethodEnum {
  EMAIL = 'EMAIL',
  SMS = 'SMS'
}

export enum ReminderStatusEnum {
  SENT = 'SENT',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

@Table({
  tableName: 'payment_reminders',
  modelName: 'PaymentReminder',
  timestamps: true
})
class PaymentReminder extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public invoiceId!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  public sentAt!: Date;

  @Column({
    type: DataType.ENUM(...Object.values(ReminderTypeEnum)),
    allowNull: false
  })
  public type!: string;

  @Column({
    type: DataType.ENUM(...Object.values(ReminderMethodEnum)),
    allowNull: false
  })
  public method!: string;

  @Column({
    type: DataType.ENUM(...Object.values(ReminderStatusEnum)),
    allowNull: false,
    defaultValue: ReminderStatusEnum.PENDING
  })
  public status!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public tenantId?: string;
}

export default PaymentReminder;
