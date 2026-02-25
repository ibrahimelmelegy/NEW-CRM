import { Column, DataType, Default, HasMany, Model, Table } from 'sequelize-typescript';
import User from '../user/userModel';
import Deal from '../deal/model/dealModel';
import Project from '../project/models/projectModel';
import Lead from '../lead/leadModel';
import Client from '../client/clientModel';

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

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 5 // Default max users for a new workspace
  })
  public maxUsers!: number;

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
