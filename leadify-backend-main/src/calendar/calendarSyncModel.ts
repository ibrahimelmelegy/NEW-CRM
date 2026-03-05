import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'calendar_syncs',
  modelName: 'CalendarSync',
  timestamps: true
})
class CalendarSync extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user?: User;

  @Column({
    type: DataType.ENUM('google', 'outlook'),
    allowNull: false
  })
  public provider!: 'google' | 'outlook';

  @Column({ type: DataType.TEXT, allowNull: true })
  public accessToken?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public refreshToken?: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  public calendarId?: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  public email?: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public lastSyncAt?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public tokenExpiresAt?: Date;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public autoSync!: boolean;

  @Column({
    type: DataType.ENUM('connected', 'disconnected', 'error', 'syncing'),
    allowNull: false,
    defaultValue: 'disconnected'
  })
  public syncStatus!: 'connected' | 'disconnected' | 'error' | 'syncing';

  @Column({ type: DataType.TEXT, allowNull: true })
  public lastError?: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  public syncedEventsCount!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

export default CalendarSync;
