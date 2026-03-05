import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import User from '../user/userModel';
import Client from '../client/clientModel';

@Table({ tableName: 'comm_chat_conversations', timestamps: true })
export class ChatConversation extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: true })
  public clientId?: string;

  @BelongsTo(() => Client, { foreignKey: 'clientId', as: 'client' })
  public client?: Client;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public staffId?: number;

  @BelongsTo(() => User, { foreignKey: 'staffId', as: 'staff' })
  public staff?: User;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'OPEN' })
  public status!: 'OPEN' | 'ACTIVE' | 'WAITING' | 'RESOLVED' | 'CLOSED';

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'WEB' })
  public channel!: 'WEB' | 'MOBILE' | 'WIDGET' | 'WHATSAPP' | 'FACEBOOK' | 'INSTAGRAM' | 'SMS';

  @Column({ type: DataType.STRING, allowNull: true })
  public subject?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public visitorName?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public visitorEmail?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public visitorId?: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public departmentId?: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  public metadata?: Record<string, any>;

  @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: 'NORMAL' })
  public priority!: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @Column({ type: DataType.INTEGER, allowNull: true, validate: { min: 1, max: 5 } })
  public rating?: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public feedback?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public startedAt?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public resolvedAt?: Date;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  public messageCount?: number;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  public unreadCount?: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public lastMessage?: string;

  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: [] })
  public cannedResponses?: Array<{ id: string; label: string; text: string }>;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => ChatMessage, { foreignKey: 'conversationId', as: 'messages' })
  public messages?: ChatMessage[];
}

@Table({ tableName: 'comm_chat_messages', timestamps: true })
export class ChatMessage extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => ChatConversation)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public conversationId!: number;

  @BelongsTo(() => ChatConversation, { foreignKey: 'conversationId', as: 'conversation' })
  public conversation?: ChatConversation;

  @Column({ type: DataType.STRING, allowNull: true })
  public senderId?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public senderName?: string;

  @Column({ type: DataType.STRING(20), allowNull: false })
  public senderType!: 'STAFF' | 'CLIENT' | 'SYSTEM' | 'BOT' | 'VISITOR';

  @Column({ type: DataType.TEXT, allowNull: false })
  public content!: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'TEXT' })
  public messageType!: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

  @Column({ type: DataType.STRING, allowNull: true })
  public fileUrl?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public fileName?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public isRead!: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  public readAt?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
