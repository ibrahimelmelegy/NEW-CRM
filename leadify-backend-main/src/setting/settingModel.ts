import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'settings',
  modelName: 'Setting',
  timestamps: true
})
class Setting extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  // @Column({
  //   type: DataType.STRING,
  //   allowNull: true
  // })
  // public secretKey?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public emailApiKey?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public name?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public email?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public logo?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public favIcon?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public primaryColor?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public secondaryColor?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public accentColor?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  public fontFamily?: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true
  })
  public companyAddress?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  public companyPhone?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  public companyTaxId?: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true
  })
  public brandFooterText?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  public companyWebsite?: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    defaultValue: 'INV-'
  })
  public invoicePrefix?: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    defaultValue: 'QT-'
  })
  public quotePrefix?: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: true,
    defaultValue: 'USD'
  })
  public defaultCurrency?: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: true,
    defaultValue: 'en'
  })
  public defaultLanguage?: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    defaultValue: 'DD/MM/YYYY'
  })
  public dateFormat?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    defaultValue: 'Asia/Riyadh'
  })
  public timezone?: string;
}

export default Setting;
