import { AMQPClient } from '@cloudamqp/amqp-client'
import { handleTranscriptionRequestedQueue } from './transcriptionService.js';

let connection;
let channel;
let transcriptionRequestedQueue
let transcriptionCompletedQueue
let insightsRequestedQueue
let logsQueue


const startConsumers = async () => {
  try {
    const transcriptionRequestedConsumer = await transcriptionRequestedQueue.subscribe({ noAck: false }, async (msg) => {
        try {
          await handleTranscriptionRequestedQueue(msg)
          await msg.ack();
        } catch (error) {
          console.log('error processing message')
          await msg.nack(true); // Requeue on failure
        }
    });

    console.log('consumers started successfully')
  } catch (err) {
    console.log(err);
  }
};

// Main AMQP setup function
export const connectToMessageBroker = async () => {
  try {
    // 1. Establish connection
    const amqp = new AMQPClient(process.env.LAVINMQ_HOST); 
    connection = await amqp.connect(); // Establish connection to the message broker - one connection for all channels

    // 2. Open producer and consumer channels
    channel = await connection.channel(); // One channel for producing & consuming messages

    // 3. Declare exchanges & queues & bindings

      // 3.1 declare exchanges

        const logsExchange = await channel.exchangeDeclare('logs_exchange', 'topic', {
            durable: true,
            passive: false,
            autoDelete: false,
            internal: false,
          });

        
          const analysisExchange = await channel.exchangeDeclare('analysis_exchange', 'topic' , {
              durable: true,
              passive: false,
              autoDelete: false,
              internal: false,
            })

        // 3.2 declare queues

        logsQueue = await channel.queue('logs_queue', {
            durable: true,
            passive: false,
            autoDelete: false,
            exclusive: false,
          });

        transcriptionRequestedQueue = await channel.queue('transcription_requested_queue', {
            durable: true,
            passive: false,
            autoDelete: false,
            exclusive: false,
          });

        transcriptionCompletedQueue = await channel.queue('transcription_completed_queue', {
            durable: true,
            passive: false,
            autoDelete: false,
            exclusive: false,
          });

        insightsRequestedQueue = await channel.queue('insights_requested_queue', {
            durable: true,
            passive: false,
            autoDelete: false,
            exclusive: false,
          });

          // 3.3 Bind queues to exchange with routing key
        await transcriptionRequestedQueue.bind('analysis_exchange', 'analysis.analysisEntry.transcription.requested', {
          });

        await transcriptionCompletedQueue.bind('analysis_exchange', 'analysis.analysisEntry.transcription.completed', {
          });

        await insightsRequestedQueue.bind('analysis_exchange', 'analysis.analysisEntry.insights.requested', {
          });

        await logsQueue.bind('logs_exchange', "logs.#", {
        // no args
        });
    
  // 4. Set up consumer/s

    startConsumers();
    
    console.log('transcription service successfully connected to LavinMQ message broker')
    return { connection: connection, channel: channel, analysisExchange, transcriptionRequestedQueue: transcriptionRequestedQueue };
  } catch (e) {
    console.error("ERROR", e);
    e.connection?.close();
    setTimeout(connectToMessageBroker, 1000); // will try to reconnect in 1s
  }
}

// function for publishing to logs queue
export const publishLogs = async (message) => {
  console.log(`publishing to logsQueue message function called`);
  try {
    await logsQueue.publish(message);
  } catch (err) {
    console.error('Error publishing logs message:', err);
  }
}

export const publishToInsightsRequestedQueue = async (message) => {
  console.log(`publishing to insightsQueue message function called`);
  try {
    await insightsRequestedQueue.publish(message);
  } catch (err) {
    console.error('Error publishing insights message:', err);
  }
}