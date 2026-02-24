import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';
import { MessageDirection, MessageStatus, MessageProvider } from './messagingEnum';

@Table({
  tableName: 'messages',
  modelName: 'Message',
  timestamps: true
})
class Message extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public contactPhone!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public contactName?: string;

  @Default(MessageDirection.OUTBOUND)
  @Column({
    type: DataType.ENUM(...Object.values(MessageDirection)),
    allowNull: false
  })
  public direction!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  public content!: string;

  @Default(MessageStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(MessageStatus)),
    allowNull: false
  })
  public status!: string;

  @Default(MessageProvider.WHATSAPP)
  @Column({
    type: DataType.ENUM(...Object.values(MessageProvider)),
    allowNull: false
  })
  public provider!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public externalId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public userId?: number;

  @BelongsTo(() => User)
  public user?: User;
}

export default Message;
