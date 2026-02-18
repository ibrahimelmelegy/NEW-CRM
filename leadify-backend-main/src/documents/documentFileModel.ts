import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import DocumentFolder from './documentFolderModel';
import User from '../user/userModel';

@Table({ tableName: 'document_files', timestamps: true })
export default class DocumentFile extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  originalName!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  path!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  mimeType!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  size!: number;

  @ForeignKey(() => DocumentFolder)
  @Column({ type: DataType.INTEGER, allowNull: true })
  folderId!: number;

  @Column({ type: DataType.ARRAY(DataType.STRING), defaultValue: [] })
  tags!: string[];

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  uploadedBy!: number;

  @BelongsTo(() => DocumentFolder)
  folder!: DocumentFolder;

  @BelongsTo(() => User, 'uploadedBy')
  uploader!: User;
}
