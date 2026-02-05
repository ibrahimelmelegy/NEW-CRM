import { Column, DataType, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from '../user/userModel';

@Table({
    tableName: 'integrations',
    modelName: 'Integration',
    timestamps: true
})
class Integration extends Model {
    @Column({
        primaryKey: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4
    })
    public id!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    public provider!: 'google' | 'outlook' | 'whatsapp' | 'openai';

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    public accessToken?: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    public refreshToken?: string;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    public tokenExpiry?: Date;

    @Column({
        type: DataType.JSONB,
        allowNull: true
    })
    public config?: any; // For clientID, clientSecret, or WhatsApp ID

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: true // Null means system-wide integration
    })
    public userId?: number;

    @BelongsTo(() => User)
    public user?: User;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true
    })
    public isActive!: boolean;
}

export default Integration;
