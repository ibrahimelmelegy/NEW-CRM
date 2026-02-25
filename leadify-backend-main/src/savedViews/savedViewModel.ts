import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'between'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in';

export interface FilterObject {
  field: string;
  operator: FilterOperator;
  value: any;
}

export type ConditionLogic = 'AND' | 'OR';

@Table({
  tableName: 'saved_views',
  modelName: 'SavedView',
  timestamps: true,
  indexes: [{ fields: ['entityType', 'userId'] }, { fields: ['isShared'] }]
})
class SavedView extends Model {
  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true
  })
  public id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public entityType!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public filters!: FilterObject[];

  @Column({ type: DataType.STRING, allowNull: true })
  public sortBy!: string | null;

  @Default('DESC')
  @Column({ type: DataType.ENUM('ASC', 'DESC'), allowNull: false, defaultValue: 'DESC' })
  public sortOrder!: 'ASC' | 'DESC';

  @Column({ type: DataType.JSONB, allowNull: true })
  public columns!: string[];

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public isDefault!: boolean;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public isShared!: boolean;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user!: User;

  @Column({ type: DataType.STRING, allowNull: true })
  public color!: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  public icon!: string | null;
}

export default SavedView;
