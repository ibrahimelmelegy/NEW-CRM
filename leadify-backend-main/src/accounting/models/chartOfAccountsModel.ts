import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table
} from 'sequelize-typescript';
import JournalEntryLine from './journalEntryLineModel';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

@Table({
  tableName: 'chart_of_accounts',
  modelName: 'ChartOfAccounts',
  timestamps: true
})
class ChartOfAccounts extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  public code!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.ENUM(...Object.values(AccountType)), allowNull: false })
  public type!: AccountType;

  @ForeignKey(() => ChartOfAccounts)
  @Column({ type: DataType.UUID, allowNull: true })
  public parentId?: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  public isGroup!: boolean;

  @Column({ type: DataType.DECIMAL(14, 2), defaultValue: 0 })
  public balance!: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @BelongsTo(() => ChartOfAccounts, { as: 'parent', foreignKey: 'parentId' })
  public parent?: ChartOfAccounts;

  @HasMany(() => ChartOfAccounts, { as: 'children', foreignKey: 'parentId' })
  public children?: ChartOfAccounts[];

  @HasMany(() => JournalEntryLine, { as: 'entries', foreignKey: 'accountId' })
  public entries?: JournalEntryLine[];
}

export default ChartOfAccounts;
