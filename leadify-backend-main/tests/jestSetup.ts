/**
 * Jest Global Setup File
 *
 * Runs BEFORE any test file is loaded. Sets environment variables
 * and prevents real connections to external services (Redis, PostgreSQL,
 * BullMQ) that would create open handles and cause Jest to hang.
 */

// 1. Set NODE_ENV to 'test' before anything else
process.env.NODE_ENV = 'test';

// 2. Provide dummy environment variables so that modules like
//    config/validateEnv.ts and config/db.ts don't crash on import.
//    These are never used for real connections because the modules
//    that consume them are mocked in individual test files.
if (!process.env.SECRET_KEY) {
  process.env.SECRET_KEY = 'test_secret_key_' + 'x'.repeat(100);
}
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
}
if (!process.env.TWO_FACTOR_ENCRYPTION_KEY) {
  process.env.TWO_FACTOR_ENCRYPTION_KEY = 'b'.repeat(64);
}
if (!process.env.DB_HOST) process.env.DB_HOST = 'localhost';
if (!process.env.DB_PORT) process.env.DB_PORT = '5433';
if (!process.env.DB_USER) process.env.DB_USER = 'test';
if (!process.env.DB_PASSWORD) process.env.DB_PASSWORD = 'testpassword';
if (!process.env.DB_NAME) process.env.DB_NAME = 'test_db';

// 3. Disable backup cron to prevent node-cron open handles
process.env.BACKUP_ENABLED = 'false';
