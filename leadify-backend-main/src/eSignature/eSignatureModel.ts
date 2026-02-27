import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../user/userModel';
import Tenant from '../tenant/tenantModel';

@Table({ tableName: 'as_e_signatures', timestamps: true })
export default class ESignature extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public documentId?: string;

  @Column({ type: DataType.STRING(300), allowNull: false })
  public title!: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'PENDING' })
  public status!: 'PENDING' | 'SIGNED' | 'DECLINED' | 'EXPIRED';

  @Column({ type: DataType.JSONB, allowNull: true })
  public recipients?: Array<{ name: string; email: string; role: string; status: string; signedAt: string | null }>;

  @Column({ type: DataType.DATE, allowNull: true })
  public sentAt?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public expiresAt?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public signedDocumentUrl?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public message?: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public createdBy?: number;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  public creator?: User;
}
