import os from 'os';
import { sequelize } from '../config/db';
import redisClient from '../config/redis';
import { TrackedError } from '../middleware/errorTracker';

const BUCKET_SIZE = 60; // 1-minute buckets

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    loadAvg: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
    process: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
      external: number;
    };
  };
  uptime: {
    system: number;
    process: number;
  };
  node: {
    version: string;
    platform: string;
    arch: string;
  };
}

interface DatabaseMetrics {
  status: 'ok' | 'error';
  responseTime: number;
  pool: {
    size: number;
    available: number;
    using: number;
    waiting: number;
  };
}

interface RedisMetrics {
  status: 'ok' | 'error';
  uptime?: number;
  connectedClients?: number;
  usedMemory?: string;
  usedMemoryPeak?: string;
  keyCount?: number;
  opsPerSec?: number;
}

interface TimelinePoint {
  timestamp: number;
  requests: number;
  errors: number;
  avgResponseTime: number;
}

interface EndpointMetric {
  method: string;
  endpoint: string;
  count: number;
  avgResponseTime: number;
  maxResponseTime: number;
}

interface RequestMetrics {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  avgResponseTime: number;
  requestsPerMinute: number;
  timeline: TimelinePoint[];
  statusDistribution: Record<string, number>;
}

interface OverviewMetrics {
  system: SystemMetrics;
  database: DatabaseMetrics;
  redis: RedisMetrics;
  requests: {
    totalRequests: number;
    errorRate: number;
    avgResponseTime: number;
    requestsPerMinute: number;
  };
  activeUsers: number;
}

