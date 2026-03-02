
import { sequelize } from '../src/config/db';
import User from '../src/user/userModel';

async function activateUser() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const email = process.env.ADMIN_EMAIL || 'admin@hp-tech.com';
        const userModel = User as any;

        const user = await userModel.findOne({ where: { email } });

        if (!user) {
            console.log('❌ User not found!');
            process.exit(1);
        }

        console.log(`Current status: ${user.status}`);

        if (user.status !== 'ACTIVE') {
            await user.update({ status: 'ACTIVE' });
            console.log('✅ User updated to ACTIVE.');
        } else {
            console.log('✅ User is already ACTIVE.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

activateUser();
