// High Point Technology CRM Backend Server
import dotenv from 'dotenv';
dotenv.config();
import { validateEnvironment } from './config/validateEnv';
validateEnvironment();
import app from './app';
import { sequelize } from './config/db';
import { Sequelize } from 'sequelize-typescript';

import http from 'http';
import { Server } from 'socket.io';
import { setupPresenceHandlers } from './socket/presenceHandler';
import { setupVirtualOfficeHandlers } from './socket/virtualOfficeHandler';
import { setupLiveChatHandlers } from './socket/liveChatHandler';
import { setupCrmSocketHandlers } from './socket/socketHandlers';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const server = http.createServer(app);

const CORS_ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : ['http://localhost:3060'];

export const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

async function runTypoMigration(sequelize: Sequelize) {
  const tables = [
    'leadActivities',
    'dealActivities',
    'opportunityActivities',
    'clientActivities',
    'projectActivities',
    'vendorActivities',
    'purchaseOrderActivities'
  ];

  for (const table of tables) {
    try {
      const [results]: any = await sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = :tableName AND column_name = 'descripion'`,
        { replacements: { tableName: table } }
      );

      if (results.length > 0) {
        // Table names cannot be parameterized in SQL; values are from a hardcoded allowlist above
        await sequelize.query(`ALTER TABLE "${table}" RENAME COLUMN "descripion" TO "description"`);
      }
    } catch (e) {
      // Ignore errors if table doesn't exist yet
    }
  }
}

// Set up real-time socket handlers
setupPresenceHandlers(io);
setupVirtualOfficeHandlers(io);
setupLiveChatHandlers(io);
setupCrmSocketHandlers(io);

// Test database connection and sync models
sequelize
  .authenticate()
  .then(async () => {
    console.log('Database connection established successfully.');

    // Automated migration for 'descripion' typo
    await runTypoMigration(sequelize);

    // Database schema sync — safe for both development and production.
    // Only adds missing columns/tables, never drops or modifies existing ones.
    try {
      const { safeSchemaSync } = require('./infrastructure/safeSchemaSync');
      const syncResult = await safeSchemaSync(sequelize);
      console.log(
        `[SchemaSync] Complete: ${syncResult.tablesChecked} tables checked, ` +
        `${syncResult.columnsAdded} columns added, ${syncResult.tablesCreated} tables created` +
        (syncResult.errors.length > 0 ? `, ${syncResult.errors.length} errors` : '')
      );
      if (syncResult.errors.length > 0) {
        console.warn('[SchemaSync] Errors:', syncResult.errors);
      }
    } catch (syncErr) {
      console.warn('[SchemaSync] Failed:', (syncErr as Error).message);
    }

    // Add performance indexes (non-blocking - failures are logged and skipped)
    try {
      const { addPerformanceIndexes } = require('./infrastructure/dbIndexes');
      await addPerformanceIndexes(sequelize);
    } catch (e) {
      console.warn('[Startup] Index setup:', (e as Error).message);
    }

    // Initialize job queue for background processing
    try {
      const jobQueue = require('./infrastructure/jobQueue').default;
      jobQueue.processJobs();
    } catch (e) {
      console.warn('[Startup] Job queue:', (e as Error).message);
    }

    // Start the Server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);

      // Start Background Jobs
      try {
        const PaymentReminderScheduler = require('./cron/paymentReminders').default;
        PaymentReminderScheduler.start();

        const ChurnPredictionScheduler = require('./cron/churnPrediction').default;
        ChurnPredictionScheduler.start();

        const { sessionCleanupCron } = require('./cron/sessionCleanup');
        sessionCleanupCron.start();
      } catch (e) {
        // Cron job initialization failed - silently handled
      }
    });
  })
  .catch((err: Error) => {
    console.error('Unable to connect to the database:', err);
  });

// Global error handlers - prevent silent crashes in production
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

// Graceful shutdown
function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    console.log('HTTP server closed');
    sequelize.close().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
