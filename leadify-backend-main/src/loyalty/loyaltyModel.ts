import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Client from '../client/clientModel';

@Table({ tableName: 'mkt_loyalty_programs', timestamps: true })
export class LoyaltyProgram extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ACTIVE' })
  public status!: 'ACTIVE' | 'PAUSED' | 'ENDED';

  @Column({ type: DataType.JSONB, allowNull: true })
  public rules?: Record<string, any>;

  @Column({ type: DataType.JSONB, allowNull: true })
  public tiers?: Array<{ name: string; minPoints: number; benefits: string[] }>;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true, defaultValue: 1 })
  public pointsPerCurrency?: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

@Table({ tableName: 'mkt_loyalty_points', timestamps: true })
export class LoyaltyPoints extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  public clientId!: string;

  @BelongsTo(() => Client, { foreignKey: 'clientId', as: 'client' })
  public client?: Client;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public programId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public points!: number;

  @Column({ type: DataType.STRING(20), allowNull: false })
  public transactionType!: 'EARN' | 'REDEEM' | 'ADJUST' | 'EXPIRE';

  @Column({ type: DataType.STRING, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public referenceId?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
