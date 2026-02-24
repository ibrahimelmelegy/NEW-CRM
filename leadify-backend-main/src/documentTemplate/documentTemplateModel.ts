import { BelongsTo, Column, DataType, Default, ForeignKey, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

export enum DocumentTemplateType {
  INVOICE = 'INVOICE',
  PURCHASE_ORDER = 'PURCHASE_ORDER'
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'table' | 'line' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, any>;
}

export interface TemplateLayout {
  pageSize: string;
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  elements: TemplateElement[];
  variables: string[];
}

@Table({
  tableName: 'document_templates',
  modelName: 'DocumentTemplate',
  timestamps: true
})
class DocumentTemplate extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  public name!: string;

  @Column({
    type: DataType.ENUM(...Object.values(DocumentTemplateType)),
    allowNull: false
  })
  public type!: DocumentTemplateType;

  @Column({
    type: DataType.JSONB,
    allowNull: false
  })
  public layout!: TemplateLayout;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  public headerConfig?: Record<string, any>;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  public footerConfig?: Record<string, any>;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  public tableConfig?: Record<string, any>;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false
  })
  public isDefault!: boolean;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  public userId?: number;

  @BelongsTo(() => User, { as: 'user' })
  public user?: User;
}

export default DocumentTemplate;
