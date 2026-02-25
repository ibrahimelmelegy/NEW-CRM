import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Default, Index } from 'sequelize-typescript';
import User from '../user/userModel';

export enum TwoFactorMethod {
  TOTP = 'TOTP',
  SMS = 'SMS',
  EMAIL = 'EMAIL'
}

@Table({
  tableName: 'two_factor_auth',
  modelName: 'TwoFactorAuth',
  timestamps: true
})
export default class TwoFactorAuth extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @ForeignKey(() => User)
  @Index({ unique: true })
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  userId!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  secret!: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  isEnabled!: boolean;

  @Column({ type: DataType.JSONB, allowNull: true })
  backupCodes!: string[] | null;

  @Default(TwoFactorMethod.TOTP)
  @Column({
    type: DataType.ENUM(...Object.values(TwoFactorMethod)),
    allowNull: false,
    defaultValue: TwoFactorMethod.TOTP
  })
  method!: TwoFactorMethod;

  @Column({ type: DataType.DATE, allowNull: true })
  verifiedAt!: Date | null;

  @BelongsTo(() => User)
  user!: User;
}
