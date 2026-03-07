import redisClient from './config/redis';
import { sequelize } from './config/db';
import Lead from './lead/leadModel';

const diagnose = async () => {
  // DIAGNOSE AUDIT
  // 1. Check DB Connection
  try {
    await sequelize.authenticate();
    // Database Connection: OK
  } catch (error) {
    console.error('Database Connection: FAILED', (error as Error).message);
  }

  // 2. Check Redis Connection
  try {
    if (!redisClient.isOpen) {
      // Fail fast if Redis is down
      await Promise.race([redisClient.connect(), new Promise((_, reject) => setTimeout(() => reject(new Error('Redis Timeout')), 2000))]);
    }
    // Redis Connection: OK
  } catch (error) {
    console.warn('Redis Connection: FAILED (Caching will be skipped)');
  }

  // 3. Check Data
  try {
    const _leadCount = await Lead.count();
    // Lead count retrieved
  } catch (error) {
    console.error('Data Access Error:', (error as Error).message);
  }

  // Diagnose complete
  process.exit();
};

diagnose();
