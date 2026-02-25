import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'virtual_rooms',
  modelName: 'VirtualRoom',
  timestamps: true,
  indexes: [{ fields: ['tenantId'] }]
})
class VirtualRoom extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'office' })
  public type!: 'office' | 'meeting' | 'lounge' | 'focus' | 'call';

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: '🏢' })
  public icon?: string;

  @Column({ type: DataType.STRING(20), allowNull: true, defaultValue: '#7c3aed' })
  public color?: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 10 })
  public capacity!: number;

  @Column({ type: DataType.STRING(500), allowNull: true })
  public description?: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public isLocked!: boolean;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public tenantId?: string;
}

export default VirtualRoom;
