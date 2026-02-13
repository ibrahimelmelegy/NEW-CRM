import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import Deal from '../deal/model/dealModel';
import User from '../user/userModel';
import { ContractStatus } from './contractEnum';

@Table({
  tableName: 'contracts',
  modelName: 'Contract',
  timestamps: true
})
class Contract extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public title!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public content?: string;

  @Default(ContractStatus.DRAFT)
  @Column({ type: DataType.ENUM(...Object.values(ContractStatus)), allowNull: false })
  public status!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public signerName?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public signerEmail?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public signatureData?: string; // base64 signature image

  @Column({ type: DataType.STRING, allowNull: true })
  public signatureHash?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public signedAt?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public signingToken?: string; // unique token for public signing URL

  @Column({ type: DataType.DATE, allowNull: true })
  public expiresAt?: Date;

  @ForeignKey(() => Deal)
  @Column({ type: DataType.UUID, allowNull: true })
  public dealId?: string;

  @BelongsTo(() => Deal)
  public deal?: Deal;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user!: User;
}

export default Contract;
