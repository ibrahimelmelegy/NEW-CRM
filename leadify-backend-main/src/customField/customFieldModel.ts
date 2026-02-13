import { Column, DataType, Default, Model, Table } from 'sequelize-typescript';
import { CustomFieldType, CustomFieldEntity } from './customFieldEnum';

@Table({
  tableName: 'custom_fields',
  modelName: 'CustomField',
  timestamps: true
})
class CustomField extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public fieldName!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public fieldLabel!: string;

  @Column({
    type: DataType.ENUM(...Object.values(CustomFieldType)),
    allowNull: false
  })
  public fieldType!: string;

  @Column({
    type: DataType.ENUM(...Object.values(CustomFieldEntity)),
    allowNull: false
  })
  public entityType!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public options?: string[];

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public required!: boolean;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public sortOrder!: number;
}

export default CustomField;
