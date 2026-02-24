import { Column, DataType, HasMany, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';

@Table({
  tableName: 'ticket_categories',
  modelName: 'TicketCategory',
  timestamps: true
})
class TicketCategory extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @ForeignKey(() => TicketCategory)
  @Column({ type: DataType.UUID, allowNull: true })
  public parentId?: string;

  @BelongsTo(() => TicketCategory, { foreignKey: 'parentId', as: 'parent' })
  public parent?: TicketCategory;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => TicketCategory, { foreignKey: 'parentId', as: 'children' })
  public children?: TicketCategory[];
}

export default TicketCategory;
