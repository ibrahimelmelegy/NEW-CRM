import { sequelize } from './config/db';
import User from './user/userModel';
import Role from './role/roleModel';
import bcrypt from 'bcryptjs';
import { getAllPermissions } from './role/roleEnum';

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database for seeding.');

        // Get ALL permissions from the system
        const allPermissions = getAllPermissions();
        console.log(`📋 Found ${allPermissions.length} permissions in the system.`);

        // 1. Create/Update Default Roles
        const roleModel = Role as any;

        // First, try to find existing SUPER_ADMIN role
        let adminRole = await roleModel.findOne({ where: { name: 'SUPER_ADMIN' } });

        if (adminRole) {
            // Update existing role with all permissions
            await adminRole.update({ permissions: allPermissions });
            console.log('✅ Updated existing SUPER_ADMIN role with all permissions.');
        } else {
            // Create new role with all permissions
            adminRole = await roleModel.create({
                name: 'SUPER_ADMIN',
                description: 'System Administrator with full access',
                permissions: allPermissions
            });
            console.log('✅ Created new SUPER_ADMIN role with all permissions.');
        }

        console.log(`   SUPER_ADMIN Role ID: ${adminRole.id}`);

        // 2. DELETE ALL EXISTING USERS (Complete cleanup)
        const userModel = User as any;
        const deletedCount = await userModel.destroy({ where: {} });
        console.log(`🗑️  Deleted ${deletedCount} existing user(s) from database.`);

        // 3. Create Fresh Super Admin
        const adminEmail = 'admin@hp-tech.com';
        const adminPassword = 'Heroo@1502';

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const newAdmin = await userModel.create({
            name: 'System Admin',
            email: adminEmail,
            password: hashedPassword,
            roleId: adminRole.id,
            status: 'ACTIVE'
        });

        console.log('🚀 Super Admin created successfully!');
        console.log(`   ID: ${newAdmin.id}`);
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log(`   Role ID: ${newAdmin.roleId}`);
        console.log(`   Status: ${newAdmin.status}`);

        // 4. Verify the user was created correctly
        const verifyUser = await userModel.findOne({ where: { email: adminEmail } });
        if (verifyUser) {
            console.log('✅ Verification passed - User exists in database!');
            const passwordMatch = await bcrypt.compare(adminPassword, verifyUser.password);
            console.log(`✅ Password verification: ${passwordMatch ? 'CORRECT' : 'FAILED'}`);
        } else {
            console.log('❌ Verification failed - User not found!');
        }

        console.log('🌱 Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
