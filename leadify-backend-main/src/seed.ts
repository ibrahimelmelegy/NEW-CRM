import { sequelize } from './config/db';
import User from './user/userModel';
import Role from './role/roleModel';
import bcrypt from 'bcryptjs';

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database for seeding.');

        // 1. Create Default Roles
        // Cast Role as any to bypass strictly missing static method type if inheritance is tricky
        const roleModel = Role as any;
        const [adminRole] = await roleModel.findOrCreate({
            where: { name: 'SUPER_ADMIN' },
            defaults: {
                description: 'System Administrator with full access',
                permissions: ['*'] // wildcard for all permissions
            }
        });

        console.log('Roles initialized.');

        // 2. Create Super Admin User
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@hpt-crm.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

        const userModel = User as any;
        const existingAdmin = await userModel.findOne({ where: { email: adminEmail } });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await userModel.create({
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                roleId: adminRole.id,
                status: 'ACTIVE'
            });
            console.log(`🚀 Super Admin created: ${adminEmail} / ${adminPassword}`);
        } else {
            console.log('✅ Super Admin already exists.');
        }

        console.log('🌱 Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
