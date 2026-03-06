import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import Lead from '../../lead/leadModel';
import Opportunity from '../../opportunity/opportunityModel';
import User from '../../user/userModel';
import Tenant from '../../tenant/tenantModel';
import { ContractTypeEnums, DealStageEnums } from '../dealEnum';
import DealDelivery from './dealDeliveryModel';
import Invoice from './invoiceMode';
import Client from '../../client/clientModel';
import DealUsers from './deal_UsersModel';

@Table({
  tableName: 'deals',
  modelName: 'Deal',
  timestamps: true
})
class Deal extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public companyName?: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public price!: number;

  @Column({ type: DataType.ENUM(...Object.values(ContractTypeEnums)), allowNull: false })
  public contractType!: ContractTypeEnums;

  @Column({ type: DataType.DATE, allowNull: true })
  signatureDate!: Date;

  @Column({ type: DataType.ENUM(...Object.values(DealStageEnums)), allowNull: true })
  stage!: DealStageEnums;

  @Column({ type: DataType.FLOAT, allowNull: true, defaultValue: 0 })
  public probability?: number;

  @Column({ type: DataType.STRING, allowNull: true })
  cancelledReason?: string;

  @BelongsToMany(() => User, {
    through: () => DealUsers, // Join table
    as: 'users' // Alias for association
  })
  public users!: User[];

  @ForeignKey(() => Lead)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  public leadId?: string;

  @BelongsTo(() => Lead, { as: 'lead' })
  public lead!: Lead;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  public clientId?: string;

  @BelongsTo(() => Client, { as: 'client' })
  public client!: Client;

  @ForeignKey(() => Opportunity)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  public opportunityId?: string;

  @BelongsTo(() => Opportunity, { as: 'opportunity' })
  public opportunity!: Opportunity;

  @HasMany(() => Invoice, { as: 'invoice', onDelete: 'CASCADE' })
  public invoice?: Invoice[];
  @HasMany(() => DealDelivery, { as: 'deliveryDetails', onDelete: 'CASCADE' })
  public deliveryDetails?: DealDelivery[];

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: true })
  public tenantId?: string;

  @BelongsTo(() => Tenant)
  public tenant!: Tenant;
}

export default Deal;
