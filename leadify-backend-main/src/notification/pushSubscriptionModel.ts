import { Column, DataType, ForeignKey, BelongsTo, Model, Table, Index } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'push_subscriptions',
  modelName: 'PushSubscription',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['endpoint'], unique: true }
  ]
})
export default class PushSubscription extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  userId!: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    unique: true
  })
  endpoint!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false
  })
  subscription!: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };

  @BelongsTo(() => User, { as: 'user' })
  user!: User;
}
