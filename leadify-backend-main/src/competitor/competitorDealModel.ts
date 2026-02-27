import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Competitor from './competitorModel';
import Deal from '../deal/model/dealModel';

@Table({ tableName: 'sales_competitor_deals', timestamps: true })
export default class CompetitorDeal extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => Competitor)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public competitorId!: number;

  @BelongsTo(() => Competitor, { foreignKey: 'competitorId', as: 'competitor' })
  public competitor?: Competitor;

  @ForeignKey(() => Deal)
  @Column({ type: DataType.UUID, allowNull: false })
  public dealId!: string;

  @BelongsTo(() => Deal, { foreignKey: 'dealId', as: 'deal' })
  public deal?: Deal;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'PENDING' })
  public outcome!: 'WON' | 'LOST' | 'PENDING';

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
