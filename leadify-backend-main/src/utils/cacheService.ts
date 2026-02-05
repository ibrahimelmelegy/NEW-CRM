
import redisClient from '../config/redis';

class CacheService {
    private defaultTTL = 300; // 5 minutes
    private redisAvailable = true;
    private lastAttempt = 0;
    private retryInterval = 60000; // 1 minute

    private async ensureConnection(): Promise<boolean> {
        if (!this.redisAvailable && Date.now() - this.lastAttempt < this.retryInterval) {
            return false;
        }

        try {
            if (!redisClient.isOpen) {
                this.lastAttempt = Date.now();
                // Use a short timeout for the connection attempt
                await Promise.race([
                    redisClient.connect(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Redis Timeout')), 2000))
                ]);
            }
            this.redisAvailable = true;
            return true;
        } catch (error) {
            this.redisAvailable = false;
            console.error('Redis Connection error, disabling cache temporarily');
            return false;
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!await this.ensureConnection()) return null;
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Cache Get Error [${key}]:`, error);
            return null;
        }
    }

    async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
        if (!await this.ensureConnection()) return;
        try {
            await redisClient.setEx(key, ttl, JSON.stringify(value));
        } catch (error) {
            console.error(`Cache Set Error [${key}]:`, error);
        }
    }

    async del(key: string): Promise<void> {
        if (!await this.ensureConnection()) return;
        try {
            await redisClient.del(key);
        } catch (error) {
            console.error(`Cache Del Error [${key}]:`, error);
        }
    }
}

export default new CacheService();

