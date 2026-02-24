import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'playbooks', modelName: 'Playbook', timestamps: true })
class Playbook extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  public description!: string;

  @Column({ type: DataType.JSON, allowNull: false })
  public stages!: PlaybookStage[];

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  public isActive!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  public tenantId!: string;
}

interface PlaybookStage {
  id: string;
  name: string;
  description: string;
  order: number;
  steps: PlaybookStep[];
  tips: string[];
}

interface PlaybookStep {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  resources?: string[];
}

export default Playbook;
export { PlaybookStage, PlaybookStep };
