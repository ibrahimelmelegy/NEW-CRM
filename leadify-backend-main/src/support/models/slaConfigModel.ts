import { Column, DataType, Default, Model, Table } from 'sequelize-typescript';

export enum SLAConfigPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

@Table({
  tableName: 'support_sla_configs',
  modelName: 'SLAConfig',
  timestamps: true
})
class SLAConfig extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  public priority!: SLAConfigPriority;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public responseTimeHours!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public resolutionTimeHours!: number;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isActive!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

export default SLAConfig;
