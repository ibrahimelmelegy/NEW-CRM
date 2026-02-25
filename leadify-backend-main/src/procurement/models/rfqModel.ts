import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import User from '../../user/userModel';
import Project from '../../project/models/projectModel';
import RFQItem from './rfqItemModel';
import RFQVendor from './rfqVendorModel';

export enum RFQStatusEnum {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PARTIALLY_RECEIVED = 'Partially Received',
  COMPLETED = 'Completed',
  CONVERTED = 'Converted to PO',
  ARCHIVED = 'Archived'
}

@Table({
  tableName: 'RFQs',
  modelName: 'RFQ',
  timestamps: true
})
class RFQ extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  public rfqNumber!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public title!: string;

  @Column({ type: DataType.ENUM(...Object.values(RFQStatusEnum)), defaultValue: RFQStatusEnum.DRAFT })
  public status!: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.UUID, allowNull: true })
  public projectId?: string;

  @BelongsTo(() => Project)
  public project?: Project;

  @Column({ type: DataType.DATE, allowNull: false })
  public deadLine!: Date;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public createdBy!: number;

  @BelongsTo(() => User)
  public creator!: User;

  @HasMany(() => RFQItem)
  public items!: RFQItem[];

  @HasMany(() => RFQVendor)
  public vendors!: RFQVendor[];
}

export default RFQ;
