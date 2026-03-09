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
import jwt from 'jsonwebtoken';
import { setupPresenceHandlers } from './socket/presenceHandler';
import { setupVirtualOfficeHandlers } from './socket/virtualOfficeHandler';
import { setupLiveChatHandlers } from './socket/liveChatHandler';
import { setupCrmSocketHandlers } from './socket/socketHandlers';
import logger from './config/logger';

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

// Socket.io JWT authentication middleware
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.cookie
      ?.split(';')
      .find((c: string) => c.trim().startsWith('__session='))
      ?.split('=')[1];

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const SECRET_KEY = process.env.SECRET_KEY;
    if (!SECRET_KEY) {
      return next(new Error('Server configuration error'));
    }
    const decoded = jwt.verify(token, SECRET_KEY) as { id: number; tenantId?: string; role?: string };
    socket.data.userId = decoded.id;
    socket.data.tenantId = decoded.tenantId;
    socket.data.role = decoded.role;
    next();
  } catch {
    return next(new Error('Invalid token'));
  }
});

// Set up real-time socket handlers
setupPresenceHandlers(io);
setupVirtualOfficeHandlers(io);
setupLiveChatHandlers(io);
setupCrmSocketHandlers(io);

// Test database connection and sync models
sequelize
  .authenticate()
  .then(async () => {
    // Database connection established

    // Automated migration for 'descripion' typo
    await runTypoMigration(sequelize);

    // Migrate deal price from INTEGER to DECIMAL(12,2)
    try {
      const [results]: any = await sequelize.query(
        `SELECT data_type FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'price'`
      );
      if (results.length > 0 && results[0].data_type === 'integer') {
        await sequelize.query(`ALTER TABLE "deals" ALTER COLUMN "price" TYPE DECIMAL(12,2)`);
      }
    } catch (e) {
      // Ignore if table doesn't exist yet
    }

    // Database schema sync — safe for both development and production.
    // Only adds missing columns/tables, never drops or modifies existing ones.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { safeSchemaSync } = require('./infrastructure/safeSchemaSync');
      const syncResult = await safeSchemaSync(sequelize);
      // SchemaSync complete
      if (syncResult.errors.length > 0) {
        logger.warn({ errors: syncResult.errors }, 'SchemaSync completed with errors');
      }
    } catch (syncErr) {
      logger.warn({ err: syncErr }, 'SchemaSync failed');
    }

    // Add performance indexes (non-blocking - failures are logged and skipped)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { addPerformanceIndexes } = require('./infrastructure/dbIndexes');
      await addPerformanceIndexes(sequelize);
    } catch (e) {
      logger.warn({ err: e }, 'Index setup failed');
    }

    // Initialize job queue for background processing
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const jobQueue = require('./infrastructure/jobQueue').default;
      jobQueue.processJobs();
    } catch (e) {
      logger.warn({ err: e }, 'Job queue initialization failed');
    }

    // Start the Server
    server.listen(PORT, () => {
      // Server started

      // Start Background Jobs
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const PaymentReminderScheduler = require('./cron/paymentReminders').default;
        PaymentReminderScheduler.start();

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const ChurnPredictionScheduler = require('./cron/churnPrediction').default;
        ChurnPredictionScheduler.start();

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { sessionCleanupCron } = require('./cron/sessionCleanup');
        sessionCleanupCron.start();
      } catch (e) {
        // Cron job initialization failed - silently handled
      }

      // Start automated database backup schedule (daily at 2:00 AM)
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { scheduleAutoBackup } = require('./backup/backupService');
        const cronExpr = process.env.BACKUP_CRON || '0 2 * * *';
        if (process.env.BACKUP_ENABLED !== 'false') {
          scheduleAutoBackup(cronExpr);
        }
      } catch (e) {
        // Auto-backup initialization failed - silently handled
      }
    });
  })
  .catch((err: Error) => {
    logger.fatal({ err }, 'Unable to connect to the database');
  });

// Global error handlers - prevent silent crashes in production
process.on('uncaughtException', err => {
  logger.fatal({ err }, 'Uncaught Exception');
  process.exit(1);
});

process.on('unhandledRejection', reason => {
  logger.fatal({ reason }, 'Unhandled Rejection');
  process.exit(1);
});

// Graceful shutdown
function gracefulShutdown(_signal: string) {
  // Graceful shutdown initiated

  server.close(() => {
    // HTTP server closed
    sequelize.close().then(() => {
      // Database connection closed
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
