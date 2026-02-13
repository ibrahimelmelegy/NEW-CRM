import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import Campaign from './campaignModel';
import { RecipientStatus } from './campaignEnum';

@Table({
  tableName: 'campaign_recipients',
  modelName: 'CampaignRecipient',
  timestamps: true
})
class CampaignRecipient extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @ForeignKey(() => Campaign)
  @Column({ type: DataType.UUID, allowNull: false })
  public campaignId!: string;

  @BelongsTo(() => Campaign)
  public campaign!: Campaign;

  @Column({ type: DataType.STRING, allowNull: false })
  public contactEmail!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public contactName?: string;

  @Default(RecipientStatus.PENDING)
  @Column({ type: DataType.ENUM(...Object.values(RecipientStatus)), allowNull: false })
  public status!: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public openedAt?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public clickedAt?: Date;
}

export default CampaignRecipient;
