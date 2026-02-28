import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'attribution_touchpoints', timestamps: true })
export default class Touchpoint extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.UUID, allowNull: false })
  public dealId!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  public channel!: string; // e.g. 'ORGANIC_SEARCH', 'PAID_ADS', 'EMAIL', 'SOCIAL', 'REFERRAL', 'DIRECT'

  @Column({ type: DataType.DATE, allowNull: false })
  public touchpointDate!: Date;

  @Column({ type: DataType.STRING(200), allowNull: true })
  public campaign?: string;

  @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
  public creditPercent?: number; // 0-100, assigned after attribution calculation

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  public creditValue?: number; // dollar value attributed to this touchpoint

  @Column({ type: DataType.STRING(20), allowNull: true })
  public interactionType?: 'CLICK' | 'VIEW' | 'FORM' | 'CALL' | 'MEETING' | 'DOWNLOAD';

  @Column({ type: DataType.STRING(500), allowNull: true })
  public url?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
