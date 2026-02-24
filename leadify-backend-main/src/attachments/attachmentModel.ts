import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'attachments',
  modelName: 'Attachment',
  timestamps: true
})
class Attachment extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false })
  public entityType!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public entityId!: number;

  @Column({ type: DataType.STRING(500), allowNull: false })
  public fileUrl!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  public fileName!: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public fileSize?: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public mimeType?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public uploadedBy!: number;

  @BelongsTo(() => User)
  public uploader?: User;
}

export default Attachment;
