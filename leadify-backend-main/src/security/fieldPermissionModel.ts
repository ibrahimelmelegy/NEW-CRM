import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  Index
} from 'sequelize-typescript';
import Role from '../role/roleModel';

export enum FieldAccess {
  VISIBLE = 'VISIBLE',
  EDITABLE = 'EDITABLE',
  HIDDEN = 'HIDDEN'
}

@Table({
  tableName: 'field_permissions',
  modelName: 'FieldPermission',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['roleId', 'entityType', 'fieldName'],
      name: 'field_permissions_role_entity_field_unique'
    }
  ]
})
export default class FieldPermission extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @ForeignKey(() => Role)
  @Column({ type: DataType.UUID, allowNull: false })
  roleId!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  entityType!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  fieldName!: string;

  @Default(FieldAccess.VISIBLE)
  @Column({
    type: DataType.ENUM(...Object.values(FieldAccess)),
    allowNull: false,
    defaultValue: FieldAccess.VISIBLE
  })
  access!: FieldAccess;

  @BelongsTo(() => Role)
  role!: Role;
}
