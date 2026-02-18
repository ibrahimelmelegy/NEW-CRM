import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'challenges', modelName: 'Challenge', timestamps: true })
class Challenge extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'weekly' })
  public type!: 'weekly' | 'monthly';

  @Column({ type: DataType.STRING(50), allowNull: false })
  public metric!: string; // e.g., 'deals_closed', 'leads_created', 'activities_logged'

  @Column({ type: DataType.INTEGER, allowNull: false })
  public target!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 50 })
  public rewardPoints!: number;

  @Column({ type: DataType.STRING(50), allowNull: true })
  public icon?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public startsAt?: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  public endsAt?: string;
}

export default Challenge;
