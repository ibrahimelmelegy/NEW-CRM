export interface ERPNextConfig {
  /** ERPNext instance base URL, e.g. https://erp.company.com */
  baseUrl: string;
  /** API key generated in ERPNext (User > API Access) */
  apiKey: string;
  /** API secret corresponding to the API key */
  apiSecret: string;
  /** Default company name inside ERPNext */
  company: string;
  /** Default currency code, e.g. SAR, USD */
  defaultCurrency: string;
  /** Whether the integration is active */
  enabled: boolean;
}

/**
 * Load ERPNext configuration from environment variables.
 * Returns null if required variables are missing (integration is optional).
 */
export function loadERPNextConfig(): ERPNextConfig {
  return {
    baseUrl: (process.env.ERPNEXT_BASE_URL || '').replace(/\/+$/, ''), // strip trailing slashes
    apiKey: process.env.ERPNEXT_API_KEY || '',
    apiSecret: process.env.ERPNEXT_API_SECRET || '',
    company: process.env.ERPNEXT_COMPANY || '',
    defaultCurrency: process.env.ERPNEXT_CURRENCY || 'SAR',
    enabled: process.env.ERPNEXT_ENABLED === 'true'
  };
}

/**
 * Validate that the config has all required fields populated.
 * Returns an array of missing field names (empty = valid).
 */
export function validateERPNextConfig(config: ERPNextConfig): string[] {
  const missing: string[] = [];
  if (!config.baseUrl) missing.push('ERPNEXT_BASE_URL');
  if (!config.apiKey) missing.push('ERPNEXT_API_KEY');
  if (!config.apiSecret) missing.push('ERPNEXT_API_SECRET');
  if (!config.company) missing.push('ERPNEXT_COMPANY');
  return missing;
}
