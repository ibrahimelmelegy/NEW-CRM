import { Op } from 'sequelize';
import { sequelize } from './config/db';
import User from './user/userModel';
import Role from './role/roleModel';
import bcrypt from 'bcryptjs';
import { getAllPermissions } from './role/roleEnum';

async function seed() {
  try {
    await sequelize.authenticate();
    // Connected to database for seeding

    // Get ALL permissions from the system
    const allPermissions = getAllPermissions();
    // Permissions loaded

    // 0. RESET ALL ROLES (Delete all roles except SUPER_ADMIN if needed, or just delete ALL and recreate)
    const roleModel = Role as Record<string, unknown>;

    // Delete all roles NOT named SUPER_ADMIN
    await roleModel.destroy({
      where: {
        name: { [Op.ne]: 'SUPER_ADMIN' }
      }
    });
    // Deleted all non-SUPER_ADMIN roles

    // First, try to find existing SUPER_ADMIN role
    let adminRole = await roleModel.findOne({ where: { name: 'SUPER_ADMIN' } });

    if (adminRole) {
      // Update existing role with all permissions
      await adminRole.update({ permissions: allPermissions });
      // Updated existing SUPER_ADMIN role with all permissions
    } else {
      // Create new role with all permissions
      adminRole = await roleModel.create({
        name: 'SUPER_ADMIN',
        description: 'System Administrator with full access',
        permissions: allPermissions
      });
      // Created new SUPER_ADMIN role with all permissions
    }

    // 2. DELETE ALL EXISTING USERS (Complete cleanup with Cascade)
    // using TRUNCATE CASCADE to handle all foreign key constraints automatically
    await sequelize.query('TRUNCATE TABLE "Users" RESTART IDENTITY CASCADE');
    // Truncated Users table and all dependent records

    const userModel = User as Record<string, unknown>;

    // 3. Create Fresh Super Admin (credentials from environment variables)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('FATAL: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required. No defaults allowed.');
      process.exit(1);
    }

    if (adminPassword.length < 8) {
      console.error('ADMIN_PASSWORD must be at least 8 characters.');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const _newAdmin = await userModel.create({
      name: 'System Admin',
      email: adminEmail,
      password: hashedPassword,
      roleId: adminRole.id,
      status: 'ACTIVE'
    });

    // Super Admin created successfully

    // 4. Verify the user was created correctly
    const verifyUser = await userModel.findOne({ where: { email: adminEmail } });
    if (verifyUser) {
      // Verification passed - User exists in database
      const _passwordMatch = await bcrypt.compare(adminPassword, verifyUser.password);
      // Password verification completed
    } else {
      console.error('Verification failed - User not found!');
    }

    // Seeding completed successfully
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
