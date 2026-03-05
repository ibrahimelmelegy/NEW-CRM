import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({ tableName: 'customer_segments', timestamps: true })
export default class Segment extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  public criteria!: Array<{ field: string; operator: string; value: unknown }>;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public customerCount!: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ACTIVE' })
  public status!: 'ACTIVE' | 'INACTIVE' | 'DRAFT';

  @Column({ type: DataType.STRING(20), allowNull: true })
  public type?: 'STATIC' | 'DYNAMIC';

  @Column({ type: DataType.DATE, allowNull: true })
  public lastEvaluatedAt?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public createdBy?: number;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  public creator?: User;
}
