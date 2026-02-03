
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

async function deleteAdmin() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        const email = 'admin@lead.com';
        const [results] = await sequelize.query(`DELETE FROM "Users" WHERE email = '${email}' RETURNING *`);

        if (results.length > 0) {
            console.log(`✅ Deleted user: ${email}`);
        } else {
            console.log(`ℹ️ User ${email} not found.`);
        }

        // We can optionally delete the role if we want to be super clean, but User rejection was the main point.
        // Let's leave the Role as it might be useful or standard.

    } catch (error) {
        console.error('❌ Failed to delete admin:', error);
    } finally {
        await sequelize.close();
    }
}

deleteAdmin();
