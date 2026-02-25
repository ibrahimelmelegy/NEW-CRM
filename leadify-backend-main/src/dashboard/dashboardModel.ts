import { AllowNull, BelongsTo, Column, DataType, Default, ForeignKey, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

export interface WidgetFilter {
  field: string;
  operator: string;
  value: any;
}

export interface WidgetConfig {
  entityType?: string;
  metric?: string; // count, sum, avg
  field?: string;
  groupBy?: string;
  chartType?: string; // bar, line, pie, doughnut, area
  filters?: WidgetFilter[];
  dateRange?: string; // today, this_week, this_month, this_quarter, this_year, custom
  customDateFrom?: string;
  customDateTo?: string;
  limit?: number;
  color?: string;
}

export type WidgetType = 'stat_card' | 'chart' | 'table' | 'pipeline_funnel' | 'activity_feed' | 'task_list' | 'leaderboard';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
}

export interface LayoutItem {
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

@Table({
  tableName: 'dashboards',
  modelName: 'Dashboard',
  timestamps: true,
  indexes: [{ fields: ['userId'] }, { fields: ['isDefault'] }, { fields: ['role'] }]
})
class Dashboard extends Model {
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

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  public widgets!: Widget[];

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  public layout!: LayoutItem[];

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isDefault!: boolean;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isShared!: boolean;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  public role?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user!: User;
}

export default Dashboard;
