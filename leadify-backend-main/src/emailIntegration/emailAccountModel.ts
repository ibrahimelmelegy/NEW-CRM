import { Column, DataType, Default, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'email_accounts',
  modelName: 'EmailAccount',
  timestamps: true
})
class EmailAccount extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.UUID, allowNull: false })
  public userId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public provider!: string; // 'gmail' | 'outlook' | 'imap' | 'smtp'

  @Column({ type: DataType.STRING, allowNull: false })
  public email!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public accessToken?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public refreshToken?: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public settings?: object; // IMAP/SMTP config

  @Default(true)
  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  public lastSyncAt?: Date;
}

export default EmailAccount;
