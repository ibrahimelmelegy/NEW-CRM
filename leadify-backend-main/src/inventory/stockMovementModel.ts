import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import Product from './productModel';
import User from '../user/userModel';

@Table({ tableName: 'stock_movements', timestamps: true })
export default class StockMovement extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId!: number;

  @Column({ type: DataType.ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'), allowNull: false })
  type!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity!: number;

  @Column({ type: DataType.STRING })
  reason!: string;

  @Column({ type: DataType.STRING })
  reference!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER })
  userId!: number;

  @BelongsTo(() => Product)
  product!: Product;

  @BelongsTo(() => User)
  user!: User;
}
