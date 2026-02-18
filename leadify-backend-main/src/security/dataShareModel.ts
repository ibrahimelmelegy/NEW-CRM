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
import User from '../user/userModel';

export enum DefaultAccessLevel {
  PRIVATE = 'PRIVATE',
  READ_ONLY = 'READ_ONLY',
  READ_WRITE = 'READ_WRITE',
  FULL_ACCESS = 'FULL_ACCESS'
}

export enum ShareAccessLevel {
  READ = 'READ',
  WRITE = 'WRITE',
  FULL = 'FULL'
}

@Table({
  tableName: 'data_sharing_rules',
  modelName: 'DataSharingRule',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['entityType'],
      name: 'data_sharing_rules_entity_type_unique'
    }
  ]
})
export class DataSharingRule extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  entityType!: string;

  @Default(DefaultAccessLevel.PRIVATE)
  @Column({
    type: DataType.ENUM(...Object.values(DefaultAccessLevel)),
    allowNull: false,
    defaultValue: DefaultAccessLevel.PRIVATE
  })
  defaultAccess!: DefaultAccessLevel;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  hierarchyAccess!: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string | null;
}

@Table({
  tableName: 'record_shares',
  modelName: 'RecordShare',
  timestamps: true,
  indexes: [
    {
      fields: ['entityType', 'entityId'],
      name: 'record_shares_entity_type_id'
    },
    {
      fields: ['sharedWithUserId'],
      name: 'record_shares_shared_with_user'
    },
    {
      fields: ['sharedWithRoleId'],
      name: 'record_shares_shared_with_role'
    }
  ]
})
export class RecordShare extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  entityType!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  entityId!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  sharedWithUserId!: number | null;

  @Column({ type: DataType.UUID, allowNull: true })
  sharedWithRoleId!: string | null;

  @Default(ShareAccessLevel.READ)
  @Column({
    type: DataType.ENUM(...Object.values(ShareAccessLevel)),
    allowNull: false,
    defaultValue: ShareAccessLevel.READ
  })
  accessLevel!: ShareAccessLevel;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  sharedBy!: number;

  @Column({ type: DataType.DATE, allowNull: true })
  expiresAt!: Date | null;

  @BelongsTo(() => User, 'sharedWithUserId')
  sharedWithUser!: User;

  @BelongsTo(() => User, 'sharedBy')
  sharedByUser!: User;
}
