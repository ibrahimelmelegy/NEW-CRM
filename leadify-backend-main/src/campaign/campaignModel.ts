import { Column, DataType, Default, ForeignKey, BelongsTo, HasMany, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';
import { CampaignStatus } from './campaignEnum';
import CampaignRecipient from './campaignRecipientModel';

@Table({
  tableName: 'campaigns',
  modelName: 'Campaign',
  timestamps: true
})
class Campaign extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public subject!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public htmlContent?: string;

  @Default(CampaignStatus.DRAFT)
  @Column({ type: DataType.ENUM(...Object.values(CampaignStatus)), allowNull: false })
  public status!: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public scheduledAt?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public sentAt?: Date;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user!: User;

  @HasMany(() => CampaignRecipient, { onDelete: 'CASCADE' })
  public recipients?: CampaignRecipient[];
}

export default Campaign;
