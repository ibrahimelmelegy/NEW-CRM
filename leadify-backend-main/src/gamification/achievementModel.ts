import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'achievements', modelName: 'Achievement', timestamps: true })
class Achievement extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  public icon?: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public pointsValue!: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public criteria?: string;
}

export default Achievement;
