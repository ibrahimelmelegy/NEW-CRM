
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT) {
    console.error('Error: Missing database environment variables in .env file');
    process.exit(1);
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: false
});

// Define models matching the actual codebase
// Role: id (UUID), name (STRING), permissions (ARRAY(STRING))
const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    permissions: {
        type: DataTypes.ARRAY(DataTypes.STRING), // Corrected to match Postgres ARRAY type
        defaultValue: []
    }
}, {
    tableName: 'roles',
    timestamps: true
});

// User: id (INTEGER), name, email, password, roleId (UUID)
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    roleId: {
        type: DataTypes.UUID,
        references: {
            model: Role,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE'
    }
}, {
    tableName: 'Users',
    timestamps: true
});

const STAFF_PERMISSIONS = [
    'VIEW_DASHBOARD',
    'VIEW_CONTACTS',
    'CREATE_CONTACT',
    'EDIT_CONTACT',
    'DELETE_CONTACT',
    'VIEW_LEADS',
    'CREATE_LEAD',
    'EDIT_LEAD',
    'DELETE_LEAD',
    'VIEW_OPPORTUNITIES',
    'CREATE_OPPORTUNITY',
    'EDIT_OPPORTUNITY',
    'DELETE_OPPORTUNITY',
    'VIEW_TASKS',
    'CREATE_TASK',
    'EDIT_TASK',
    'DELETE_TASK',
    'VIEW_GLOBAL_STAFF',
    'CREATE_STAFF',
    'EDIT_STAFF',
    'DELETE_STAFF',
    'VIEW_ROLES',
    'CREATE_ROLE',
    'EDIT_ROLE',
    'DELETE_ROLE'
];


async function createAdmin() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        // 1. Find or Create Role
        let role = await Role.findOne({ where: { name: 'Super Admin' } });

        if (!role) {
            console.log('Role "Super Admin" not found. Creating it...');
            role = await Role.create({
                name: 'Super Admin',
                permissions: STAFF_PERMISSIONS
            });
            console.log('✅ Created role: Super Admin');
        } else {
            console.log('ℹ️ Role "Super Admin" already exists. Using it.');
            console.log('Role ID:', role.id);
        }

        // 2. Find or Create User
        const adminEmail = 'admin@lead.com';
        let superAdmin = await User.findOne({ where: { email: adminEmail } });

        if (!superAdmin) {
            console.log(`User "${adminEmail}" not found. Creating it...`);
            const defaultPassword = process.env.ADMIN_PASSWORD || 'HPTech@Admin2026!';
            const hashedPassword = await bcrypt.hash(defaultPassword, 12);

            superAdmin = await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                roleId: role.id,
                status: 'ACTIVE'
            });
            console.log(`✅ Created user: ${adminEmail}`);
            console.log(`⚠️  Change the default password immediately after first login!`);
        } else {
            console.log(`ℹ️ User "${adminEmail}" already exists.`);
        }

    } catch (error) {
        console.error('❌ Failed to create admin:', error);
    } finally {
        await sequelize.close();
    }
}

createAdmin();
