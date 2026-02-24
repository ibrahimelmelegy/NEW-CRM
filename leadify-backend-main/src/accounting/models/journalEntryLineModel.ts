import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import JournalEntry from './journalEntryModel';
import ChartOfAccounts from './chartOfAccountsModel';

@Table({
  tableName: 'journal_entry_lines',
  modelName: 'JournalEntryLine',
  timestamps: true
})
class JournalEntryLine extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @ForeignKey(() => JournalEntry)
  @Column({ type: DataType.UUID, allowNull: false })
  public journalEntryId!: string;

  @ForeignKey(() => ChartOfAccounts)
  @Column({ type: DataType.UUID, allowNull: false })
  public accountId!: string;

  @Column({ type: DataType.DECIMAL(14, 2), defaultValue: 0 })
  public debit!: number;

  @Column({ type: DataType.DECIMAL(14, 2), defaultValue: 0 })
  public credit!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public description?: string;

  @BelongsTo(() => JournalEntry, { as: 'journalEntry', foreignKey: 'journalEntryId' })
  public journalEntry?: JournalEntry;

  @BelongsTo(() => ChartOfAccounts, { as: 'account', foreignKey: 'accountId' })
  public account?: ChartOfAccounts;
}

export default JournalEntryLine;
