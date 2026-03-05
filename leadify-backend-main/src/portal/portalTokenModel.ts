import { Column, DataType, ForeignKey, BelongsTo, Model, Table, Index } from 'sequelize-typescript';
import Client from '../client/clientModel';

@Table({
  tableName: 'portal_tokens',
  modelName: 'PortalToken',
  timestamps: true
})
class PortalToken extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  public clientId!: string;

  @BelongsTo(() => Client)
  public client?: Client;

  @Column({ type: DataType.STRING, allowNull: false })
  public email!: string;

  @Index
  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  public token!: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  public lastAccessAt?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public expiresAt?: Date;
}

export default PortalToken;
