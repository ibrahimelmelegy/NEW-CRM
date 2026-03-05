import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import PortalUser from './portalUserModel';

@Table({
  tableName: 'portal_ticket_messages',
  modelName: 'PortalTicketMessage',
  timestamps: true
})
class PortalTicketMessage extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  public id!: number;

  // Foreign key to SupportTicket - association defined via @HasMany on SupportTicket model
  @Column({ type: DataType.UUID, allowNull: false })
  public ticketId!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  public message!: string;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'client' })
  public senderType!: string; // 'client' or 'staff'

  @ForeignKey(() => PortalUser)
  @Column({ type: DataType.UUID, allowNull: true })
  public portalUserId?: string;

  @BelongsTo(() => PortalUser)
  public portalUser?: PortalUser;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public staffUserId?: number;
}

export default PortalTicketMessage;
