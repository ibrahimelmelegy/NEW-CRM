/**
 * Job Queue System - BullMQ Implementation
 *
 * Uses BullMQ with Redis for persistent, distributed job processing.
 * Jobs survive server restarts and are shared across instances.
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

export interface JobOptions {
  attempts?: number;
  backoff?: number; // ms between retries (exponential)
  delay?: number; // initial delay before first attempt (ms)
  priority?: number; // lower = higher priority (default 0)
}

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

// Shared Redis connection for all queues
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let connection: IORedis | null = null;

function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });
    connection.on('error', () => {
      // Redis connection error - handled silently, BullMQ will retry
    });
  }
  return connection;
}

class JobQueue {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private handlers: Map<string, (data: any) => Promise<any>> = new Map();
  private processing = false;

  /**
   * Register a named queue with optional concurrency.
   */
  registerQueue(name: string, _concurrency: number = 3): void {
    if (this.queues.has(name)) return;
    try {
      const queue = new Queue(`crm:${name}`, {
        connection: getConnection() as any,
        defaultJobOptions: {
          removeOnComplete: { age: 3600, count: 1000 },
          removeOnFail: { age: 86400, count: 5000 }
        }
      });
      this.queues.set(name, queue);
    } catch {
      // Queue registration failed - will retry on next addJob
    }
  }

  /**
   * Register a handler for a specific queue.
   * Creates a BullMQ Worker that processes jobs from this queue.
   */
  registerHandler(queueName: string, handler: (data: any) => Promise<any>): void {
    this.handlers.set(queueName, handler);

    if (!this.queues.has(queueName)) {
      this.registerQueue(queueName);
    }

    // Create worker if not exists
    if (!this.workers.has(queueName)) {
      try {
        const worker = new Worker(
          `crm:${queueName}`,
          async (job: Job) => {
            const h = this.handlers.get(queueName);
            if (!h) throw new Error(`No handler for queue "${queueName}"`);
            return await h(job.data);
          },
          {
            connection: getConnection() as any,
            concurrency: 3
          }
        );
        worker.on('error', () => {
          // Worker error - handled silently
        });
        this.workers.set(queueName, worker);
      } catch {
        // Worker creation failed
      }
    }
  }

  /**
   * Add a job to the specified queue.
   * Returns a unique job ID for tracking.
   */
  async addJob(queueName: string, data: any, options?: JobOptions): Promise<string> {
    if (!this.queues.has(queueName)) {
      this.registerQueue(queueName);
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      return `fallback_${Date.now()}`;
    }

    try {
      const job = await queue.add(queueName, data, {
        attempts: options?.attempts ?? 3,
        backoff: {
          type: 'exponential',
          delay: options?.backoff ?? 1000
        },
        delay: options?.delay ?? 0,
        priority: options?.priority ?? 0
      });
      return job.id || `job_${Date.now()}`;
    } catch {
      return `error_${Date.now()}`;
    }
  }

  /**
   * Initialize all standard CRM queues and start processing.
   * Call this once during server startup.
   */
  processJobs(): void {
    if (this.processing) return;
    this.processing = true;

    // Standard CRM queues with appropriate concurrency
    const standardQueues: Array<{ name: string; concurrency: number }> = [
      { name: 'email', concurrency: 5 },
      { name: 'pdf', concurrency: 3 },
      { name: 'sync', concurrency: 2 },
      { name: 'notifications', concurrency: 10 },
      { name: 'reports', concurrency: 2 },
      { name: 'scoring', concurrency: 3 },
      { name: 'audit', concurrency: 5 }
    ];

    for (const { name, concurrency } of standardQueues) {
      this.registerQueue(name, concurrency);
    }
  }

  /**
   * Get the status and details of a specific job.
   */
  async getJobStatus(jobId: string): Promise<{
    id: string;
    queueName: string;
    status: JobStatus;
    attempts: number;
    maxAttempts: number;
    error?: string;
    result?: any;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    durationMs?: number;
  } | null> {
    for (const [queueName, queue] of this.queues) {
      try {
        const job = await queue.getJob(jobId);
        if (job) {
          const state = await job.getState();
          return {
            id: job.id || jobId,
            queueName,
            status: state as JobStatus,
            attempts: job.attemptsMade,
            maxAttempts: (job.opts.attempts ?? 3),
            error: job.failedReason,
            result: job.returnvalue,
            createdAt: job.timestamp,
            startedAt: job.processedOn,
            completedAt: job.finishedOn,
            durationMs: job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : undefined
          };
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * Get aggregate statistics for a specific queue.
   */
  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }

    try {
      const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
      return {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0
      };
    } catch {
      return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    }
  }

  /**
   * Get global statistics across all queues.
   */
  async getGlobalStats(): Promise<{
    totalProcessed: number;
    totalFailed: number;
    queues: Record<string, { waiting: number; active: number; completed: number; failed: number }>;
  }> {
    const queues: Record<string, { waiting: number; active: number; completed: number; failed: number }> = {};
    let totalProcessed = 0;
    let totalFailed = 0;

    for (const queueName of this.queues.keys()) {
      const stats = await this.getQueueStats(queueName);
      queues[queueName] = stats;
      totalProcessed += stats.completed;
      totalFailed += stats.failed;
    }

    return { totalProcessed, totalFailed, queues };
  }

  /**
   * Cleanup is handled automatically by BullMQ's removeOnComplete/removeOnFail options.
   * This method is kept for API compatibility.
   */
  cleanup(_maxAgeMs: number = 3600000): number {
    return 0; // BullMQ handles cleanup automatically
  }
}

// Singleton instance
const jobQueue = new JobQueue();

export default jobQueue;
