import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import Client from '../../client/clientModel';
import SubscriptionPlan from './subscriptionPlanModel';
import SubscriptionEvent from './subscriptionEventModel';

export enum SubscriptionStatusEnum {
    TRIAL = 'TRIAL',
    ACTIVE = 'ACTIVE',
    PAST_DUE = 'PAST_DUE',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED'
}

@Table({
    tableName: 'customer_subscriptions',
    modelName: 'CustomerSubscription',
    timestamps: true
})
class CustomerSubscription extends Model {
    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    public id!: string;

    @ForeignKey(() => Client)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    public clientId!: string;

    @ForeignKey(() => SubscriptionPlan)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    public planId!: string;

    @Column({
        type: DataType.ENUM(...Object.values(SubscriptionStatusEnum)),
        allowNull: false,
        defaultValue: SubscriptionStatusEnum.ACTIVE
    })
    public status!: string;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    public startDate!: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    public currentPeriodStart!: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    public currentPeriodEnd!: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    public nextBillingDate?: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    public cancelledAt?: Date;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    public cancelReason?: string;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    public tenantId?: string;

    @BelongsTo(() => Client, { as: 'client' })
    public client!: Client;

    @BelongsTo(() => SubscriptionPlan, { as: 'plan' })
    public plan!: SubscriptionPlan;

    @HasMany(() => SubscriptionEvent, { as: 'events' })
    public events!: SubscriptionEvent[];
}

export default CustomerSubscription;
