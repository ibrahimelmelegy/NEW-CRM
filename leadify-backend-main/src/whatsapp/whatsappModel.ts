import { Table, Column, Model, DataType, Default, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import User from '../user/userModel';
import Client from '../client/clientModel';

// ─── Enums ──────────────────────────────────────────────────────────────────

export enum WAContactStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  ARCHIVED = 'ARCHIVED'
}

export enum WAMessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export enum WAMessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  LOCATION = 'LOCATION',
  TEMPLATE = 'TEMPLATE'
}

export enum WAMessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

export enum WATemplateCategory {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION'
}

export enum WATemplateHeaderType {
  NONE = 'NONE',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT'
}

export enum WATemplateStatus {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}

// ─── WhatsApp Contact ───────────────────────────────────────────────────────

@Table({ tableName: 'wa_contacts', timestamps: true })
export class WhatsAppContact extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public phoneNumber!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public name?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public profilePicUrl?: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: true })
  public clientId?: string;

  @BelongsTo(() => Client, { foreignKey: 'clientId', as: 'client' })
  public client?: Client;

  @Column({ type: DataType.DATE, allowNull: true })
  public lastMessageAt?: Date;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public unreadCount!: number;

  @Default(WAContactStatus.ACTIVE)
  @Column({ type: DataType.ENUM(...Object.values(WAContactStatus)), allowNull: false })
  public status!: string;

  @Default([])
  @Column({ type: DataType.JSONB, allowNull: false })
  public tags!: string[];

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => WhatsAppMessage, { foreignKey: 'contactId', as: 'messages' })
  public messages?: WhatsAppMessage[];
}

// ─── WhatsApp Message ───────────────────────────────────────────────────────

@Table({ tableName: 'wa_messages', timestamps: true })
export class WhatsAppMessage extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @ForeignKey(() => WhatsAppContact)
  @Column({ type: DataType.UUID, allowNull: false })
  public contactId!: string;

  @BelongsTo(() => WhatsAppContact, { foreignKey: 'contactId', as: 'contact' })
  public contact?: WhatsAppContact;

  @Default(WAMessageDirection.OUTBOUND)
  @Column({ type: DataType.ENUM(...Object.values(WAMessageDirection)), allowNull: false })
  public direction!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  public content!: string;

  @Default(WAMessageType.TEXT)
  @Column({ type: DataType.ENUM(...Object.values(WAMessageType)), allowNull: false })
  public type!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public mediaUrl?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public mediaCaption?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public fileName?: string;

  @Default(WAMessageStatus.PENDING)
  @Column({ type: DataType.ENUM(...Object.values(WAMessageStatus)), allowNull: false })
  public status!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public templateName?: string;

  @Default({})
  @Column({ type: DataType.JSONB, allowNull: false })
  public metadata!: Record<string, unknown>;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public sentBy?: number;

  @BelongsTo(() => User, { foreignKey: 'sentBy', as: 'sender' })
  public sender?: User;

  @Column({ type: DataType.STRING, allowNull: true })
  public externalId?: string;
}

// ─── WhatsApp Template ──────────────────────────────────────────────────────

@Table({ tableName: 'wa_templates', timestamps: true })
export class WhatsAppTemplate extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Default('en')
  @Column({ type: DataType.STRING, allowNull: false })
  public language!: string;

  @Default(WATemplateCategory.UTILITY)
  @Column({ type: DataType.ENUM(...Object.values(WATemplateCategory)), allowNull: false })
  public category!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  public content!: string;

  @Default(WATemplateHeaderType.NONE)
  @Column({ type: DataType.ENUM(...Object.values(WATemplateHeaderType)), allowNull: false })
  public headerType!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public headerContent?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public footerText?: string;

  @Default([])
  @Column({ type: DataType.JSONB, allowNull: false })
  public buttons!: unknown[];

  @Default(WATemplateStatus.APPROVED)
  @Column({ type: DataType.ENUM(...Object.values(WATemplateStatus)), allowNull: false })
  public status!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
