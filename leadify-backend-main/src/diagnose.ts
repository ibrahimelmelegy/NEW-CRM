import redisClient from './config/redis';
import { sequelize } from './config/db';
import Lead from './lead/leadModel';
import Deal from './deal/model/dealModel';

const diagnose = async () => {
  console.log('--- DIAGNOSE AUDIT ---');
  // 1. Check DB Connection
  try {
    await sequelize.authenticate();
    console.log('✅ Database Connection: OK');
  } catch (error: any) {
    console.error('❌ Database Connection: FAILED', error.message);
  }

  // 2. Check Redis Connection
  try {
    if (!redisClient.isOpen) {
      // Fail fast if Redis is down
      await Promise.race([redisClient.connect(), new Promise((_, reject) => setTimeout(() => reject(new Error('Redis Timeout')), 2000))]);
    }
    console.log('✅ Redis Connection: OK');
  } catch (error: any) {
    console.warn('⚠️  Redis Connection: FAILED (Caching will be skipped)');
  }

  // 3. Check Data
  try {
    const leadCount = await Lead.count();
    console.log(`📊 Leads in DB: ${leadCount}`);
  } catch (error: any) {
    console.error('❌ Data Access Error:', error.message);
  }

  console.log('-----------------------');
  process.exit();
};

diagnose();
