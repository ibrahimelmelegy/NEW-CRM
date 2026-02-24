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
  tableName: 'work_orders',
  modelName: 'WorkOrder',
  timestamps: true,
  indexes: [
    { fields: ['tenantId'] },
    { fields: ['woNumber'], unique: true },
    { fields: ['status'] },
  ],
})
class WorkOrder extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(30), allowNull: false })
  public woNumber!: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public productName!: string;

  @ForeignKey(() => BOM)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public bomId?: number;

  @BelongsTo(() => BOM, { foreignKey: 'bomId', as: 'bom' })
  public bom?: BOM;

  @Column({ type: DataType.STRING(50), allowNull: true })
  public bomCode?: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public planned!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public produced!: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'NORMAL' })
  public priority!: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'PLANNED' })
  public status!: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public dueDate?: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public tenantId?: string;
}

export default WorkOrder;
