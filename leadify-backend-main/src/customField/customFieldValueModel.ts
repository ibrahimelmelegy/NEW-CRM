import { Column, DataType, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import CustomField from './customFieldModel';

@Table({
  tableName: 'custom_field_values',
  modelName: 'CustomFieldValue',
  timestamps: true,
  indexes: [
    { fields: ['entityId', 'entityType'] },
    { fields: ['customFieldId'] }
  ]
})
class CustomFieldValue extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @ForeignKey(() => CustomField)
  @Column({ type: DataType.UUID, allowNull: false })
  public customFieldId!: string;

  @BelongsTo(() => CustomField)
  public customField!: CustomField;

  @Column({ type: DataType.UUID, allowNull: false })
  public entityId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public entityType!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public value?: any;
}

export default CustomFieldValue;
