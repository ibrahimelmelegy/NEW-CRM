import { Table, Column, Model, DataType, Index } from 'sequelize-typescript';

export enum SyncDirection {
  PUSH = 'PUSH',
  PULL = 'PULL',
}

export enum SyncStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

@Table({
  tableName: 'integration_sync_logs',
  timestamps: true,
  indexes: [
    { fields: ['integration'] },
    { fields: ['entityType', 'entityId'] },
    { fields: ['externalId'] },
    { fields: ['status'] },
  ],
})
export default class SyncLog extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'erpnext' })
  integration!: string;

  @Column({ type: DataType.ENUM(...Object.values(SyncDirection)), allowNull: false })
  direction!: SyncDirection;

  @Column({ type: DataType.STRING, allowNull: false })
  entityType!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  entityId!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  externalId!: string;

  @Column({ type: DataType.ENUM(...Object.values(SyncStatus)), allowNull: false, defaultValue: SyncStatus.PENDING })
  status!: SyncStatus;

  @Column({ type: DataType.JSONB, allowNull: true })
  requestData!: object;

  @Column({ type: DataType.JSONB, allowNull: true })
  responseData!: object;

  @Column({ type: DataType.TEXT, allowNull: true })
  errorMessage!: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  syncedAt!: Date;
}
