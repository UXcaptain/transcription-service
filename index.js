import express from 'express';
import { createServer } from 'http';
import { globalErrorHandler } from './middleware/globalErrorHandler.js';
import { connectToMessageBroker } from './config/messageBroker/LavinMQ.js';
import { startCronJobs } from './cron/cronJobScheduler.js';

const app = express();
const server = createServer(app);

connectToMessageBroker();
startCronJobs();

//* Middleware to catch & handle errors
app.use(globalErrorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server...');

  server.close(() => {
    console.log('Express server closed');

    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
