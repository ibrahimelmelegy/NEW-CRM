import {
  Column,
  DataType,
  Default,
  ForeignKey,
  BelongsTo,
  Model,
  Table
} from 'sequelize-typescript';
import Ticket from './ticketModel';

export enum SenderType {
  AGENT = 'AGENT',
  CUSTOMER = 'CUSTOMER'
}

@Table({
  tableName: 'ticket_messages',
  modelName: 'TicketMessage',
  timestamps: true
})
class TicketMessage extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @ForeignKey(() => Ticket)
  @Column({ type: DataType.UUID, allowNull: false })
  public ticketId!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  public senderId!: string;

  @Default(SenderType.AGENT)
  @Column({ type: DataType.STRING, allowNull: false })
  public senderType!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  public body!: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public isInternal!: boolean;

  @Column({ type: DataType.JSON, allowNull: true })
  public attachments?: Array<{ name: string; url: string }>;

  @BelongsTo(() => Ticket, { as: 'ticket', foreignKey: 'ticketId' })
  public ticket?: Ticket;
}

export default TicketMessage;
