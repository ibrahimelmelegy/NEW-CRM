import { BelongsTo, Column, DataType, Default, ForeignKey, Model, Table } from 'sequelize-typescript';
import CatalogProduct from '../../productCatalog/productModel';
import Client from '../../client/clientModel';

export enum ReviewStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

@Table({ tableName: 'ec_reviews', modelName: 'EcReview', timestamps: true })
class EcReview extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @ForeignKey(() => CatalogProduct)
  @Column({ type: DataType.UUID, allowNull: false })
  public productId!: string;

  @BelongsTo(() => CatalogProduct, { as: 'product' })
  public product?: CatalogProduct;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  public clientId!: string;

  @BelongsTo(() => Client, { as: 'client' })
  public client?: Client;

  @Column({ type: DataType.INTEGER, allowNull: false, validate: { min: 1, max: 5 } })
  public rating!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public title?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public comment?: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  public isVerifiedPurchase!: boolean;

  @Column({ type: DataType.ENUM(...Object.values(ReviewStatusEnum)), defaultValue: ReviewStatusEnum.PENDING })
  public status!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public merchantResponse?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public respondedAt?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

export default EcReview;
