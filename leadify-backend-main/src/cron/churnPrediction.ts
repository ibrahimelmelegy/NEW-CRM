import cron from 'node-cron';
import churnService from '../ai/churnService';

class ChurnPredictionScheduler {
  start() {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
      try {
        await churnService.predictChurn();
      } catch (error) {
        // Churn prediction error - silently handled
      }
    });
  }
}

export default new ChurnPredictionScheduler();
