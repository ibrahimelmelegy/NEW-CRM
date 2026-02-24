import {
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import BOMItem from './bomItemModel';

@Table({
  tableName: 'boms',
  modelName: 'BOM',
  timestamps: true,
  indexes: [
    { fields: ['tenantId'] },
    { fields: ['code'], unique: true },
  ],
})
class BOM extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public productName!: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  public code!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  public version!: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public isActive!: boolean;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  public totalCost!: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public tenantId?: string;

  @HasMany(() => BOMItem, { as: 'items', foreignKey: 'bomId' })
  public items?: BOMItem[];
}

export default BOM;
