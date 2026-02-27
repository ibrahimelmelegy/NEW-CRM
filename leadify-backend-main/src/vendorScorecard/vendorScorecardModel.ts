import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Vendor from '../vendor/vendorModel';

@Table({ tableName: 'proc_vendor_scorecards', timestamps: true })
export default class VendorScorecard extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => Vendor)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public vendorId!: number;

  @BelongsTo(() => Vendor, { foreignKey: 'vendorId', as: 'vendor' })
  public vendor?: Vendor;

  @Column({ type: DataType.STRING(50), allowNull: false })
  public period!: string;

  @Column({ type: DataType.DECIMAL(3, 1), allowNull: true })
  public qualityScore?: number;

  @Column({ type: DataType.DECIMAL(3, 1), allowNull: true })
  public deliveryScore?: number;

  @Column({ type: DataType.DECIMAL(3, 1), allowNull: true })
  public priceScore?: number;

  @Column({ type: DataType.DECIMAL(3, 1), allowNull: true })
  public communicationScore?: number;

  @Column({ type: DataType.DECIMAL(3, 1), allowNull: true })
  public overallScore?: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
