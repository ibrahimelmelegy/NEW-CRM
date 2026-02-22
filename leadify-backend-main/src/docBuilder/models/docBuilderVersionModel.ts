import { Table, Column, Model, DataType, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../../user/userModel';
import DocBuilderDocument from './docBuilderModel';

@Table({
  tableName: 'doc_builder_versions',
  modelName: 'DocBuilderVersion',
  timestamps: true,
  indexes: [
    { fields: ['documentId'] },
    { fields: ['version'] }
  ]
})
class DocBuilderVersion extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @ForeignKey(() => DocBuilderDocument)
  @Column({ type: DataType.UUID, allowNull: false })
  public documentId!: string;

  @BelongsTo(() => DocBuilderDocument, { foreignKey: 'documentId', as: 'document' })
  public document?: DocBuilderDocument;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public version!: number;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  public content?: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  public pdfUrl?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public changedBy!: number;

  @BelongsTo(() => User, { foreignKey: 'changedBy', as: 'editor' })
  public editor?: User;

  @AllowNull(true)
  @Column({ type: DataType.STRING(500) })
  public changeNote?: string;
}

export default DocBuilderVersion;
