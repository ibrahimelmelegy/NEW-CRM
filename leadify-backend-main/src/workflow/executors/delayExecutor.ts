import WorkflowExecution from '../workflowExecutionModel';

export interface DelayConfig {
  delay: number;
  unit: 'minutes' | 'hours' | 'days';
}

export interface DelayContext {
  executionId: number;
  workflowRuleId: number;
  entityType: string;
  entityId: string;
  nodeId: string;
  userId?: number;
}

/**
 * Converts the delay config to milliseconds.
 */
function toMilliseconds(delay: number, unit: 'minutes' | 'hours' | 'days'): number {
  switch (unit) {
    case 'minutes':
      return delay * 60 * 1000;
    case 'hours':
      return delay * 60 * 60 * 1000;
    case 'days':
      return delay * 24 * 60 * 60 * 1000;
    default:
      return delay * 60 * 1000;
  }
}

/**
 * Calculates the scheduled-at timestamp from the delay config.
 */
export function calculateScheduledAt(config: DelayConfig): Date {
  const ms = toMilliseconds(config.delay, config.unit);
  return new Date(Date.now() + ms);
}

/**
 * Formats the delay for human-readable display.
 */
export function formatDelay(config: DelayConfig): string {
  const { delay, unit } = config;
  const singular = unit.replace(/s$/, '');
  return `${delay} ${delay === 1 ? singular : unit}`;
}

/**
 * Executes a delay node within a workflow.
 *
 * For short delays (<= 5 minutes), uses an in-process timer via setTimeout.
 * For longer delays, persists the scheduled timestamp in the execution record
 * so that a cron job or scheduler can resume execution later.
 *
 * Returns a promise that resolves with the delay metadata.
 */
export async function executeDelay(
  nodeConfig: DelayConfig,
  context: DelayContext
): Promise<{ delayed: boolean; scheduledAt: string; delayMs: number; resumeAfter: string }> {
  const { delay, unit } = nodeConfig;

  if (!delay || delay <= 0) {
    return {
      delayed: false,
      scheduledAt: new Date().toISOString(),
      delayMs: 0,
      resumeAfter: formatDelay({ delay: 0, unit })
    };
  }

  const delayMs = toMilliseconds(delay, unit);
  const scheduledAt = calculateScheduledAt(nodeConfig);

  // For short delays (up to 5 minutes), wait in-process
  const SHORT_DELAY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  if (delayMs <= SHORT_DELAY_THRESHOLD) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, delayMs);
    });

    return {
      delayed: true,
      scheduledAt: scheduledAt.toISOString(),
      delayMs,
      resumeAfter: formatDelay(nodeConfig)
    };
  }

  // For longer delays, persist to DB for cron-based resumption.
  // Store delay metadata in the execution record so the scheduler knows
  // when to resume this workflow.
  try {
    if (context.executionId) {
      const execution = await WorkflowExecution.findByPk(context.executionId);
      if (execution) {
        const currentActions = execution.actionsExecuted || [];
        currentActions.push({
          actionType: 'DELAY',
          status: 'SUCCESS',
          result: {
            nodeId: context.nodeId,
            scheduledAt: scheduledAt.toISOString(),
            delayMs,
            unit,
            delay,
            status: 'WAITING'
          }
        });
        await execution.update({ actionsExecuted: currentActions });
      }
    }
  } catch (err: any) {
    console.error('Failed to persist delay metadata:', err.message);
  }

  return {
    delayed: true,
    scheduledAt: scheduledAt.toISOString(),
    delayMs,
    resumeAfter: formatDelay(nodeConfig)
  };
}

/**
 * Checks all pending delay nodes and returns those that are ready to resume.
 * Intended to be called by a cron job at regular intervals.
 */
export async function getPendingDelays(): Promise<
  Array<{ executionId: number; nodeId: string; scheduledAt: string }>
> {
  const now = new Date();
  const executions = await WorkflowExecution.findAll({
    where: { status: 'PARTIAL' },
    limit: 100,
    order: [['createdAt', 'ASC']]
  });

  const ready: Array<{ executionId: number; nodeId: string; scheduledAt: string }> = [];

  for (const exec of executions) {
    const actions = exec.actionsExecuted || [];
    for (const action of actions) {
      if (
        action.actionType === 'DELAY' &&
        action.result?.status === 'WAITING' &&
        new Date(action.result.scheduledAt) <= now
      ) {
        ready.push({
          executionId: exec.id,
          nodeId: action.result.nodeId,
          scheduledAt: action.result.scheduledAt
        });
      }
    }
  }

  return ready;
}

export default {
  executeDelay,
  calculateScheduledAt,
  formatDelay,
  getPendingDelays
};
