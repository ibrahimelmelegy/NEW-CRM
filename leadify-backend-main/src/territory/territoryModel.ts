import { BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'territories',
  modelName: 'Territory',
  timestamps: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['parentId'] },
    { fields: ['assignedUserId'] }
  ]
})
class Territory extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Default('region')
  @Column({ type: DataType.STRING, allowNull: false })
  public type!: string;

  @ForeignKey(() => Territory)
  @Column({ type: DataType.UUID, allowNull: true })
  public parentId?: string;

  @BelongsTo(() => Territory, { foreignKey: 'parentId', as: 'parent' })
  public parent?: Territory;

  @HasMany(() => Territory, { foreignKey: 'parentId', as: 'children' })
  public children?: Territory[];

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  public assignedUserId?: string;

  @BelongsTo(() => User, { foreignKey: 'assignedUserId', as: 'assignedUser' })
  public assignedUser?: User;

  @Column({ type: DataType.JSONB, allowNull: true })
  public boundaries?: object;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isActive!: boolean;
}

export default Territory;
