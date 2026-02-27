import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../user/userModel';
import Client from '../client/clientModel';

@Table({ tableName: 'comm_booking_slots', timestamps: true })
export class BookingSlot extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public staffId!: number;

  @BelongsTo(() => User, { foreignKey: 'staffId', as: 'staff' })
  public staff?: User;

  @Column({ type: DataType.INTEGER, allowNull: false })
  public dayOfWeek!: number;

  @Column({ type: DataType.STRING(5), allowNull: false })
  public startTime!: string;

  @Column({ type: DataType.STRING(5), allowNull: false })
  public endTime!: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}

@Table({ tableName: 'comm_bookings', timestamps: true })
export class Booking extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => BookingSlot)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public slotId?: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public staffId!: number;

  @BelongsTo(() => User, { foreignKey: 'staffId', as: 'staff' })
  public staff?: User;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: true })
  public clientId?: string;

  @BelongsTo(() => Client, { foreignKey: 'clientId', as: 'client' })
  public client?: Client;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public clientName?: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public clientEmail?: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  public date!: string;

  @Column({ type: DataType.STRING(5), allowNull: false })
  public startTime!: string;

  @Column({ type: DataType.STRING(5), allowNull: false })
  public endTime!: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'CONFIRMED' })
  public status!: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

  @Column({ type: DataType.STRING(50), allowNull: true })
  public type?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
