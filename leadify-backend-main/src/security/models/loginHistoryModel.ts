import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Default, Index } from 'sequelize-typescript';
import User from '../../user/userModel';

export enum LoginStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED'
}

@Table({
  tableName: 'login_history',
  modelName: 'LoginHistory',
  timestamps: true
})
export default class LoginHistory extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @ForeignKey(() => User)
  @Index
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  ip!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  userAgent!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  location!: string | null;

  @Default(LoginStatus.SUCCESS)
  @Column({
    type: DataType.ENUM(...Object.values(LoginStatus)),
    allowNull: false,
    defaultValue: LoginStatus.SUCCESS
  })
  status!: LoginStatus;

  @Column({ type: DataType.STRING, allowNull: true })
  failReason!: string | null;

  @Index
  @Column({ type: DataType.STRING, allowNull: true })
  tenantId!: string | null;

  @BelongsTo(() => User)
  user!: User;
}
