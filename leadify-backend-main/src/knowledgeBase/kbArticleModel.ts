import { Column, DataType, Default, ForeignKey, BelongsTo, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

@Table({
  tableName: 'kb_articles',
  modelName: 'KBArticle',
  timestamps: true
})
class KBArticle extends Model {
  @Column({ primaryKey: true, type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  public title!: string;

  @Column({ type: DataType.STRING(500), allowNull: false, unique: true })
  public slug!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  public content!: string;

  @Column({ type: DataType.STRING(1000), allowNull: true })
  public excerpt?: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  public category?: string;

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: true })
  public tags?: string[];

  @Default(ArticleStatus.DRAFT)
  @Column({ type: DataType.ENUM(...Object.values(ArticleStatus)), allowNull: false })
  public status!: string;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public viewCount!: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public helpfulCount!: number;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public sortOrder!: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  public authorId?: number;

  @BelongsTo(() => User)
  public author?: User;
}

export default KBArticle;
