import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';
import Challenge from './challengeModel';

@Table({ tableName: 'user_challenges', modelName: 'UserChallenge', timestamps: true })
class UserChallenge extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user?: User;

  @ForeignKey(() => Challenge)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public challengeId!: number;

  @BelongsTo(() => Challenge)
  public challenge?: Challenge;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public progress!: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public completed!: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  public completedAt?: Date;
}

export default UserChallenge;
