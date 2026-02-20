import {
  Column,
  DataType,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  Model,
  Table
} from 'sequelize-typescript';
import User from '../../user/userModel';
import Client from '../../client/clientModel';
import TicketCategory from './ticketCategoryModel';
import TicketMessage from './ticketMessageModel';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TicketSource {
  EMAIL = 'EMAIL',
  PORTAL = 'PORTAL',
  PHONE = 'PHONE',
  CHAT = 'CHAT'
}

@Table({
  tableName: 'support_tickets_v2',
  modelName: 'Ticket',
  timestamps: true
})
class Ticket extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  public ticketNumber!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public subject!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Default(TicketStatus.OPEN)
  @Column({ type: DataType.ENUM(...Object.values(TicketStatus)), allowNull: false })
  public status!: string;

  @Default(TicketPriority.MEDIUM)
  @Column({ type: DataType.ENUM(...Object.values(TicketPriority)), allowNull: false })
  public priority!: string;

  @ForeignKey(() => TicketCategory)
  @Column({ type: DataType.UUID, allowNull: true })
  public categoryId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  public assignedTo?: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: true })
  public clientId?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public slaDeadline?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public firstResponseAt?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public resolvedAt?: Date;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public csatRating?: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public csatComment?: string;

  @Column({ type: DataType.JSON, allowNull: true })
  public tags?: string[];

  @Default(TicketSource.PORTAL)
  @Column({ type: DataType.ENUM(...Object.values(TicketSource)), allowNull: false })
  public source!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => TicketMessage, { as: 'messages', foreignKey: 'ticketId' })
  public messages?: TicketMessage[];

  @BelongsTo(() => User, { as: 'assignee', foreignKey: 'assignedTo' })
  public assignee?: User;

  @BelongsTo(() => Client, { as: 'client', foreignKey: 'clientId' })
  public client?: Client;

  @BelongsTo(() => TicketCategory, { as: 'category', foreignKey: 'categoryId' })
  public category?: TicketCategory;
}

export default Ticket;
