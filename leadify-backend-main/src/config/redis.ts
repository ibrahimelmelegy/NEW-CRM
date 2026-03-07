import { createClient, RedisClientType } from 'redis';
import logger from './logger';

const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', err => logger.error({ err }, 'Redis client error'));
redisClient.on('connect', () => logger.info('Redis connected'));

// Auto-connect (skip in test environment to avoid hanging CI)
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await redisClient.connect();
    } catch (error) {
      logger.error({ err: error }, 'Failed to connect to Redis');
    }
  })();
}

export default redisClient;
