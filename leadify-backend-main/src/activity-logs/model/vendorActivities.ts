import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { ActivityModelClass } from './activities';
import Vendor from '../../vendor/vendorModel';

@Table({
  tableName: 'vendorActivities',
  modelName: 'VendorActivity',
  timestamps: true
})
export class VendorActivity extends ActivityModelClass {
  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public vendorId!: number;

  @BelongsTo(() => Vendor, { as: 'vendor' })
  public vendor!: Vendor;
}
