import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import Client from '../client/clientModel';

@Table({ tableName: 'as_warranties', timestamps: true })
export class Warranty extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public productName!: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  public serialNumber?: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: true })
  public clientId?: string;

  @BelongsTo(() => Client, { foreignKey: 'clientId', as: 'client' })
  public client?: Client;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  public startDate!: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  public endDate!: string;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'STANDARD' })
  public type!: 'STANDARD' | 'EXTENDED' | 'LIMITED' | 'LIFETIME';

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ACTIVE' })
  public status!: 'ACTIVE' | 'EXPIRED' | 'VOIDED' | 'CLAIMED';

  @Column({ type: DataType.TEXT, allowNull: true })
  public terms?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => WarrantyClaim, { foreignKey: 'warrantyId', as: 'claims' })
  public claims?: WarrantyClaim[];
}

@Table({ tableName: 'as_warranty_claims', timestamps: true })
export class WarrantyClaim extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => Warranty)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public warrantyId!: number;

  @BelongsTo(() => Warranty, { foreignKey: 'warrantyId', as: 'warranty' })
  public warranty?: Warranty;

  @Column({ type: DataType.TEXT, allowNull: false })
  public description!: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'OPEN' })
  public status!: 'OPEN' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESOLVED';

  @Column({ type: DataType.TEXT, allowNull: true })
  public resolution?: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  public claimAmount?: number;

  @Column({ type: DataType.DATE, allowNull: true })
  public resolvedAt?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
