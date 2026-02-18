import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({ tableName: 'user_points', modelName: 'UserPoints', timestamps: true })
class UserPoints extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user?: User;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public points!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public reason!: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  public entityType?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public entityId?: string;
}

export default UserPoints;
