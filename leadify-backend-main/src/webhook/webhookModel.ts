import { Column, DataType, Default, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'webhooks',
  modelName: 'Webhook',
  timestamps: true
})
class Webhook extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public url!: string;

  @Column({ type: DataType.JSONB, allowNull: false })
  public events!: string[];

  @Column({ type: DataType.STRING, allowNull: false })
  public secret!: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  public isActive!: boolean;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public failureCount!: number;

  @Column({ type: DataType.DATE, allowNull: true })
  public lastTriggered?: Date;
}

export default Webhook;
