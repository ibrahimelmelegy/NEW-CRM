export interface SystemMetrics {
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

export interface DatabaseMetrics {
  status: 'ok' | 'error';
  responseTime: number;
  pool: {
    size: number;
    available: number;
    using: number;
    waiting: number;
  };
}

export interface RedisMetrics {
  status: 'ok' | 'error';
  uptime?: number;
  connectedClients?: number;
  usedMemory?: string;
  usedMemoryPeak?: string;
  keyCount?: number;
  opsPerSec?: number;
}

export interface TimelinePoint {
  timestamp: number;
  requests: number;
  errors: number;
  avgResponseTime: number;
}

export interface EndpointMetric {
  method: string;
  endpoint: string;
  count: number;
  avgResponseTime: number;
  maxResponseTime: number;
}

export interface RequestMetrics {
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  avgResponseTime: number;
  requestsPerMinute: number;
  timeline: TimelinePoint[];
  statusDistribution: Record<string, number>;
}

export interface TrackedError {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  message: string;
  stack?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

export interface HealthTimelineEntry {
  timestamp: string;
  api: string;
  database: string;
  redis: string;
}

export interface OverviewMetrics {
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

/**
 * Fetch the combined monitoring overview
 */
export async function fetchMonitoringOverview(): Promise<OverviewMetrics | null> {
  const { body, success } = await useApiFetch<OverviewMetrics>('monitoring/overview');
  return success && body ? body : null;
}

/**
 * Fetch system metrics (CPU, memory, uptime)
 */
export async function fetchSystemMetrics(): Promise<SystemMetrics | null> {
  const { body, success } = await useApiFetch<SystemMetrics>('monitoring/system');
  return success && body ? body : null;
}

/**
 * Fetch database metrics
 */
export async function fetchDatabaseMetrics(): Promise<DatabaseMetrics | null> {
  const { body, success } = await useApiFetch<DatabaseMetrics>('monitoring/database');
  return success && body ? body : null;
}

/**
 * Fetch Redis metrics
 */
export async function fetchRedisMetrics(): Promise<RedisMetrics | null> {
  const { body, success } = await useApiFetch<RedisMetrics>('monitoring/redis');
  return success && body ? body : null;
}

/**
 * Fetch request metrics for a given time period
 */
export async function fetchRequestMetrics(period: string = '1h'): Promise<RequestMetrics | null> {
  const { body, success } = await useApiFetch<RequestMetrics>(`monitoring/requests?period=${period}`);
  return success && body ? body : null;
}

/**
 * Fetch endpoint performance metrics
 */
export async function fetchEndpointMetrics(): Promise<EndpointMetric[]> {
  const { body, success } = await useApiFetch<EndpointMetric[]>('monitoring/endpoints');
  return success && body ? body : [];
}

/**
 * Fetch error log with pagination
 */
export async function fetchErrorLog(page: number = 1, limit: number = 20): Promise<{ docs: TrackedError[]; total: number }> {
  const { body, success } = await useApiFetch<{ docs: TrackedError[]; total: number }>(`monitoring/errors?page=${page}&limit=${limit}`);
  return success && body ? body : { docs: [], total: 0 };
}

/**
 * Fetch health timeline
 */
export async function fetchHealthTimeline(hours: number = 24): Promise<HealthTimelineEntry[]> {
  const { body, success } = await useApiFetch<HealthTimelineEntry[]>(`monitoring/health-timeline?hours=${hours}`);
  return success && body ? body : [];
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format seconds to human-readable uptime string
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${Math.floor(seconds)}s`);

  return parts.join(' ');
}

/**
 * Get status color based on health state
 */
export function getHealthColor(status: string): string {
  switch (status) {
    case 'ok':
      return '#67c23a';
    case 'error':
      return '#f56c6c';
    default:
      return '#e6a23c';
  }
}

/**
 * Get status label
 */
export function getHealthLabel(status: string): string {
  switch (status) {
    case 'ok':
      return 'Healthy';
    case 'error':
      return 'Down';
    default:
      return 'Unknown';
  }
}
