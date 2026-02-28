import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'consent_records', timestamps: true })
export default class ConsentRecord extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.UUID, allowNull: false })
  public contactId!: string;

  @Column({ type: DataType.STRING(200), allowNull: true })
  public contactEmail?: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  public consentTypes!: string[]; // e.g. ['EMAIL_MARKETING', 'DATA_PROCESSING', 'THIRD_PARTY_SHARING', 'ANALYTICS']

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'ACTIVE' })
  public status!: 'ACTIVE' | 'WITHDRAWN' | 'EXPIRED' | 'PENDING';

  @Column({ type: DataType.DATE, allowNull: false })
  public consentDate!: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public expiryDate?: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  public withdrawnAt?: Date;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public source?: string; // e.g. 'WEB_FORM', 'EMAIL', 'VERBAL', 'CONTRACT'

  @Column({ type: DataType.STRING(50), allowNull: true })
  public regulation?: string; // e.g. 'GDPR', 'CCPA', 'PDPL'

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
