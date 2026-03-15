import dotenv from 'dotenv';
dotenv.config();
import { sequelize } from './config/db';
import logger from './config/logger';
import User from './user/userModel';

async function clean() {
  try {
    await sequelize.authenticate();
    // Connected to DB for cleanup

    // Delete all users
    const _deleted = await User.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    // Users table truncated
  } catch (error) {
    logger.error('Cleanup failed: ' + error);
  } finally {
    await sequelize.close();
  }
}

clean();
