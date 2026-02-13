import { Column, DataType, Default, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'workflows',
  modelName: 'Workflow',
  timestamps: true
})
class Workflow extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public trigger!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public conditions?: { field: string; operator: string; value: any }[];

  @Column({ type: DataType.JSONB, allowNull: false })
  public actions!: { type: string; config: any }[];

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isActive!: boolean;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public executionCount!: number;
}

export default Workflow;
