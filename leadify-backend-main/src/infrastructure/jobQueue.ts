/**
 * Job Queue System - In-Process Implementation
 *
 * Replace with Bull/BullMQ for production scale:
 *   npm install bullmq ioredis
 *
 * This in-memory implementation handles background job processing using
 * an internal queue with configurable concurrency, retries, and backoff.
 * Suitable for single-instance deployments under moderate load.
 * For multi-instance or high-throughput deployments, migrate to BullMQ
 * with a shared Redis backend.
 */

export interface JobOptions {
  attempts?: number;
  backoff?: number; // ms between retries (exponential)
  delay?: number; // initial delay before first attempt (ms)
  priority?: number; // lower = higher priority (default 0)
}

export interface JobDefinition {
  name: string;
  handler: (data: any) => Promise<any>;
  options?: JobOptions;
}

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

interface InternalJob {
  id: string;
  queueName: string;
  data: any;
  options: Required<JobOptions>;
  status: JobStatus;
  attempts: number;
  result?: any;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface QueueConfig {
  name: string;
  concurrency: number;
  handler?: (data: any) => Promise<any>;
  activeCount: number;
}

class JobQueue {
  private queues: Map<string, QueueConfig> = new Map();
  private jobs: Map<string, InternalJob> = new Map();
  private jobQueues: Map<string, InternalJob[]> = new Map();
  private jobCounter = 0;
  private stats = {
    totalProcessed: 0,
    totalFailed: 0
  };
  private processing = false;

  /**
   * Register a named queue with optional concurrency.
   */
  registerQueue(name: string, concurrency: number = 3): void {
    if (this.queues.has(name)) return;
    this.queues.set(name, {
      name,
      concurrency,
      activeCount: 0
    });
    this.jobQueues.set(name, []);
  }

  /**
   * Register a handler for a specific queue.
   * Call this during app startup to define how jobs in each queue are processed.
   */
  registerHandler(queueName: string, handler: (data: any) => Promise<any>): void {
    const queue = this.queues.get(queueName);
    if (!queue) {
      // Auto-register the queue if it does not exist
      this.registerQueue(queueName);
    }
    const q = this.queues.get(queueName)!;
    q.handler = handler;
  }

  /**
   * Add a job to the specified queue.
   * Returns a unique job ID for tracking.
   */
  async addJob(queueName: string, data: any, options?: JobOptions): Promise<string> {
    if (!this.queues.has(queueName)) {
      this.registerQueue(queueName);
    }

    const jobId = `job_${++this.jobCounter}_${Date.now()}`;
    const job: InternalJob = {
      id: jobId,
      queueName,
      data,
      options: {
        attempts: options?.attempts ?? 3,
        backoff: options?.backoff ?? 1000,
        delay: options?.delay ?? 0,
        priority: options?.priority ?? 0
      },
      status: options?.delay ? 'delayed' : 'waiting',
      attempts: 0,
      createdAt: Date.now()
    };

    this.jobs.set(jobId, job);

    if (job.status === 'delayed') {
      setTimeout(() => {
        job.status = 'waiting';
        this.jobQueues.get(queueName)?.push(job);
        this.processNext(queueName);
      }, job.options.delay);
    } else {
      this.jobQueues.get(queueName)?.push(job);
      // Sort by priority (lower number = higher priority)
      this.jobQueues.get(queueName)?.sort((a, b) => a.options.priority - b.options.priority);
      this.processNext(queueName);
    }

    return jobId;
  }

  /**
   * Process the next available job(s) in a queue, up to concurrency limit.
   */
  private processNext(queueName: string): void {
    const queueConfig = this.queues.get(queueName);
    const queue = this.jobQueues.get(queueName);
    if (!queueConfig || !queue) return;

    while (queueConfig.activeCount < queueConfig.concurrency && queue.length > 0) {
      const job = queue.shift();
      if (!job) break;

      queueConfig.activeCount++;
      job.status = 'active';
      job.startedAt = Date.now();

      this.executeJob(job, queueConfig).catch(() => {
        // Error already handled inside executeJob
      });
    }
  }

