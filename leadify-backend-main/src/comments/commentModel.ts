import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'comments',
  modelName: 'Comment',
  timestamps: true
})
class Comment extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false })
  public entityType!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public entityId!: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  public content!: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  public parentId?: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user?: User;
}

export default Comment;
