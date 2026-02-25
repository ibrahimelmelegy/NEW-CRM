import dotenv from 'dotenv';
dotenv.config();
import { sequelize } from './config/db';
import User from './user/userModel';

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');

    // Check specific user
    const email = 'admin@hpt-crm.com';
    console.log(`Searching for: ${email}`);
    const user = await User.findOne({ where: { email } });
    if (user) {
      console.log('✅ User found:', user.toJSON());
      console.log('Password hash:', user.password);
    } else {
      console.log('❌ User NOT found via findOne.');
    }

    // List all users to see what's actually there
    const allUsers = await User.findAll();
    console.log(`Total users in DB: ${allUsers.length}`);
    allUsers.forEach(u => console.log(`- ID: ${u.id}, Email: '${u.email}', Status: ${u.status}`));
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await sequelize.close();
  }
}

check();
