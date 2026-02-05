import cron from 'node-cron';
import churnService from '../ai/churnService';

class ChurnPredictionScheduler {
    start() {
        // Run every day at midnight
        cron.schedule('0 0 * * *', async () => {
            try {
                console.log('[Cron] Running Daily Churn Prediction...');
                await churnService.predictChurn();
            } catch (error) {
                console.error('[Cron] Churn Prediction Error:', error);
            }
        });

        console.log('[Cron] Churn Prediction Scheduler Started');
    }
}

export default new ChurnPredictionScheduler();
