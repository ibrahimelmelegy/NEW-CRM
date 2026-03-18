import logger from './logger';

interface EnvVar {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  hint?: string;
}

const ENV_VARS: EnvVar[] = [
  {
    name: 'SECRET_KEY',
    required: true,
    validator: v => v.length >= 64,
    hint: "Must be at least 64 characters. Generate with: node -e \"process.stdout.write(require('crypto').randomBytes(64).toString('hex'))\""
  },
  {
    name: 'ENCRYPTION_KEY',
    required: true,
    validator: v => /^[0-9a-f]{64}$/i.test(v),
    hint: "Must be exactly 64 hex characters (32 bytes). Generate with: node -e \"process.stdout.write(require('crypto').randomBytes(32).toString('hex'))\""
  },
  {
    name: 'TWO_FACTOR_ENCRYPTION_KEY',
    required: true,
    validator: v => /^[0-9a-f]{64}$/i.test(v),
    hint: "Must be exactly 64 hex characters (32 bytes). Generate with: node -e \"process.stdout.write(require('crypto').randomBytes(32).toString('hex'))\""
  },
  {
    name: 'DB_HOST',
    required: true,
    hint: 'Database host (e.g., localhost)'
  },
  {
    name: 'DB_PORT',
    required: true,
    validator: v => !isNaN(parseInt(v, 10)) && parseInt(v, 10) > 0,
    hint: 'Must be a valid port number'
  },
  {
    name: 'DB_USER',
    required: true,
    hint: 'Database user'
  },
  {
    name: 'DB_PASSWORD',
    required: true,
    validator: v => v.length >= 8,
    hint: 'Database password must be at least 8 characters'
  },
  {
    name: 'DB_NAME',
    required: true,
    hint: 'Database name'
  },
  {
    name: 'PORT',
    required: false,
    validator: v => !isNaN(parseInt(v, 10)) && parseInt(v, 10) > 0 && parseInt(v, 10) <= 65535,
    hint: 'Must be a valid port number (1-65535). Defaults to 5000.'
  },
  {
    name: 'NODE_ENV',
    required: false,
    validator: v => ['development', 'production', 'test'].includes(v),
    hint: 'Should be "development", "production", or "test"'
  },
  {
    name: 'JWT_EXPIRATION_TIME',
    required: false,
    hint: 'JWT token expiration (e.g., "7d", "24h"). Defaults to 7d.'
  },
  {
    name: 'CORS_ORIGINS',
    required: false,
    hint: 'Comma-separated list of allowed origins. Defaults to http://localhost:3060'
  },
  {
    name: 'LOGIN_MAX_ATTEMPTS',
    required: false,
    validator: v => !isNaN(parseInt(v, 10)) && parseInt(v, 10) > 0,
    hint: 'Max login attempts before lockout. Defaults to 5.'
  },
  {
    name: 'LOGIN_LOCK_TIME_MS',
    required: false,
    validator: v => !isNaN(parseInt(v, 10)) && parseInt(v, 10) > 0,
    hint: 'Lockout duration in milliseconds. Defaults to 900000 (15 minutes).'
  }
];

/**
 * Critical environment variables that MUST be present for the server to function.
 * If any of these groups are entirely missing, the server cannot start safely.
 */
interface CriticalGroup {
  /** At least one of these env vars must be set */
  vars: string[];
  label: string;
}

const CRITICAL_GROUPS: CriticalGroup[] = [
  { vars: ['DB_HOST', 'DATABASE_URL'], label: 'Database connection (DB_HOST or DATABASE_URL)' },
  { vars: ['SECRET_KEY'], label: 'JWT / CSRF secret (SECRET_KEY)' },
  { vars: ['REDIS_URL', 'REDIS_HOST'], label: 'Redis connection (REDIS_URL or REDIS_HOST)' }
];

export function validateEnvironment(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value) {
      if (envVar.required) {
        errors.push(`MISSING REQUIRED: ${envVar.name} - ${envVar.hint || 'No hint available'}`);
      }
      continue;
    }

    if (envVar.validator && !envVar.validator(value)) {
      if (envVar.required) {
        errors.push(`INVALID: ${envVar.name} - ${envVar.hint || 'Validation failed'}`);
      } else {
        warnings.push(`WARNING: ${envVar.name} - ${envVar.hint || 'Validation failed'}`);
      }
    }
  }

  // Security warnings for production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.SECRET_KEY && process.env.SECRET_KEY.length < 128) {
      warnings.push('WARNING: SECRET_KEY should be at least 128 characters in production');
    }
    if (process.env.CORS_ORIGINS === '*' || !process.env.CORS_ORIGINS) {
      warnings.push('WARNING: CORS_ORIGINS should be set to specific domains in production');
    }
    if (process.env.ALLOW_SUPER_ADMIN_CREATION === 'true') {
      warnings.push('WARNING: ALLOW_SUPER_ADMIN_CREATION should be "false" in production after initial setup');
    }
  }

  if (warnings.length > 0) {
    logger.warn('\n--- Environment Warnings ---');
    warnings.forEach(w => logger.warn(`  ${w}`));
    logger.warn('----------------------------\n');
  }

  if (errors.length > 0) {
    logger.error('\n=== Environment Validation Errors ===');
    errors.forEach(e => logger.error(`  ${e}`));
    logger.error('=====================================\n');
  }

  // ── Critical group check: exit if any essential group is entirely missing ──
  const fatal: string[] = [];
  for (const group of CRITICAL_GROUPS) {
    const hasAny = group.vars.some(v => !!process.env[v]);
    if (!hasAny) {
      fatal.push(`FATAL: ${group.label} — set at least one of: ${group.vars.join(', ')}`);
    }
  }

  if (fatal.length > 0) {
    logger.error('\n=== FATAL: Missing critical environment variables ===');
    fatal.forEach(f => logger.error(`  ${f}`));
    logger.error('Server cannot start without these. Exiting.');
    logger.error('=====================================================\n');
    process.exit(1);
  }
}
