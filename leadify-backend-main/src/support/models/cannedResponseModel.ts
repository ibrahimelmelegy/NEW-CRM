import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'canned_responses',
  modelName: 'CannedResponse',
  timestamps: true
})
class CannedResponse extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public title!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  public body!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public category?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

export default CannedResponse;
