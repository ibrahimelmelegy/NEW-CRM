import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import EmailMessage from './emailMessageModel';

@Table({
  tableName: 'email_tracking',
  modelName: 'EmailTracking',
  timestamps: true
})
class EmailTracking extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @ForeignKey(() => EmailMessage)
  @Column({ type: DataType.UUID, allowNull: false })
  public messageId!: string;

  @BelongsTo(() => EmailMessage)
  public message!: EmailMessage;

  @Column({ type: DataType.STRING, allowNull: false })
  public event!: string; // 'opened' | 'clicked' | 'bounced'

  @Column({ type: DataType.JSONB, allowNull: true })
  public metadata?: object;

  @Column({ type: DataType.DATE, allowNull: false })
  public occurredAt!: Date;
}

export default EmailTracking;
