import https from 'https';
import http from 'http';
import { URL } from 'url';
import { ERPNextConfig } from './erpnextConfig';
import logger from '../config/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ERPNextListParams {
  filters?: Record<string, unknown> | Array<[string, string, any]>;
  fields?: string[];
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export interface ERPNextError {
  httpCode: number;
  message: string;
  serverMessages?: string[];
  exc_type?: string;
}

export class ERPNextApiError extends Error {
  public httpCode: number;
  public serverMessages: string[];
  public exc_type: string | undefined;

  constructor(err: ERPNextError) {
    super(err.message);
    this.name = 'ERPNextApiError';
    this.httpCode = err.httpCode;
    this.serverMessages = err.serverMessages || [];
    this.exc_type = err.exc_type;
  }
}

// ---------------------------------------------------------------------------
// HTTP helper (uses Node built-in http/https -- no axios dependency)
// ---------------------------------------------------------------------------

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeout?: number;
}

function makeRequest(opts: RequestOptions): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(opts.url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const reqOpts: http.RequestOptions = {
      method: opts.method,
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      headers: opts.headers,
      timeout: opts.timeout || 30000
    };

    const req = lib.request(reqOpts, res => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 500,
          body: Buffer.concat(chunks).toString('utf-8')
        });
      });
    });

    req.on('error', err => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ERPNext request timed out'));
    });

    if (opts.body) {
      req.write(opts.body);
    }
    req.end();
  });
}

// ---------------------------------------------------------------------------
// ERPNext REST Client
// ---------------------------------------------------------------------------

export class ERPNextClient {
  private baseUrl: string;
  private authHeader: string;
  private timeout: number;

  constructor(private config: ERPNextConfig) {
    this.baseUrl = config.baseUrl;
    this.authHeader = `token ${config.apiKey}:${config.apiSecret}`;
    this.timeout = 30000; // 30 seconds
  }

  // ---- Low-level request ----

  private async request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data?: any, params?: Record<string, string>): Promise<unknown> {
    let url = `${this.baseUrl}${path}`;
    if (params && Object.keys(params).length > 0) {
      const qs = new URLSearchParams(params).toString();
      url += (url.includes('?') ? '&' : '?') + qs;
    }

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      Accept: 'application/json'
    };

    let body: string | undefined;
    if (data && (method === 'POST' || method === 'PUT')) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }

    const startTime = Date.now();

    // ERPNext request initiated

    let response: { statusCode: number; body: string };
    try {
      response = await makeRequest({ method, url, headers, body, timeout: this.timeout });
    } catch (err) {
      logger.error(`[ERPNext] Request failed: ${(err as Error).message}`);
      throw new ERPNextApiError({
        httpCode: 0,
        message: `ERPNext connection failed: ${(err as Error).message}`
      });
    }

    const _duration = Date.now() - startTime;
    // ERPNext response received

    // Parse response body
    let parsed: any;
    try {
      parsed = JSON.parse(response.body);
    } catch {
      // Some ERPNext endpoints return HTML on error
      if (response.statusCode >= 400) {
        throw new ERPNextApiError({
          httpCode: response.statusCode,
          message: `ERPNext returned non-JSON response (HTTP ${response.statusCode})`
        });
      }
      parsed = { data: response.body };
    }

    // Handle errors
    if (response.statusCode >= 400) {
      const serverMessages = this.parseServerMessages(parsed);
      throw new ERPNextApiError({
        httpCode: response.statusCode,
        message: serverMessages[0] || `ERPNext API error (HTTP ${response.statusCode})`,
        serverMessages,
        exc_type: parsed.exc_type
      });
    }

    return parsed;
  }

  private parseServerMessages(parsed: any): string[] {
    const messages: string[] = [];
    if (parsed._server_messages) {
      try {
        const raw = JSON.parse(parsed._server_messages);
        if (Array.isArray(raw)) {
          for (const msg of raw) {
            try {
              const inner = JSON.parse(msg);
              messages.push(inner.message || msg);
            } catch {
              messages.push(msg);
            }
          }
        }
      } catch {
        messages.push(String(parsed._server_messages));
      }
    }
    if (parsed.message && typeof parsed.message === 'string') {
      messages.push(parsed.message);
    }
    if (parsed.exc && messages.length === 0) {
      messages.push('ERPNext server error');
    }
    return messages;
  }

  // ---- Public API methods ----

  /**
   * Get a single document by doctype and name.
   * GET /api/resource/{doctype}/{name}
   */
  async get(doctype: string, name?: string, filters?: Record<string, unknown>, fields?: string[], limit?: number): Promise<unknown> {
    if (name) {
      const res = await this.request('GET', `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
      return res.data;
    }
    // If no name, fall back to list
    return this.getList(doctype, filters, fields, undefined, limit);
  }

  /**
   * List documents of a doctype.
   * GET /api/resource/{doctype}?filters=...&fields=...
   */
  async getList(
    doctype: string,
    filters?: Record<string, unknown> | Array<[string, string, any]>,
    fields?: string[],
    orderBy?: string,
    limit?: number,
    offset?: number
  ): Promise<any[]> {
    const params: Record<string, string> = {};

    if (filters) {
      params['filters'] = JSON.stringify(filters);
    }
    if (fields && fields.length > 0) {
      params['fields'] = JSON.stringify(fields);
    }
    if (orderBy) {
      params['order_by'] = orderBy;
    }
    if (limit !== undefined) {
      params['limit_page_length'] = String(limit);
    }
    if (offset !== undefined) {
      params['limit_start'] = String(offset);
    }

    const res = await this.request('GET', `/api/resource/${encodeURIComponent(doctype)}`, undefined, params);
    return res.data || [];
  }

  /**
   * Create a new document.
   * POST /api/resource/{doctype}
   */
  async create(doctype: string, data: Record<string, unknown>): Promise<unknown> {
    const res = await this.request('POST', `/api/resource/${encodeURIComponent(doctype)}`, data);
    return res.data;
  }

  /**
   * Update an existing document.
   * PUT /api/resource/{doctype}/{name}
   */
  async update(doctype: string, name: string, data: Record<string, unknown>): Promise<unknown> {
    const res = await this.request('PUT', `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, data);
    return res.data;
  }

  /**
   * Delete a document.
   * DELETE /api/resource/{doctype}/{name}
   */
  async delete(doctype: string, name: string): Promise<unknown> {
    const res = await this.request('DELETE', `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
    return res;
  }

  /**
   * Call a server-side whitelisted method.
   * POST /api/method/{method}
   */
  async runMethod(method: string, params?: Record<string, unknown>): Promise<unknown> {
    const res = await this.request('POST', `/api/method/${method}`, params);
    return res;
  }

  /**
   * Call a GET-based API method (for reports etc.).
   * GET /api/method/{method}?...params
   */
  async getMethod(method: string, params?: Record<string, string>): Promise<unknown> {
    const res = await this.request('GET', `/api/method/${method}`, undefined, params);
    return res;
  }

  /**
   * Simple connectivity check -- fetches the logged-in user.
   */
  async ping(): Promise<{ user: string; version?: string }> {
    const res = await this.getMethod('frappe.auth.get_logged_user');
    return { user: res.message };
  }
}
