import { BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import Client from '../../client/clientModel';
import CatalogProduct from '../../productCatalog/productModel';

export enum CartStatusEnum {
  ACTIVE = 'ACTIVE',
  ABANDONED = 'ABANDONED',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED'
}

@Table({ tableName: 'ec_carts', modelName: 'EcCart', timestamps: true })
class EcCart extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  public clientId!: string;

  @BelongsTo(() => Client, { as: 'client' })
  public client?: Client;

  @Column({ type: DataType.ENUM(...Object.values(CartStatusEnum)), defaultValue: CartStatusEnum.ACTIVE })
  public status!: string;

  @Default('SAR')
  @Column({ type: DataType.STRING, defaultValue: 'SAR' })
  public currency!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public couponCode?: string;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  public discountAmount!: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => EcCartItem, { as: 'items', onDelete: 'CASCADE' })
  public items!: EcCartItem[];
}

@Table({ tableName: 'ec_cart_items', modelName: 'EcCartItem', timestamps: true })
class EcCartItem extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @ForeignKey(() => EcCart)
  @Column({ type: DataType.UUID, allowNull: false })
  public cartId!: string;

  @BelongsTo(() => EcCart, { as: 'cart' })
  public cart?: EcCart;

  @ForeignKey(() => CatalogProduct)
  @Column({ type: DataType.UUID, allowNull: false })
  public productId!: string;

  @BelongsTo(() => CatalogProduct, { as: 'product' })
  public product?: CatalogProduct;

  @Default(1)
  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 1 })
  public quantity!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public unitPrice!: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;
}

export { EcCart, EcCartItem };
export default EcCart;
