import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Client from '../client/clientModel';

@Table({ tableName: 'abandoned_carts', timestamps: true })
export default class AbandonedCart extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  public customerId!: string;

  @BelongsTo(() => Client, { foreignKey: 'customerId', as: 'customer' })
  public customer?: Client;

  @Column({ type: DataType.STRING(200), allowNull: true })
  public customerEmail?: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  public items!: Array<{ productId: string; name: string; quantity: number; price: number }>;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  public totalValue!: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ABANDONED' })
  public recoveryStatus!: 'ABANDONED' | 'REMINDED' | 'RECOVERED' | 'EXPIRED';

  @Column({ type: DataType.DATE, allowNull: true })
  public lastReminder?: Date;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public reminderCount!: number;

  @Column({ type: DataType.DATE, allowNull: true })
  public recoveredAt?: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  public abandonedAt!: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
