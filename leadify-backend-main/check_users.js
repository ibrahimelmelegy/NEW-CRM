const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: false
});

const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'Users', timestamps: true });

async function checkUsers() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({ attributes: ['email'] });
        console.log('--- Users in DB ---');
        users.forEach(u => console.log(u.email));
        console.log('-------------------');

        // Reset admin@hp-tech.com to a known password
        const hashedPassword = await bcrypt.hash('HPTech@Admin2026!', 12);
        const [updated] = await User.update(
            { password: hashedPassword },
            { where: { email: 'admin@hp-tech.com' } }
        );
        if (updated) {
            console.log('Reset password for admin@hp-tech.com to HPTech@Admin2026!');
        } else {
            console.log('admin@hp-tech.com not found. Could not reset.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
}

checkUsers();
