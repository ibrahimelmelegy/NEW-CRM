import { AllowNull, BelongsTo, Column, DataType, Default, ForeignKey, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  MANUAL = 'manual'
}

export enum BackupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface BackupMetadata {
  tables?: string[];
  rowCounts?: Record<string, number>;
  pgVersion?: string;
  dumpFormat?: string;
}

@Table({
  tableName: 'backups',
  modelName: 'Backup',
  timestamps: true,
  indexes: [{ fields: ['status'] }, { fields: ['backupType'] }, { fields: ['createdAt'] }]
})
class Backup extends Model {
  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true
  })
  public id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  public filename!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public filePath!: string;

  @Default(0)
  @Column({ type: DataType.BIGINT, allowNull: false })
  public fileSize!: number;

  @Default(BackupType.MANUAL)
  @Column({
    type: DataType.ENUM(...Object.values(BackupType)),
    allowNull: false
  })
  public backupType!: BackupType;

  @Default(BackupStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(BackupStatus)),
    allowNull: false
  })
  public status!: BackupStatus;

  @Column({ type: DataType.DATE, allowNull: false })
  public startedAt!: Date;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  public completedAt?: Date;

  @AllowNull(true)
  @Column({ type: DataType.TEXT })
  public error?: string;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  public createdBy?: number;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  public creator?: User;

  @AllowNull(true)
  @Column({ type: DataType.JSONB })
  public metadata?: BackupMetadata;
}

export default Backup;
