import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({ tableName: 'document_folders', timestamps: true })
export default class DocumentFolder extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @ForeignKey(() => DocumentFolder)
  @Column({ type: DataType.INTEGER, allowNull: true })
  parentId!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  color!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  createdBy!: number;

  @BelongsTo(() => DocumentFolder, 'parentId')
  parent!: DocumentFolder;

  @HasMany(() => DocumentFolder, 'parentId')
  children!: DocumentFolder[];

  @BelongsTo(() => User, 'createdBy')
  creator!: User;
}
