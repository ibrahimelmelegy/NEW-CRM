import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { sequelize } from './config/db';

import http from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: '*', // Adjust for production
    methods: ['GET', 'POST']
  }
});

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
