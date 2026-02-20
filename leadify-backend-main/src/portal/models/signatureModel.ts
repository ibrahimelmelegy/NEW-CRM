import { Column, DataType, Index, Model, Table } from 'sequelize-typescript';

export enum SignatureType {
  DRAWN = 'DRAWN',
  TYPED = 'TYPED'
}

@Table({
  tableName: 'document_signatures',
  modelName: 'DocumentSignature',
  timestamps: true
})
class DocumentSignature extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  public documentId!: string;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  public clientId!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  public signatureData!: string;

  @Column({ type: DataType.ENUM(...Object.values(SignatureType)), allowNull: false })
  public signatureType!: SignatureType;

  @Column({ type: DataType.STRING, allowNull: true })
  public typedName?: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public ipAddress!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public userAgent?: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  public signedAt!: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

export default DocumentSignature;
