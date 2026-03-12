import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import workflowService from './workflowService';
import logger from '../config/logger';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

// Create the Workflow Queue
export const workflowQueue = new Queue('workflow-execution-queue', { connection: connection as any });

// Initialize the Express Adapter for BullMQ Board UI
export const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(workflowQueue)],
  serverAdapter: serverAdapter
});

// Interfaces
export interface WorkflowJobData {
  executionId: number;
  ruleId: number;
  entityType: string;
  entityId: string;
  actions: any[];
  entityData: any;
  triggerUserId?: number;
}

// Ensure the queue is established before setting up the worker
const setupWorker = () => {
  const worker = new Worker(
    'workflow-execution-queue',
    async (job: Job<WorkflowJobData>) => {
      // Processing workflow job
      const { executionId, ruleId, entityType: _entityType, entityId: _entityId, actions, entityData, triggerUserId } = job.data;

      // Process the exact delayed actions via the service
      if (typeof (workflowService as any).executeDelayedActions === 'function') {
        await (workflowService as any).executeDelayedActions(executionId, ruleId, entityData, actions, triggerUserId);
      } else {
        logger.warn(`[Queue] executeDelayedActions not yet implemented, skipping job ${job.id}`);
      }

      return { status: 'completed' };
    },
    {
      connection: connection as any,
      concurrency: 5
    }
  );

  worker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error({ err: err.message }, `[Queue] Job ${job?.id} failed`);
  });

  worker.on('completed', (_job: Job) => {
    // Job completed
  });

  return worker;
};

// Start the worker
export const workflowWorker = setupWorker();
