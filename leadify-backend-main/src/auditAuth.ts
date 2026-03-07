import User from './user/userModel';
import Role from './role/roleModel';
import LeadUsers from './lead/model/lead_UsersModel';

const auditAuth = async () => {
  try {
    const users = await User.findAll({ include: [{ model: Role, as: 'role' }] });
    // USER AUDIT
    users.forEach(_u => {
      // User audit entry processed
    });

    const leadAssignments = await LeadUsers.findAll();
    // LEAD ASSIGNMENTS audit
    leadAssignments.forEach(_la => {
      // Lead assignment entry processed
    });
  } catch (e) {
    console.error('❌ Audit Error:', (e as Error).message);
  }
  process.exit();
};
auditAuth();
