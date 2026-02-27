import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Client from '../client/clientModel';

@Table({ tableName: 'mkt_social_profiles', timestamps: true })
export default class SocialProfile extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: true })
  public clientId?: string;

  @BelongsTo(() => Client, { foreignKey: 'clientId', as: 'client' })
  public client?: Client;

  @Column({ type: DataType.STRING(50), allowNull: false })
  public platform!: 'TWITTER' | 'LINKEDIN' | 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE';

  @Column({ type: DataType.STRING(100), allowNull: false })
  public handle!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public profileUrl?: string;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  public followers?: number;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  public engagement?: number;

  @Column({ type: DataType.STRING(20), allowNull: true })
  public sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

  @Column({ type: DataType.DATE, allowNull: true })
  public lastActivity?: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
