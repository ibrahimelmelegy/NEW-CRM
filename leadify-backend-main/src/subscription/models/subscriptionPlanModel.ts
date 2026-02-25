import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import CustomerSubscription from './customerSubscriptionModel';

export enum BillingCycleEnum {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL'
}

@Table({
  tableName: 'subscription_plans',
  modelName: 'SubscriptionPlan',
  timestamps: true
})
class SubscriptionPlan extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  public name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  public description?: string;

  @Column({
    type: DataType.ENUM(...Object.values(BillingCycleEnum)),
    allowNull: false
  })
  public billingCycle!: string;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false
  })
  public price!: number;

  @Column({
    type: DataType.STRING,
    defaultValue: 'SAR'
  })
  public currency!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  public features?: string[];

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  public trialDays!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true
  })
  public isActive!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public tenantId?: string;

  @HasMany(() => CustomerSubscription, { as: 'subscriptions' })
  public subscriptions!: CustomerSubscription[];
}

export default SubscriptionPlan;