class MonitoringService {
  /**
   * Get system-level metrics (CPU, memory, uptime)
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = process.memoryUsage();

    // Calculate CPU usage from os.cpus()
    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
      for (const type of Object.keys(cpu.times) as (keyof typeof cpu.times)[]) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    const cpuUsage = (1 - totalIdle / totalTick) * 100;

    return {
      cpu: {
        usage: Math.round(cpuUsage * 100) / 100,
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        loadAvg: os.loadavg()
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: Math.round((usedMem / totalMem) * 10000) / 100,
        process: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          rss: memUsage.rss,
          external: memUsage.external
        }
      },
      uptime: {
        system: os.uptime(),
        process: process.uptime()
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
  }

  /**
   * Get database connection metrics
   */
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    const startTime = Date.now();
    try {
      await sequelize.authenticate();
      const responseTime = Date.now() - startTime;

      // Get connection pool stats
      const pool = (
        sequelize as unknown as { connectionManager?: { pool?: { size?: number; available?: number; using?: number; waiting?: number } } }
      ).connectionManager?.pool;

      return {
        status: 'ok',
        responseTime,
        pool: {
          size: (pool as Record<string, number>)?.size ?? 0,
          available: (pool as Record<string, number>)?.available ?? 0,
          using: (pool as Record<string, number>)?.using ?? 0,
          waiting: (pool as Record<string, number>)?.waiting ?? 0
        }
      };
    } catch {
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        pool: { size: 0, available: 0, using: 0, waiting: 0 }
      };
    }
  }

  /**
   * Get Redis server metrics
   */
  async getRedisMetrics(): Promise<RedisMetrics> {
    try {
      if (!redisClient.isReady) {
        return { status: 'error' };
      }

      const info = await redisClient.info();
      const lines = info.split('\r\n');
      const parsed: Record<string, string> = {};
      for (const line of lines) {
        const [key, value] = line.split(':');
        if (key && value) {
          parsed[key] = value;
        }
      }

      // Get total key count
      const keyCount = await redisClient.dbSize();

      return {
        status: 'ok',
        uptime: parseInt(parsed['uptime_in_seconds'] || '0', 10),
        connectedClients: parseInt(parsed['connected_clients'] || '0', 10),
        usedMemory: parsed['used_memory_human'] || '0B',
        usedMemoryPeak: parsed['used_memory_peak_human'] || '0B',
        keyCount,
        opsPerSec: parseInt(parsed['instantaneous_ops_per_sec'] || '0', 10)
      };
    } catch {
      return { status: 'error' };
    }
  }

  /**
   * Get request metrics for a given time period
   */
  async getRequestMetrics(period: string = '1h'): Promise<RequestMetrics> {
    const periodSeconds = this.parsePeriod(period);
    const now = Math.floor(Date.now() / 1000);
    const startBucket = Math.floor((now - periodSeconds) / BUCKET_SIZE) * BUCKET_SIZE;

    const timeline: TimelinePoint[] = [];
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    const statusDistribution: Record<string, number> = {};

    try {
      if (!redisClient.isReady) {
        return this.emptyRequestMetrics();
      }

      // Iterate through each time bucket in the period
      for (let bucket = startBucket; bucket <= now; bucket += BUCKET_SIZE) {
        const requestKey = `metrics:requests:${bucket}`;
        const errorKey = `metrics:errors:${bucket}`;
        const rtKey = `metrics:rt:${bucket}`;
        const statusKey = `metrics:status:${bucket}`;

        const [requests, errors, responseTimes, statusCounts] = await Promise.all([
          redisClient.get(requestKey),
          redisClient.get(errorKey),
          redisClient.lRange(rtKey, 0, -1),
          redisClient.hGetAll(statusKey)
        ]);

        const reqCount = parseInt(requests || '0', 10);
        const errCount = parseInt(errors || '0', 10);

        totalRequests += reqCount;
        totalErrors += errCount;

        // Calculate average response time for this bucket
        let bucketAvgRt = 0;
        if (responseTimes.length > 0) {
          const sum = responseTimes.reduce((acc, val) => acc + parseInt(val, 10), 0);
          bucketAvgRt = sum / responseTimes.length;
          totalResponseTime += sum;
          responseTimeCount += responseTimes.length;
        }

        // Aggregate status distribution
        for (const [code, count] of Object.entries(statusCounts)) {
          const group = `${code.charAt(0)}xx`;
          statusDistribution[group] = (statusDistribution[group] || 0) + parseInt(count, 10);
        }

        timeline.push({
          timestamp: bucket * 1000,
          requests: reqCount,
          errors: errCount,
          avgResponseTime: Math.round(bucketAvgRt * 100) / 100
        });
      }

      const periodMinutes = periodSeconds / 60;

      return {
        totalRequests,
        totalErrors,
        errorRate: totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 10000) / 100 : 0,
        avgResponseTime: responseTimeCount > 0 ? Math.round((totalResponseTime / responseTimeCount) * 100) / 100 : 0,
        requestsPerMinute: periodMinutes > 0 ? Math.round((totalRequests / periodMinutes) * 100) / 100 : 0,
        timeline,
        statusDistribution
      };
    } catch {
      return this.emptyRequestMetrics();
    }
  }

  /**
   * Get endpoint-level performance metrics
   */
  async getEndpointMetrics(): Promise<EndpointMetric[]> {
    try {
      if (!redisClient.isReady) return [];

      const endpoints = await redisClient.sMembers('metrics:endpoints');
      const results: EndpointMetric[] = [];

      for (const ep of endpoints) {
        const [method, ...pathParts] = ep.split(':');
        const endpoint = pathParts.join(':');
        const key = `metrics:endpoint:${ep}`;
        const data = await redisClient.hGetAll(key);

        if (data.count) {
          const count = parseInt(data.count, 10);
          const totalTime = parseInt(data.totalTime || '0', 10);
          const maxTime = parseInt(data.maxTime || '0', 10);

          results.push({
            method: method || 'GET',
            endpoint: endpoint || '/',
            count,
            avgResponseTime: count > 0 ? Math.round((totalTime / count) * 100) / 100 : 0,
            maxResponseTime: maxTime
          });
        }
      }

      // Sort by request count descending
      return results.sort((a, b) => b.count - a.count);
    } catch {
      return [];
    }
  }

  /**
   * Get error log entries
   */
  async getErrorLog(page: number = 1, limit: number = 20): Promise<{ docs: TrackedError[]; total: number }> {
    try {
      if (!redisClient.isReady) return { docs: [], total: 0 };

      const total = await redisClient.lLen('metrics:error_log');
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const entries = await redisClient.lRange('metrics:error_log', start, end);
      const docs = entries
        .map(entry => {
          try {
            return JSON.parse(entry) as TrackedError;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as TrackedError[];

      return { docs, total };
    } catch {
      return { docs: [], total: 0 };
    }
  }

  /**
   * Get health check results over time
   */
  async getHealthTimeline(hours: number = 24): Promise<Array<{ timestamp: string; api: string; database: string; redis: string }>> {
    // Return current snapshot + stored timeline
    const timeline: Array<{ timestamp: string; api: string; database: string; redis: string }> = [];

    try {
      if (redisClient.isReady) {
        const entries = await redisClient.lRange('metrics:health_timeline', 0, hours * 12 - 1);
        for (const entry of entries) {
          try {
            timeline.push(JSON.parse(entry));
          } catch {
            // skip malformed entries
          }
        }
      }

      // Add current status
      const dbStatus = await this.getDatabaseMetrics();
      const redisStatus = await this.getRedisMetrics();

      timeline.unshift({
        timestamp: new Date().toISOString(),
        api: 'ok',
        database: dbStatus.status,
        redis: redisStatus.status
      });

      return timeline;
    } catch {
      return [
        {
          timestamp: new Date().toISOString(),
          api: 'ok',
          database: 'unknown',
          redis: 'unknown'
        }
      ];
    }
  }

  /**
   * Get active user session count
   */
  async getActiveUsers(): Promise<number> {
    try {
      const [result]: Array<Array<{ count: string }>> = (await sequelize.query(`SELECT COUNT(*) as count FROM sessions WHERE "expiresAt" > NOW()`, {
        raw: true
      })) as unknown as Array<Array<{ count: string }>>;
      return parseInt(result?.[0]?.count || '0', 10);
    } catch {
      return 0;
    }
  }

  /**
   * Get storage/disk metrics
   */
  async getStorageMetrics(): Promise<{ uploadsSize: string; tempSize: string }> {
    // Simplified - return basic info
    return {
      uploadsSize: 'N/A',
      tempSize: 'N/A'
    };
  }

  /**
   * Get combined overview for the dashboard
   */
  async getOverview(): Promise<OverviewMetrics> {
    const [system, database, redis, requests, activeUsers] = await Promise.all([
      this.getSystemMetrics(),
      this.getDatabaseMetrics(),
      this.getRedisMetrics(),
      this.getRequestMetrics('1h'),
      this.getActiveUsers()
    ]);

    return {
      system,
      database,
      redis,
      requests: {
        totalRequests: requests.totalRequests,
        errorRate: requests.errorRate,
        avgResponseTime: requests.avgResponseTime,
        requestsPerMinute: requests.requestsPerMinute
      },
      activeUsers
    };
  }

  /**
   * Record a health check snapshot (called periodically)
   */
  async recordHealthSnapshot(): Promise<void> {
    try {
      if (!redisClient.isReady) return;

      const dbStatus = await this.getDatabaseMetrics();
      const redisStatus = await this.getRedisMetrics();

      const snapshot = {
        timestamp: new Date().toISOString(),
        api: 'ok',
        database: dbStatus.status,
        redis: redisStatus.status
      };

      await redisClient.lPush('metrics:health_timeline', JSON.stringify(snapshot));
      await redisClient.lTrim('metrics:health_timeline', 0, 24 * 12 - 1); // Keep 24h at 5-min intervals
      await redisClient.expire('metrics:health_timeline', 86400 * 2);
    } catch {
      // Silently fail
    }
  }

  // --- Helpers ---

  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)(m|h|d)$/);
    if (!match) return 3600; // default 1 hour

    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }

  private emptyRequestMetrics(): RequestMetrics {
    return {
      totalRequests: 0,
      totalErrors: 0,
      errorRate: 0,
      avgResponseTime: 0,
      requestsPerMinute: 0,
      timeline: [],
      statusDistribution: {}
    };
  }
}

// Start periodic health snapshots (every 5 minutes)
const monitoringService = new MonitoringService();

let healthInterval: ReturnType<typeof setInterval> | null = null;
if (process.env.NODE_ENV !== 'test') {
  healthInterval = setInterval(
    () => {
      monitoringService.recordHealthSnapshot().catch(() => {});
    },
    5 * 60 * 1000
  );

  // Clean up on process exit
  process.on('SIGTERM', () => {
    if (healthInterval) clearInterval(healthInterval);
  });
  process.on('SIGINT', () => {
    if (healthInterval) clearInterval(healthInterval);
  });
}

export default monitoringService;
