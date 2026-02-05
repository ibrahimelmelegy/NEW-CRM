import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { sequelize } from './config/db';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Test database connection and sync models
sequelize
  .authenticate()
  .then(async () => {
    console.log('Database connection established successfully.');

    // Synchronize all defined models to the database
    await sequelize.sync({ alter: true });
    console.log('Database tables created/updated successfully.');

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      // Start Background Jobs
      try {
        const PaymentReminderScheduler = require('./cron/paymentReminders').default;
        PaymentReminderScheduler.start();
      } catch (e) {
        console.error("Failed to start Cron Jobs", e);
      }
    });
  })
  .catch((err: Error) => {
    console.error('Unable to connect to the database:', err);
  });
