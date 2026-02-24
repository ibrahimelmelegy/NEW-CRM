import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import BOM from './bomModel';

@Table({
  tableName: 'bom_items',
  modelName: 'BOMItem',
  timestamps: true,
  indexes: [
    { fields: ['bomId'] },
  ],
})
class BOMItem extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => BOM)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public bomId!: number;

  @BelongsTo(() => BOM, { foreignKey: 'bomId' })
  public bom?: BOM;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'RAW' })
  public type!: 'RAW' | 'SUB_ASSEMBLY';

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 1 })
  public quantity!: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'pc' })
  public unit!: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  public unitCost!: number;
}

export default BOMItem;
