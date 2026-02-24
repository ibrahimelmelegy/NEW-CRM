import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'composer_email_templates', modelName: 'ComposerTemplate', timestamps: true })
class ComposerTemplate extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public subject!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  public body!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  public category!: string; // 'follow-up', 'introduction', 'proposal', 'thank-you', 'win-back'

  @Column({ type: DataType.JSON, allowNull: true })
  public variables!: string[]; // ['firstName', 'dealName', 'companyName']

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId!: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  public isDefault!: boolean;
}

export default ComposerTemplate;
