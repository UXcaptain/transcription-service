import  express from 'express'
import { createServer } from 'http';
import { globalErrorHandler } from './middleware/globalErrorHandler.js';
import { connectToMessageBroker, publishDirect, publishLogs } from './config/messageBroker/LavinMQ.js';


const app = express();
const server = createServer(app);

connectToMessageBroker();


setTimeout(() => { //* Reminder to allow a few seconds for the message broker to connect before trying to send a message 

  publishDirect('{"text":"hello", "id": "123", "type": "case1"}')

  publishLogs('{"timestamp": "2025-11-01T16:00:00Z", "service": "transcription-service", "level": "INFO", "message": "exampleMessage", "event":"exampleEvent", "environment": "production"}')  
  // Optional "userId": "123456789",

}, 1000)

//* Middleware to catch & handle errors
app.use(globalErrorHandler);

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
})

const gracefulShutdown = () => {
    console.log('Received shutdown signal, closing server...');
    console.log('LavinMQ connection closed'); // TODO -- add graceful disconnection from LavinMQ

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