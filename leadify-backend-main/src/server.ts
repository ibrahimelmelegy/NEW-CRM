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

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const server = http.createServer(app);

const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3060'];

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
        `SELECT column_name FROM information_schema.columns WHERE table_name='${table}' AND column_name='descripion'`
      );

      if (results.length > 0) {
        await sequelize.query(`ALTER TABLE "${table}" RENAME COLUMN "descripion" TO "description"`);
      }
    } catch (e) {
      // Ignore errors if table doesn't exist yet
    }
  }
}

// Set up real-time presence tracking
setupPresenceHandlers(io);
setupVirtualOfficeHandlers(io);

// Test database connection and sync models
sequelize
  .authenticate()
  .then(async () => {
    console.log('Database connection established successfully.');

    // Automated migration for 'descripion' typo
    await runTypoMigration(sequelize);

    // Synchronize all defined models to the database
    try {
      await sequelize.sync({ alter: true });
    } catch (syncErr) {
      console.warn('sync({ alter: true }) failed, attempting basic sync:', (syncErr as Error).message);
      try {
        await sequelize.sync();
      } catch (basicErr) {
        console.warn('sync() also failed (tables likely already exist):', (basicErr as Error).message);
      }
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
