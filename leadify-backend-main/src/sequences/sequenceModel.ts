import { Column, DataType, Default, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'sequences',
  modelName: 'Sequence',
  timestamps: true
})
class Sequence extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Default([])
  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  public steps!: Array<{ order: number; type: string; subject: string; body: string; delayDays: number }>;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.UUID, allowNull: true })
  public createdBy?: string;
}

export default Sequence;

@Table({
  tableName: 'sequence_enrollments',
  modelName: 'SequenceEnrollment',
  timestamps: true
})
class SequenceEnrollment extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  public sequenceId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public entityType!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  public entityId!: string;

  @Default(0)
  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  public currentStep!: number;

  @Default('active')
  @Column({ type: DataType.STRING, defaultValue: 'active' })
  public status!: string; // 'active' | 'paused' | 'completed' | 'cancelled'

  @Column({ type: DataType.DATE, allowNull: true })
  public nextRunAt?: Date;
}

export { SequenceEnrollment };
