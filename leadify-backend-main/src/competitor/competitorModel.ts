import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'sales_competitors', timestamps: true })
export default class Competitor extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public website?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public industry?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public strengths?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public weaknesses?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ACTIVE' })
  public status!: 'ACTIVE' | 'INACTIVE' | 'ACQUIRED';

  @Column({ type: DataType.STRING(20), allowNull: true })
  public threatLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @Column({ type: DataType.JSONB, allowNull: true })
  public products?: string[];

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  public dealsWon?: number;

  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 0 })
  public dealsLost?: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
