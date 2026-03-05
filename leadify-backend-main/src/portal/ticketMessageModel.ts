import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import SupportTicket from './supportTicketModel';
import PortalUser from './portalUserModel';

@Table({
  tableName: 'portal_ticket_messages',
  modelName: 'PortalTicketMessage',
  timestamps: true
})
class PortalTicketMessage extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => SupportTicket)
  @Column({ type: DataType.UUID, allowNull: false })
  public ticketId!: string;

  @BelongsTo(() => SupportTicket)
  public supportTicket?: SupportTicket;

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
