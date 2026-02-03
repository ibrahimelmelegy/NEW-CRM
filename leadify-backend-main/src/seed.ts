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

        // 0. RESET ALL ROLES (Delete all roles except SUPER_ADMIN if needed, or just delete ALL and recreate)
        const roleModel = Role as any;

        // Delete all roles NOT named SUPER_ADMIN
        const { Op } = require('sequelize');
        await roleModel.destroy({
            where: {
                name: { [Op.ne]: 'SUPER_ADMIN' }
            }
        });
        console.log('🗑️  Deleted all non-SUPER_ADMIN roles.');

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

        // 2. DELETE ALL EXISTING USERS (Complete cleanup with Cascade)
        // using TRUNCATE CASCADE to handle all foreign key constraints automatically
        await sequelize.query('TRUNCATE TABLE "Users" RESTART IDENTITY CASCADE');
        console.log(`🗑️  Truncated Users table and all dependent records.`);

        const userModel = User as any;


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
