import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
  tableName: 'email_templates',
  modelName: 'EmailTemplate',
  timestamps: true
})
class EmailTemplate extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public subject!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  public htmlContent!: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  public variables?: string[];

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;
}

export default EmailTemplate;
