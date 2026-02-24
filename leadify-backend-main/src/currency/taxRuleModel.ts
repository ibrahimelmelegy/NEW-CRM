import { Column, DataType, Default, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'tax_rules',
  modelName: 'TaxRule',
  timestamps: true
})
class TaxRule extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER, autoIncrement: true })
  public id!: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  public name!: string;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false })
  public rate!: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public region?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description?: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isActive!: boolean;

  @Default('VAT')
  @Column({
    type: DataType.ENUM('VAT', 'ZAKAAT', 'WITHHOLDING', 'EXCISE'),
    allowNull: false,
    defaultValue: 'VAT'
  })
  public taxType!: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public isCompound!: boolean;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  public isInclusive!: boolean;
}

export default TaxRule;
