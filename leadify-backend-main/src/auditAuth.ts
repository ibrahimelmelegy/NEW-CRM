import { sequelize } from './config/db';
import User from './user/userModel';
import Role from './role/roleModel';
import Lead from './lead/leadModel';
import LeadUsers from './lead/model/lead_UsersModel';

const auditAuth = async () => {
  try {
    const users = await User.findAll({ include: [{ model: Role, as: 'role' }] });
    // USER AUDIT
    users.forEach(u => {
      // User audit entry processed
    });

    const leadAssignments = await LeadUsers.findAll();
    // LEAD ASSIGNMENTS audit
    leadAssignments.forEach(la => {
      // Lead assignment entry processed
    });
  } catch (e: unknown) {
    console.error('❌ Audit Error:', e.message);
  }
  process.exit();
};
auditAuth();
