import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import JournalEntryLine from './journalEntryLineModel';

export enum JournalEntrySourceType {
  MANUAL = 'MANUAL',
  INVOICE = 'INVOICE',
  PAYMENT = 'PAYMENT',
  EXPENSE = 'EXPENSE',
  PAYROLL = 'PAYROLL'
}

export enum JournalEntryStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  VOIDED = 'VOIDED'
}

@Table({
  tableName: 'journal_entries',
  modelName: 'JournalEntry',
  timestamps: true
})
class JournalEntry extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  public entryNumber!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  public date!: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public reference?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Column({
    type: DataType.ENUM(...Object.values(JournalEntrySourceType)),
    defaultValue: JournalEntrySourceType.MANUAL
  })
  public sourceType!: JournalEntrySourceType;

  @Column({ type: DataType.UUID, allowNull: true })
  public sourceId?: string;

  @Column({
    type: DataType.ENUM(...Object.values(JournalEntryStatus)),
    defaultValue: JournalEntryStatus.DRAFT
  })
  public status!: JournalEntryStatus;

  @Column({ type: DataType.DECIMAL(14, 2), defaultValue: 0 })
  public totalDebit!: number;

  @Column({ type: DataType.DECIMAL(14, 2), defaultValue: 0 })
  public totalCredit!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;

  @HasMany(() => JournalEntryLine, { as: 'lines', foreignKey: 'journalEntryId' })
  public lines?: JournalEntryLine[];
}

export default JournalEntry;
