import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import StockMovement from './stockMovementModel';

@Table({ tableName: 'products', timestamps: true })
export default class Product extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  sku!: string;

  @Column({ type: DataType.TEXT })
  description!: string;

  @Column({ type: DataType.STRING })
  category!: string;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  unitPrice!: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  costPrice!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  currentStock!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  minStockLevel!: number;

  @Column({ type: DataType.STRING })
  unit!: string;

  @Column({ type: DataType.STRING })
  warehouse!: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive!: boolean;

  @HasMany(() => StockMovement)
  movements!: StockMovement[];
}