  /**
   * Execute a single job with retry logic.
   */
  private async executeJob(job: InternalJob, queueConfig: QueueConfig): Promise<void> {
    const handler = queueConfig.handler;

    if (!handler) {
      job.status = 'failed';
      job.error = `No handler registered for queue "${job.queueName}"`;
      queueConfig.activeCount--;
      this.stats.totalFailed++;
      console.warn(`[JobQueue] ${job.error}`);
      this.processNext(job.queueName);
      return;
    }

    try {
      job.attempts++;
      const result = await handler(job.data);
      job.status = 'completed';
      job.result = result;
      job.completedAt = Date.now();
      this.stats.totalProcessed++;
    } catch (error) {
      const err = error as Error;

      if (job.attempts < job.options.attempts) {
        // Retry with exponential backoff
        const delay = job.options.backoff * Math.pow(2, job.attempts - 1);
        job.status = 'delayed';

        setTimeout(() => {
          job.status = 'waiting';
          const queue = this.jobQueues.get(job.queueName);
          queue?.push(job);
          this.processNext(job.queueName);
        }, delay);

        console.warn(
          `[JobQueue] Job ${job.id} in "${job.queueName}" failed (attempt ${job.attempts}/${job.options.attempts}), retrying in ${delay}ms: ${err.message}`
        );
      } else {
        job.status = 'failed';
        job.error = err.message;
        job.completedAt = Date.now();
        this.stats.totalFailed++;
        console.error(`[JobQueue] Job ${job.id} in "${job.queueName}" permanently failed after ${job.attempts} attempts: ${err.message}`);
      }
    } finally {
      queueConfig.activeCount--;
      this.processNext(job.queueName);
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
      { name: 'email', concurrency: 5 }, // Email sending
      { name: 'pdf', concurrency: 3 }, // PDF generation
      { name: 'sync', concurrency: 2 }, // ERPNext sync
      { name: 'notifications', concurrency: 10 }, // Push notifications
      { name: 'reports', concurrency: 2 }, // Report generation
      { name: 'scoring', concurrency: 3 }, // Lead scoring calculations
      { name: 'audit', concurrency: 5 } // Audit log writes (non-blocking)
    ];

    for (const { name, concurrency } of standardQueues) {
      this.registerQueue(name, concurrency);
    }

    // Job queues initialized
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
    const job = this.jobs.get(jobId);
    if (!job) return null;

    return {
      id: job.id,
      queueName: job.queueName,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.options.attempts,
      error: job.error,
      result: job.result,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      durationMs: job.completedAt && job.startedAt ? job.completedAt - job.startedAt : undefined
    };
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
    const result = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };

    for (const job of this.jobs.values()) {
      if (job.queueName !== queueName) continue;
      switch (job.status) {
        case 'waiting':
          result.waiting++;
          break;
        case 'active':
          result.active++;
          break;
        case 'completed':
          result.completed++;
          break;
        case 'failed':
          result.failed++;
          break;
        case 'delayed':
          result.delayed++;
          break;
      }
    }

    return result;
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

    for (const queueName of this.queues.keys()) {
      const stats = await this.getQueueStats(queueName);
      queues[queueName] = stats;
    }

    return {
      totalProcessed: this.stats.totalProcessed,
      totalFailed: this.stats.totalFailed,
      queues
    };
  }

  /**
   * Clean up completed/failed jobs older than the given threshold.
   * Prevents unbounded memory growth.
   */
  cleanup(maxAgeMs: number = 3600000): number {
    const cutoff = Date.now() - maxAgeMs;
    let removed = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed') && (job.completedAt ?? job.createdAt) < cutoff) {
        this.jobs.delete(jobId);
        removed++;
      }
    }

    return removed;
  }
}

// Singleton instance
const jobQueue = new JobQueue();

// Auto-cleanup every 30 minutes to prevent memory leaks
setInterval(
  () => {
    const removed = jobQueue.cleanup();
    if (removed > 0) {
      // Old jobs cleaned up
    }
  },
  30 * 60 * 1000
).unref();

export default jobQueue;
