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
    console.warn('\n--- Environment Warnings ---');
    warnings.forEach(w => console.warn(`  ${w}`));
    console.warn('----------------------------\n');
  }

  if (errors.length > 0) {
    console.error('\n=== Environment Validation Errors ===');
    errors.forEach(e => console.error(`  ${e}`));
    console.error('=====================================\n');
    // Log errors but don't crash — allow server to start with partial config
    // Missing vars will cause runtime errors only when the relevant feature is used
  }
}
