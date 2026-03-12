import { Column, DataType, Default, HasMany, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';
import Deal from '../deal/model/dealModel';
import Project from '../project/models/projectModel';
import Lead from '../lead/leadModel';
import Client from '../client/clientModel';

/**
 * Plan tiers control per-tenant rate limits and feature caps.
 */
export type TenantPlan = 'free' | 'pro' | 'enterprise';

export interface TenantSettings {
  /** Custom branding color */
  brandColor?: string;
  /** Custom timezone */
  timezone?: string;
  /** Feature flags */
  features?: Record<string, boolean>;
  [key: string]: any;
}

@Table({
  tableName: 'Tenants',
  modelName: 'Tenant',
  timestamps: true
})
class Tenant extends Model {
  @Column({ type: DataType.UUID, primaryKey: true, defaultValue: DataType.UUIDV4 })
  public id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  public name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true
  })
  public domain?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  public logo?: string;

  @Default('ACTIVE')
  @Column({
    type: DataType.ENUM('ACTIVE', 'SUSPENDED', 'TRIAL'),
    allowNull: false
  })
  public status!: string;

  /**
   * Subscription plan tier. Determines rate limits and feature caps.
   * free  = 100 req/min
   * pro   = 500 req/min
   * enterprise = 2000 req/min
   */
  @Default('free')
  @Column({
    type: DataType.ENUM('free', 'pro', 'enterprise'),
    allowNull: false,
    defaultValue: 'free'
  })
  public plan!: TenantPlan;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 5 // Default max users for a new workspace
  })
  public maxUsers!: number;

  /**
   * Maximum storage in MB. Defaults to 500 MB for free tier.
   */
  @Default(500)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 500
  })
  public maxStorageMB!: number;

  /**
   * Flexible JSONB settings for tenant-specific configuration.
   */
  @Default({})
  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {}
  })
  public settings!: TenantSettings;

  /**
   * Whether the tenant is currently active. Suspended tenants cannot login.
   */
  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true
  })
  public isActive!: boolean;

  @HasMany(() => User)
  public users!: User[];

  @HasMany(() => Deal)
  public deals!: Deal[];

  @HasMany(() => Project)
  public projects!: Project[];

  @HasMany(() => Lead)
  public leads!: Lead[];

  @HasMany(() => Client)
  public clients!: Client[];

  public toJSON(): Record<string, unknown> {
    return { ...this.get() };
  }
}

export default Tenant;
