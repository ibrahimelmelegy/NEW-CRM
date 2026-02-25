import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import CustomerSubscription from './customerSubscriptionModel';

export enum SubscriptionEventTypeEnum {
  CREATED = 'CREATED',
  RENEWED = 'RENEWED',
  UPGRADED = 'UPGRADED',
  DOWNGRADED = 'DOWNGRADED',
  CANCELLED = 'CANCELLED',
  PAYMENT_FAILED = 'PAYMENT_FAILED'
}

@Table({
  tableName: 'subscription_events',
  modelName: 'SubscriptionEvent',
  timestamps: true
})
class SubscriptionEvent extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @ForeignKey(() => CustomerSubscription)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  public subscriptionId!: string;

  @Column({
    type: DataType.ENUM(...Object.values(SubscriptionEventTypeEnum)),
    allowNull: false
  })
  public type!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  public metadata?: Record<string, any>;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  public date!: Date;

  @BelongsTo(() => CustomerSubscription, { as: 'subscription' })
  public subscription!: CustomerSubscription;
}

export default SubscriptionEvent;
