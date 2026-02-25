import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'focus_sessions',
  modelName: 'FocusSession',
  timestamps: true,
  indexes: [{ fields: ['userId'] }, { fields: ['startedAt'] }]
})
class FocusSession extends Model {
  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true
  })
  public id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public userId!: number;

  @BelongsTo(() => User, { as: 'user', foreignKey: 'userId' })
  public user?: User;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  public taskId?: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: true
  })
  public taskTitle?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  public startedAt!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  public endedAt?: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 25
  })
  public duration!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  public actualMinutes?: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  public completed!: boolean;
}

export default FocusSession;
