import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import EmailAccount from './emailAccountModel';

@Table({
  tableName: 'email_messages',
  modelName: 'EmailMessage',
  timestamps: true
})
class EmailMessage extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @ForeignKey(() => EmailAccount)
  @Column({ type: DataType.UUID, allowNull: false })
  public accountId!: string;

  @BelongsTo(() => EmailAccount)
  public account!: EmailAccount;

  @Column({ type: DataType.STRING, allowNull: true })
  public messageId?: string; // provider message ID

  @Column({ type: DataType.STRING, allowNull: true })
  public subject?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public from?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public to?: string[]; // array of recipients

  @Column({ type: DataType.JSONB, allowNull: true })
  public cc?: string[];

  @Column({ type: DataType.TEXT, allowNull: true })
  public body?: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  public isRead!: boolean;

  @Default('inbox')
  @Column({ type: DataType.STRING, defaultValue: 'inbox' })
  public folder!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public entityType?: string; // linked entity

  @Column({ type: DataType.UUID, allowNull: true })
  public entityId?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public sentAt?: Date;
}

export default EmailMessage;
