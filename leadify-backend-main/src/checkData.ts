import { sequelize } from './config/db';
import Lead from './lead/leadModel';
import Deal from './deal/model/dealModel';
import User from './user/userModel';

const checkData = async () => {
  console.log('--- DATA AUDIT ---');
  try {
    await sequelize.authenticate();
    console.log('✅ DB Connected');

    const leads = await Lead.count();
    const deals = await Deal.count();
    const users = await User.count();

    console.log(`Leads Count: ${leads}`);
    console.log(`Deals Count: ${deals}`);
    console.log(`Users Count: ${users}`);

    if (leads > 0) {
      const sample = await Lead.findOne({ order: [['id', 'DESC']] });
      console.log('Latest Lead ID:', sample?.id);
      console.log('Latest Lead Name:', sample?.name);
      console.log('Latest Lead Status:', sample?.status);
    }

    if (leads === 0) {
      console.warn('⚠️  DATABASE IS EMPTY OF LEADS.');
    }
  } catch (e: any) {
    console.error('❌ Data Audit Error:', e.message);
  }
  console.log('-------------------');
  process.exit();
};
checkData();
