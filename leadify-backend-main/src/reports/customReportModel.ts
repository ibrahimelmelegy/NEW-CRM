import { AllowNull, BelongsTo, Column, DataType, Default, ForeignKey, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'gte' | 'lte' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value: any;
}

export interface ReportAggregation {
  field: string;
  function: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // e.g. '08:00'
  recipients: string[]; // email addresses
  format: 'pdf' | 'excel';
}

export interface ReportChartConfig {
  xAxis?: string;
  yAxis?: string;
  colorScheme?: string;
  stacked?: boolean;
  showLegend?: boolean;
  showValues?: boolean;
}

@Table({
  tableName: 'custom_reports',
  modelName: 'CustomReport',
  timestamps: true,
  indexes: [
    { fields: ['entityType'] },
    { fields: ['userId'] }
  ]
})
class CustomReport extends Model {
  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true
  })
  public id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  public description?: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public entityType!: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  public fields!: string[];

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  public filters!: ReportFilter[];

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  public groupBy?: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  public aggregations!: ReportAggregation[];

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  public sortBy?: string;

  @Default('DESC')
  @Column({ type: DataType.ENUM('ASC', 'DESC'), allowNull: false })
  public sortOrder!: 'ASC' | 'DESC';

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  public chartType?: string; // bar, line, pie, none

  @AllowNull(true)
  @Column({ type: DataType.JSONB })
  public chartConfig?: ReportChartConfig;

  @AllowNull(true)
  @Column({ type: DataType.JSONB })
  public schedule?: ReportSchedule;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isShared!: boolean;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user!: User;
}

export default CustomReport;
