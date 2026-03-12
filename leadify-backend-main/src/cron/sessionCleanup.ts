import cron from 'node-cron';
import { Op } from 'sequelize';
import Session from '../user/models/sessionModel';
import logger from '../config/logger';

// Run every hour to clean up expired sessions
export const sessionCleanupCron = cron.schedule('0 * * * *', async () => {
  try {
    const deletedCount = await Session.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date()
        }
      }
    });

    if (deletedCount > 0) {
      // Expired sessions cleaned up
    }
  } catch (error) {
    logger.error({ error }, '[Cron] Error cleaning up expired sessions');
  }
});
