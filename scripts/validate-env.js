#!/usr/bin/env node
/**
 * Environment Variables Validation Script
 * Checks that all required environment variables are present and valid
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Required environment variables for backend
const BACKEND_REQUIRED = [
  'PORT',
  'NODE_ENV',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'SECRET_KEY',
  'JWT_EXPIRATION_TIME',
  'ENCRYPTION_KEY',
  'BASE_URL',
  'CORS_ORIGINS'
];

// Optional backend variables (warnings only)
const BACKEND_OPTIONAL = [
  'EMAIL_USER',
  'EMAIL_PASS',
  'SENDGRID_API_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'ALLOW_SUPER_ADMIN_CREATION',
  'SESSION_EXPIRATION_TIME',
  'LOGIN_LOCK_TIME_MS',
  'LOGIN_MAX_ATTEMPTS'
];

// Required environment variables for frontend
const FRONTEND_REQUIRED = [
  'API_BASE_URL',
  'BASE_URL',
  'BUCKET_URL',
  'NODE_ENV'
];

// Optional frontend variables
const FRONTEND_OPTIONAL = [
  'ENABLE_DEBUG_MODE'
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();

    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });

  return env;
}

function validateEnv(envData, required, optional, name) {
  const missing = [];
  const empty = [];
  const needsChange = [];
  const optionalMissing = [];

  console.log(`\n${colors.cyan}${colors.bold}Validating ${name}${colors.reset}`);
  console.log('='.repeat(60));

  if (!envData) {
    console.log(`${colors.red}✗ .env file not found!${colors.reset}`);
    return false;
  }

  // Check required variables
  required.forEach(key => {
    if (!(key in envData)) {
      missing.push(key);
    } else if (!envData[key] || envData[key].trim() === '') {
      empty.push(key);
    } else if (envData[key].includes('CHANGE_ME') ||
               envData[key].includes('your_email') ||
               envData[key].includes('your_sendgrid')) {
      needsChange.push(key);
    }
  });

  // Check optional variables
  optional.forEach(key => {
    if (!(key in envData) || !envData[key] || envData[key].trim() === '') {
      optionalMissing.push(key);
    }
  });

  // Report results
  let hasErrors = false;

  if (missing.length > 0) {
    console.log(`${colors.red}✗ Missing required variables:${colors.reset}`);
    missing.forEach(v => console.log(`  - ${v}`));
    hasErrors = true;
  }

  if (empty.length > 0) {
    console.log(`${colors.red}✗ Empty required variables:${colors.reset}`);
    empty.forEach(v => console.log(`  - ${v}`));
    hasErrors = true;
  }

  if (needsChange.length > 0) {
    console.log(`${colors.yellow}⚠ Variables need to be changed from defaults:${colors.reset}`);
    needsChange.forEach(v => console.log(`  - ${v} = ${envData[v]}`));
  }

  if (optionalMissing.length > 0) {
    console.log(`${colors.yellow}⚠ Optional variables not set:${colors.reset}`);
    optionalMissing.forEach(v => console.log(`  - ${v}`));
  }

  if (!hasErrors && needsChange.length === 0 && optionalMissing.length === 0) {
    console.log(`${colors.green}✓ All environment variables are properly configured!${colors.reset}`);
  } else if (!hasErrors) {
    console.log(`${colors.green}✓ All required variables present${colors.reset}`);
  }

  return !hasErrors;
}

function validateSecretKey(key, name) {
  if (!key || key.length < 32) {
    console.log(`${colors.red}✗ ${name} is too short (minimum 32 characters)${colors.reset}`);
    return false;
  }

  if (key.length < 64) {
    console.log(`${colors.yellow}⚠ ${name} is less than 64 characters (recommended: 64+)${colors.reset}`);
  }

  return true;
}

function main() {
  console.log(`\n${colors.bold}${colors.blue}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}║       Environment Variables Validation Tool              ║${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);

  const rootDir = path.join(__dirname, '..');
  const backendEnvPath = path.join(rootDir, 'leadify-backend-main', '.env');
  const frontendEnvPath = path.join(rootDir, 'leadify-frontend-main', '.env');

  // Validate Backend
  const backendEnv = parseEnvFile(backendEnvPath);
  const backendValid = validateEnv(backendEnv, BACKEND_REQUIRED, BACKEND_OPTIONAL, 'Backend Environment');

  // Additional backend validation
  if (backendEnv && backendEnv.SECRET_KEY) {
    validateSecretKey(backendEnv.SECRET_KEY, 'SECRET_KEY');
  }
  if (backendEnv && backendEnv.ENCRYPTION_KEY) {
    validateSecretKey(backendEnv.ENCRYPTION_KEY, 'ENCRYPTION_KEY');
  }

  // Validate Frontend
  const frontendEnv = parseEnvFile(frontendEnvPath);
  const frontendValid = validateEnv(frontendEnv, FRONTEND_REQUIRED, FRONTEND_OPTIONAL, 'Frontend Environment');

  // Summary
  console.log(`\n${colors.bold}${colors.cyan}Summary${colors.reset}`);
  console.log('='.repeat(60));

  if (backendValid && frontendValid) {
    console.log(`${colors.green}${colors.bold}✓ All validations passed!${colors.reset}`);
    console.log(`${colors.green}  You can proceed with running the application.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}✗ Validation failed!${colors.reset}`);
    console.log(`${colors.red}  Please fix the issues above before running the application.${colors.reset}\n`);
    process.exit(1);
  }
}

main();
