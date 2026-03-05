import { Column, DataType, Default, ForeignKey, BelongsTo, HasMany, Model, Table } from 'sequelize-typescript';
import PortalUser from './portalUserModel';
import PortalTicketMessage from './ticketMessageModel';
import { TicketStatus, TicketPriority } from './portalEnum';

@Table({
  tableName: 'support_tickets',
  modelName: 'SupportTicket',
  timestamps: true
})
class SupportTicket extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public subject!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  public description!: string;

  @Default(TicketStatus.OPEN)
  @Column({ type: DataType.ENUM(...Object.values(TicketStatus)), allowNull: false })
  public status!: string;

  @Default(TicketPriority.MEDIUM)
  @Column({ type: DataType.ENUM(...Object.values(TicketPriority)), allowNull: false })
  public priority!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public response?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public respondedAt?: Date;

  @ForeignKey(() => PortalUser)
  @Column({ type: DataType.UUID, allowNull: false })
  public portalUserId!: string;

  @BelongsTo(() => PortalUser)
  public portalUser?: PortalUser;

  @HasMany(() => PortalTicketMessage, { foreignKey: 'ticketId' })
  public messages?: PortalTicketMessage[];
}

export default SupportTicket;
