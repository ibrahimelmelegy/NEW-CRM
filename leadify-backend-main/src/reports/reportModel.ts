import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'saved_reports',
  modelName: 'SavedReport',
  timestamps: true
})
class SavedReport extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public entityType!: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  public config!: {
    columns: string[];
    filters: { field: string; operator: string; value: unknown }[];
    groupBy?: string;
    chartType?: string;
    sortBy?: string;
    sortOrder?: string;
  };

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user!: User;
}

export default SavedReport;
