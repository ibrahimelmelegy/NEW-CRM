import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  Index
} from 'sequelize-typescript';
import User from '../../user/userModel';

@Table({
  tableName: 'ip_whitelist',
  modelName: 'IPWhitelist',
  timestamps: true
})
export default class IPWhitelist extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  ip!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  label!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  createdBy!: number;

  @Index
  @Column({ type: DataType.STRING, allowNull: true })
  tenantId!: string | null;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  isActive!: boolean;

  @BelongsTo(() => User)
  creator!: User;
}
