import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import Client from '../client/clientModel';

@Table({
  tableName: 'portal_users',
  modelName: 'PortalUser',
  timestamps: true
})
class PortalUser extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  public email!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public passwordHash!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  public lastLoginAt?: Date;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  public clientId!: string;

  @BelongsTo(() => Client)
  public client?: Client;

  toJSON() {
    const values = { ...this.get() };
    delete values.passwordHash;
    return values;
  }
}

export default PortalUser;
