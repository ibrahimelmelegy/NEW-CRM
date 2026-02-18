import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table
} from 'sequelize-typescript';
import User from '../user/userModel';

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

@Table({
  tableName: 'tasks',
  modelName: 'Task',
  timestamps: true,
  indexes: [
    { fields: ['assignedTo'] },
    { fields: ['createdBy'] },
    { fields: ['status'] },
    { fields: ['dueDate'] },
    { fields: ['entityType', 'entityId'] },
    { fields: ['parentTaskId'] }
  ]
})
class Task extends Model {
  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true
  })
  public id!: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: false
  })
  public title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  public description?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  public entityType?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  public entityId?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public assignedTo!: number;

  @BelongsTo(() => User, { as: 'assignee', foreignKey: 'assignedTo' })
  public assignee?: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  public createdBy!: number;

  @BelongsTo(() => User, { as: 'creator', foreignKey: 'createdBy' })
  public creator?: User;

  @Column({
    type: DataType.ENUM(...Object.values(TaskStatus)),
    allowNull: false,
    defaultValue: TaskStatus.PENDING
  })
  public status!: TaskStatus;

  @Column({
    type: DataType.ENUM(...Object.values(TaskPriority)),
    allowNull: false,
    defaultValue: TaskPriority.MEDIUM
  })
  public priority!: TaskPriority;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  public dueDate?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  public completedAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  public reminderDate?: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  public reminderSent!: boolean;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: []
  })
  public tags!: string[];

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  public recurringPattern?: string;

  @ForeignKey(() => Task)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  public parentTaskId?: number;

  @BelongsTo(() => Task, { as: 'parentTask', foreignKey: 'parentTaskId' })
  public parentTask?: Task;

  @HasMany(() => Task, { as: 'subtasks', foreignKey: 'parentTaskId' })
  public subtasks?: Task[];
}

export default Task;
