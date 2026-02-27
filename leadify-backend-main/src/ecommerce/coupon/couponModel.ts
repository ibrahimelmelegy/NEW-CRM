import { Column, DataType, Default, Model, Table } from 'sequelize-typescript';

export enum CouponTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  FREE_SHIPPING = 'FREE_SHIPPING'
}

export enum CouponStatusEnum {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED'
}

@Table({ tableName: 'ec_coupons', modelName: 'EcCoupon', timestamps: true })
class EcCoupon extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  public code!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public description?: string;

  @Column({ type: DataType.ENUM(...Object.values(CouponTypeEnum)), allowNull: false })
  public type!: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public value!: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  public minOrderAmount!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  public maxDiscountAmount?: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  public maxUses!: number; // 0 = unlimited

  @Default(0)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  public usedCount!: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  public maxUsesPerCustomer!: number;

  @Column({ type: DataType.DATE, allowNull: true })
  public validFrom?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public validTo?: Date;

  @Column({ type: DataType.ENUM(...Object.values(CouponStatusEnum)), defaultValue: CouponStatusEnum.ACTIVE })
  public status!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public applicableProducts?: string[]; // array of product IDs

  @Column({ type: DataType.JSONB, allowNull: true })
  public applicableCategories?: string[]; // array of category IDs

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

export default EcCoupon;
