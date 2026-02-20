import { Column, DataType, ForeignKey, BelongsTo, HasMany, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'departments',
  modelName: 'Department',
  timestamps: true
})
class Department extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  public name!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false
  })
  public code!: string;

  @ForeignKey(() => Department)
  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  public parentId?: string;

  @Column({
    type: DataType.UUID,
    allowNull: true
  })
  public managerId?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  public description?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public tenantId?: string;

  @BelongsTo(() => Department, { as: 'parent', foreignKey: 'parentId' })
  public parent?: Department;

  @HasMany(() => Department, { as: 'children', foreignKey: 'parentId' })
  public children?: Department[];
}

export default Department;
