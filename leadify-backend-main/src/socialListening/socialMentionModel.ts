import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({ tableName: 'social_mentions', timestamps: true })
export default class SocialMention extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false })
  public platform!: 'TWITTER' | 'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM' | 'REDDIT' | 'YOUTUBE' | 'OTHER';

  @Column({ type: DataType.TEXT, allowNull: false })
  public content!: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  public sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

  @Column({ type: DataType.FLOAT, allowNull: true })
  public sentimentScore?: number;

  @Column({ type: DataType.STRING(200), allowNull: true })
  public author?: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  public url?: string;

  @Column({ type: DataType.DATE, allowNull: false })
  public mentionDate!: Date;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  public reach?: number;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  public engagement?: number;

  @Column({ type: DataType.STRING(200), allowNull: true })
  public keyword?: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'NEW' })
  public status!: 'NEW' | 'REVIEWED' | 'RESPONDED' | 'ARCHIVED';

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public assignedTo?: number;

  @BelongsTo(() => User, { foreignKey: 'assignedTo', as: 'assignee' })
  public assignee?: User;
}
