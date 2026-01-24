
const { Sequelize } = require('sequelize');
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

async function listUsers() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        const [results] = await sequelize.query('SELECT id, email, name, status, "roleId" FROM "Users"');

        console.log('\n--- Registered Users ---');
        if (results.length === 0) {
            console.log('No users found in the database. You may need to run the seeder.');
        } else {
            console.table(results);
        }
        console.log('------------------------\n');

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    } finally {
        await sequelize.close();
    }
}

listUsers();
