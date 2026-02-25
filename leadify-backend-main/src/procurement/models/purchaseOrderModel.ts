import { BelongsTo, Column, DataType, ForeignKey, Model, Table, HasMany } from 'sequelize-typescript';
import Vendor from '../../vendor/vendorModel';
import Project from '../../project/models/projectModel';
import User from '../../user/userModel';
import PurchaseOrderItem from './purchaseOrderItemModel';

export enum POStatusEnum {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  ARCHIVED = 'Archived'
}

@Table({
  tableName: 'PurchaseOrders',
  modelName: 'PurchaseOrder',
  timestamps: true
})
class PurchaseOrder extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  public poNumber!: string;

  @ForeignKey(() => Vendor)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public vendorId!: number;

  @BelongsTo(() => Vendor)
  public vendor!: Vendor;

  @ForeignKey(() => Project)
  @Column({ type: DataType.UUID, allowNull: true })
  public projectId?: string;

  @BelongsTo(() => Project)
  public project!: Project;

  @Column({ type: DataType.ENUM(...Object.values(POStatusEnum)), defaultValue: POStatusEnum.DRAFT })
  public status!: string;

  @Column({ type: DataType.ENUM('Cash', 'Credit'), allowNull: false })
  public paymentMethod!: string;

  @Column({ type: DataType.DATE, allowNull: true })
  public dueDate?: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  public paymentTerms?: string;

  @Column({ type: DataType.DECIMAL(15, 2), defaultValue: 0 })
  public totalAmount!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public createdBy!: number;

  @BelongsTo(() => User)
  public creator!: User;

  @Column({ type: DataType.TEXT, allowNull: true })
  public attachments?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public rejectionReason?: string;

  @HasMany(() => PurchaseOrderItem)
  public items!: PurchaseOrderItem[];
}

export default PurchaseOrder;
