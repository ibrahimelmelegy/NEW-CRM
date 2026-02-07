
import redisClient from './src/config/redis';
import { sequelize } from './src/config/db';
import Lead from './src/lead/leadModel';
import Deal from './src/deal/model/dealModel';

const diagnose = async () => {
    console.log('🔍 STARTING SYSTEM DIAGNOSIS...');

    // 1. Check DB Connection
    try {
        await sequelize.authenticate();
        console.log('✅ Database Connection: OK');
    } catch (error) {
        console.error('❌ Database Connection: FAILED', error);
    }

    // 2. Check Redis Connection
    try {
        if (!redisClient.isOpen) await redisClient.connect();
        await redisClient.set('test_key', 'OK');
        const val = await redisClient.get('test_key');
        console.log(`✅ Redis Connection: ${val === 'OK' ? 'OK' : 'FAIL'}`);
    } catch (error) {
        console.error('❌ Redis Connection: FAILED', error);
    }

    // 3. Check Data Existence
    try {
        const leadCount = await Lead.count();
        console.log(`📊 Total Leads in DB: ${leadCount}`);

        const dealCount = await Deal.count();
        console.log(`💰 Total Deals in DB: ${dealCount}`);

        if (leadCount === 0) {
            console.warn('⚠️  WARNING: No Leads found. Dashboard will naturally be empty.');
        }
    } catch (error) {
        console.error('❌ Data Query: FAILED', error);
    }

    process.exit();
};

diagnose();
