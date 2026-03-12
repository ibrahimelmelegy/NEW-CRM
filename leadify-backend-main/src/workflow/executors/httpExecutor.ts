export interface HttpNodeConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string;
  retries?: number;
  timeoutMs?: number;
}

export interface HttpContext {
  entityType: string;
  entityId: string;
  entityData: Record<string, unknown>;
  workflowRuleId: number;
  nodeId: string;
}

export interface HttpExecutionResult {
  statusCode: number;
  ok: boolean;
  responseBody: string;
  headers: Record<string, string>;
  attempts: number;
  totalTimeMs: number;
}

/**
 * Resolves {{variable}} placeholders in a string using the entity data context.
 */
function resolveVariables(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_match, path: string) => {
    const value = path.split('.').reduce((obj, key: string) => {
      if (obj === null || obj === undefined) return undefined;
      return obj[key];
    }, data);
    return value !== null && value !== undefined ? String(value) : '';
  });
}

/**
 * Deep-resolves all string values in an object, substituting {{variable}} placeholders.
 */
function resolveObjectVariables(obj: Record<string, unknown>, data: Record<string, unknown>): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      resolved[key] = resolveVariables(val, data);
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      resolved[key] = resolveObjectVariables(val, data);
    } else {
      resolved[key] = val;
    }
  }
  return resolved;
}

/**
 * Performs a single HTTP request with timeout support.
 */
async function performRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string | null,
  timeoutMs: number
): Promise<{ status: number; ok: boolean; text: string; resHeaders: Record<string, string> }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOpts: RequestInit = {
    method,
    headers,
    signal: controller.signal
  };

  if (body && method !== 'GET' && method !== 'HEAD') {
    fetchOpts.body = body;
  }

  try {
    const response = await fetch(url, fetchOpts);
    clearTimeout(timer);

    const text = await response.text().catch(() => '');
    const resHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      resHeaders[key] = value;
    });

    return {
      status: response.status,
      ok: response.ok,
      text: text.substring(0, 5000), // Truncate large responses
      resHeaders
    };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Sleeps for the specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes an HTTP request node with retry logic and variable substitution.
 *
 * - Substitutes {{field}} placeholders in URL, headers, and body using entity data
 * - Implements exponential backoff retry strategy
 * - Returns structured response data for downstream nodes
 */
export async function executeHttp(nodeConfig: HttpNodeConfig, context: HttpContext): Promise<HttpExecutionResult> {
  const { entityData } = context;
  const maxRetries = Math.min(nodeConfig.retries || 0, 5); // Cap at 5 retries
  const timeoutMs = Math.min(nodeConfig.timeoutMs || 30000, 60000); // Cap at 60s

  // Resolve URL variables
  const resolvedUrl = resolveVariables(nodeConfig.url, entityData);
  const method = (nodeConfig.method || 'GET').toUpperCase();

  // Resolve headers
  const resolvedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };
  if (nodeConfig.headers) {
    for (const [key, val] of Object.entries(nodeConfig.headers)) {
      resolvedHeaders[key] = resolveVariables(val, entityData);
    }
  }

  // Resolve body
  let resolvedBody: string | null = null;
  if (nodeConfig.body && method !== 'GET' && method !== 'HEAD') {
    if (typeof nodeConfig.body === 'string') {
      resolvedBody = resolveVariables(nodeConfig.body, entityData);
    } else {
      const resolvedObj = resolveObjectVariables(nodeConfig.body, entityData);
      resolvedBody = JSON.stringify(resolvedObj);
    }
  }

  // Validate URL
  try {
    new URL(resolvedUrl);
  } catch {
    throw new Error(`Invalid URL: ${resolvedUrl}`);
  }

  const startTime = Date.now();
  let lastError: Error | null = null;
  let attempts = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attempts = attempt + 1;

    try {
      // Exponential backoff for retries (0, 1s, 2s, 4s, 8s, ...)
      if (attempt > 0) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
        await sleep(backoffMs);
      }

      const result = await performRequest(resolvedUrl, method, resolvedHeaders, resolvedBody, timeoutMs);

      const totalTimeMs = Date.now() - startTime;

      // On success (2xx) or client error (4xx), do not retry
      if (result.ok || (result.status >= 400 && result.status < 500)) {
        return {
          statusCode: result.status,
          ok: result.ok,
          responseBody: result.text,
          headers: result.resHeaders,
          attempts,
          totalTimeMs
        };
      }

      // Server error (5xx) - retry if we have retries left
      lastError = new Error(`HTTP ${result.status}: ${result.text.substring(0, 200)}`);
    } catch (err: unknown) {
      lastError = err as Error;

      // Abort errors (timeout) should not retry
      if ((err as Error).name === 'AbortError') {
        throw new Error(`HTTP request timed out after ${timeoutMs}ms to ${resolvedUrl} (attempt ${attempts})`);
      }
    }
  }

  const totalTimeMs = Date.now() - startTime;
  throw new Error(`HTTP request failed after ${attempts} attempt(s) to ${resolvedUrl}: ${lastError?.message || 'Unknown error'} (${totalTimeMs}ms)`);
}

export default {
  executeHttp
};
