import { BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'ec_categories', modelName: 'EcCategory', timestamps: true })
class EcCategory extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  public slug!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public image?: string;

  @ForeignKey(() => EcCategory)
  @Column({ type: DataType.UUID, allowNull: true })
  public parentId?: string;

  @BelongsTo(() => EcCategory, { as: 'parent', foreignKey: 'parentId' })
  public parent?: EcCategory;

  @HasMany(() => EcCategory, { as: 'children', foreignKey: 'parentId' })
  public children?: EcCategory[];

  @Default(0)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  public sortOrder!: number;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  public productCount!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

export default EcCategory;
