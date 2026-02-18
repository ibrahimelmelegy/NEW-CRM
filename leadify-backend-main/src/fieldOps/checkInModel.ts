import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({ tableName: 'field_check_ins', modelName: 'FieldCheckIn', timestamps: true })
class FieldCheckIn extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @BelongsTo(() => User)
  public user?: User;

  @Column({ type: DataType.DECIMAL(10, 7), allowNull: false })
  public latitude!: number;

  @Column({ type: DataType.DECIMAL(10, 7), allowNull: false })
  public longitude!: number;

  @Column({ type: DataType.STRING(500), allowNull: true })
  public address?: string;

  @Column({ type: DataType.ENUM('CHECK_IN', 'CHECK_OUT'), allowNull: false })
  public type!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  public photoUrl?: string;
}

export default FieldCheckIn;
