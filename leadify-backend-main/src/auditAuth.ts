import { sequelize } from './config/db';
import User from './user/userModel';
import Role from './role/roleModel';
import Lead from './lead/leadModel';
import LeadUsers from './lead/model/lead_UsersModel';

const auditAuth = async () => {
  try {
    const users = await User.findAll({ include: [{ model: Role, as: 'role' }] });
    console.log('--- USER AUDIT ---');
    users.forEach(u => {
      console.log(`User: ${u.name} (ID: ${u.id})`);
      console.log(`Role: ${u.role?.name || 'NONE'}`);
      console.log(`Permissions Count: ${u.role?.permissions?.length || 0}`);
      // console.log(`Permissions: ${u.role?.permissions?.join(', ')}`);
    });

    const leadAssignments = await LeadUsers.findAll();
    console.log(`--- LEAD ASSIGNMENTS (${leadAssignments.length}) ---`);
    leadAssignments.forEach(la => {
      console.log(`Lead ID: ${la.leadId} -> User ID: ${la.userId}`);
    });
  } catch (e: any) {
    console.error('❌ Audit Error:', e.message);
  }
  process.exit();
};
auditAuth();
