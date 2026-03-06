import { sequelize } from './config/db';
import Lead from './lead/leadModel';
import Deal from './deal/model/dealModel';
import User from './user/userModel';

const checkData = async () => {
  // DATA AUDIT
  try {
    await sequelize.authenticate();
    // DB Connected

    const leads = await Lead.count();
    const deals = await Deal.count();
    const users = await User.count();

    // Data counts retrieved

    if (leads > 0) {
      const sample = await Lead.findOne({ order: [['id', 'DESC']] });
      // Latest lead retrieved
    }

    if (leads === 0) {
      console.warn('DATABASE IS EMPTY OF LEADS.');
    }
  } catch (e) {
    console.error('Data Audit Error:', e.message);
  }
  // Audit complete
  process.exit();
};
checkData();
