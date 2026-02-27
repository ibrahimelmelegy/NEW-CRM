import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import Client from './clientModel';
import User from '../user/userModel';

@Table({
  tableName: 'company_notes',
  modelName: 'companyNote',
  timestamps: true
})
class CompanyNote extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  public companyId!: string;

  @BelongsTo(() => Client, { as: 'company' })
  public company?: Client;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public userId!: number;

  @BelongsTo(() => User, { as: 'user' })
  public user?: User;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  public content!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: []
  })
  public attachments?: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  public isPinned?: boolean;
}

export default CompanyNote;
