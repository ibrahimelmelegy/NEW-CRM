import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../user/userModel';
import Deal from '../deal/model/dealModel';

@Table({ tableName: 'sales_commissions', timestamps: true, indexes: [{ fields: ['staffId'] }, { fields: ['dealId'] }, { fields: ['status'] }] })
export default class Commission extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public staffId!: number;

  @BelongsTo(() => User, { foreignKey: 'staffId', as: 'staff' })
  public staff?: User;

  @ForeignKey(() => Deal)
  @Column({ type: DataType.UUID, allowNull: true })
  public dealId?: string;

  @BelongsTo(() => Deal, { foreignKey: 'dealId', as: 'deal' })
  public deal?: Deal;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  public amount!: number;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: true })
  public rate?: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  public dealValue?: number;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'PENDING' })
  public status!: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

  @Column({ type: DataType.DATE, allowNull: true })
  public paidAt?: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  public notes?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId?: string;
}
