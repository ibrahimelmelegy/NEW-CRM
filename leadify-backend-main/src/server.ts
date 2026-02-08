import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { sequelize } from './config/db';
import { Sequelize } from 'sequelize-typescript';

import http from 'http';
import { Server } from 'socket.io';

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
        console.log(`[Migration] Renaming 'descripion' to 'description' in ${table}...`);
        await sequelize.query(`ALTER TABLE "${table}" RENAME COLUMN "descripion" TO "description"`);
      }
    } catch (e) {
      // Ignore errors if table doesn't exist yet
    }
  }
}

io.on('connection', (socket) => {
  console.log('[Socket] New Client Connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('[Socket] Client Disconnected:', socket.id);
  });
});

// Test database connection and sync models
sequelize
  .authenticate()
  .then(async () => {
    console.log('Database connection established successfully.');

    // Automated migration for 'descripion' typo
    await runTypoMigration(sequelize);

    // Synchronize all defined models to the database
    await sequelize.sync({ alter: true });
    console.log('Database tables created/updated successfully.');

    // Start the Server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);

      // Start Background Jobs
      try {
        const PaymentReminderScheduler = require('./cron/paymentReminders').default;
        PaymentReminderScheduler.start();

        const ChurnPredictionScheduler = require('./cron/churnPrediction').default;
        ChurnPredictionScheduler.start();
      } catch (e) {
        console.error("Failed to start Cron Jobs", e);
      }
    });
  })
  .catch((err: Error) => {
    console.error('Unable to connect to the database:', err);
  });
