import { Column, DataType, Model, Table, ForeignKey, BelongsTo, Default } from 'sequelize-typescript';
import User from '../../user/userModel';

export enum OutgoingWebhookStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

@Table({
  tableName: 'outgoing_webhooks',
  modelName: 'OutgoingWebhook',
  timestamps: true
})
class OutgoingWebhook extends Model {
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
    type: DataType.STRING,
    allowNull: false
  })
  public url!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false
  })
  public events!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  public secret!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  public headers?: Record<string, string>;

  @Default(OutgoingWebhookStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(OutgoingWebhookStatus)),
    allowNull: false
  })
  public status!: OutgoingWebhookStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  public lastTriggeredAt?: Date;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public failureCount!: number;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  public createdBy?: number;

  @BelongsTo(() => User)
  public creator?: User;
}

export default OutgoingWebhook;
