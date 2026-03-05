import { Column, DataType, Default, Model, Table } from 'sequelize-typescript';

export enum SenderType {
  AGENT = 'AGENT',
  CUSTOMER = 'CUSTOMER',
  SYSTEM = 'SYSTEM'
}

@Table({
  tableName: 'ticket_messages',
  modelName: 'TicketMessage',
  timestamps: true
})
class TicketMessage extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  // Foreign key to Ticket - association defined via @HasMany on Ticket model
  @Column({ type: DataType.UUID, allowNull: false })
  public ticketId!: string;

  @Column({ type: DataType.UUID, allowNull: true })
  public senderId?: string;

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
}

export default TicketMessage;
