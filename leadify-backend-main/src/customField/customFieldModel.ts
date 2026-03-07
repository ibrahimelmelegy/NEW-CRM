import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import { CustomFieldType, CustomFieldEntity } from './customFieldEnum';
import User from '../user/userModel';

@Table({
  tableName: 'custom_fields',
  modelName: 'CustomField',
  timestamps: true,
  indexes: [{ fields: ['entityType'] }, { fields: ['entityType', 'isActive'] }, { fields: ['fieldName', 'entityType'], unique: true }]
})
class CustomField extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({
    type: DataType.ENUM(...Object.values(CustomFieldEntity)),
    allowNull: false
  })
  public entityType!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public fieldName!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public fieldLabel!: string;

  @Column({
    type: DataType.ENUM(...Object.values(CustomFieldType)),
    allowNull: false
  })
  public fieldType!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public options?: Array<{ value: string; label: string }>;

  @Column({ type: DataType.STRING, allowNull: true })
  public defaultValue?: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isRequired!: boolean;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public sortOrder!: number;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isActive!: boolean;

  @Column({ type: DataType.JSONB, allowNull: true })
  public validationRules?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  public createdBy?: string;

  @BelongsTo(() => User, { foreignKey: 'createdBy', as: 'creator' })
  public creator?: User;

  // Keep backward compat with old 'required' column name
  get required(): boolean {
    return this.isRequired;
  }
}

export default CustomField;
