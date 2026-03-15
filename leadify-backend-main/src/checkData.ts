import { sequelize } from './config/db';
import logger from './config/logger';
import Lead from './lead/leadModel';
import Deal from './deal/model/dealModel';
import User from './user/userModel';

const checkData = async () => {
  // DATA AUDIT
  try {
    await sequelize.authenticate();
    // DB Connected

    const leads = await Lead.count();
    const _deals = await Deal.count();
    const _users = await User.count();

    // Data counts retrieved

    if (leads > 0) {
      const _sample = await Lead.findOne({ order: [['id', 'DESC']] });
      // Latest lead retrieved
    }

    if (leads === 0) {
      logger.warn('DATABASE IS EMPTY OF LEADS.');
    }
  } catch (e) {
    logger.error('Data Audit Error: ' + (e as Error).message);
  }
  // Audit complete
  process.exit();
};
checkData();
