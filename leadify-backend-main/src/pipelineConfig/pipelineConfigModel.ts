import { Table, Column, Model, DataType, Default } from 'sequelize-typescript';

@Table({
  tableName: 'pipeline_stages',
  modelName: 'PipelineStage',
  timestamps: true,
  indexes: [{ fields: ['entityType'] }, { fields: ['order'] }]
})
class PipelineStage extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public order!: number;

  @Column({ type: DataType.STRING, defaultValue: '#7849ff' })
  public color!: string;

  @Column({ type: DataType.FLOAT, defaultValue: 0 })
  public probability!: number;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'deal' })
  public entityType!: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  public isDefault!: boolean;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  public isWon!: boolean;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  public isLost!: boolean;
}

export default PipelineStage;
