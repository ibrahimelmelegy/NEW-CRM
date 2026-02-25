import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

export enum DuplicateStatus {
  DETECTED = 'DETECTED',
  CONFIRMED = 'CONFIRMED',
  MERGED = 'MERGED',
  DISMISSED = 'DISMISSED'
}

@Table({
  tableName: 'duplicate_sets',
  modelName: 'DuplicateSet',
  timestamps: true,
  indexes: [{ fields: ['entityType'] }, { fields: ['status'] }, { fields: ['masterRecordId'] }]
})
class DuplicateSet extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  public entityType!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public masterRecordId!: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  public duplicateRecordIds!: string[];

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false })
  public matchScore!: number;

  @Column({ type: DataType.JSONB, allowNull: true })
  public matchedFields!: Array<{ field: string; value1: any; value2: any; similarity: number }>;

  @Column({ type: DataType.ENUM(...Object.values(DuplicateStatus)), allowNull: false, defaultValue: DuplicateStatus.DETECTED })
  public status!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public resolvedBy!: number | null;

  @BelongsTo(() => User, { foreignKey: 'resolvedBy', as: 'resolver' })
  public resolver!: User | null;

  @Column({ type: DataType.DATE, allowNull: true })
  public resolvedAt!: Date | null;
}

export default DuplicateSet;
