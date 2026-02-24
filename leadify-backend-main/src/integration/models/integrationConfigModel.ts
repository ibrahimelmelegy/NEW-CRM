import { Column, DataType, Model, Table, ForeignKey, BelongsTo, Default } from 'sequelize-typescript';
import User from '../../user/userModel';

export enum IntegrationType {
  SLACK = 'SLACK',
  GOOGLE_DRIVE = 'GOOGLE_DRIVE',
  STRIPE = 'STRIPE',
  MOYASAR = 'MOYASAR',
  ZAPIER = 'ZAPIER',
  MAILCHIMP = 'MAILCHIMP',
  HUBSPOT = 'HUBSPOT',
  JIRA = 'JIRA',
  TRELLO = 'TRELLO'
}

export enum IntegrationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR'
}

@Table({
  tableName: 'integration_configs',
  modelName: 'IntegrationConfig',
  timestamps: true
})
class IntegrationConfig extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  public id!: string;

  @Column({
    type: DataType.ENUM(...Object.values(IntegrationType)),
    allowNull: false
  })
  public type!: IntegrationType;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  public name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  public description?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  public config?: Record<string, any>;

  @Default(IntegrationStatus.INACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(IntegrationStatus)),
    allowNull: false
  })
  public status!: IntegrationStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  public lastSyncedAt?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  public lastError?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public tenantId?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  public userId?: number;

  @BelongsTo(() => User)
  public user?: User;
}

export default IntegrationConfig;
