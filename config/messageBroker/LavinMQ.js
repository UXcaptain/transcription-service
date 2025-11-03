import { AMQPClient } from '@cloudamqp/amqp-client'
import { requestAnalysisEntryTranscription } from '../../integrations/AWS/transcriptionJob.js';

let connection;
let channel;
let transcriptionQueue
let logsQueue

// Main AMQP setup function
export const connectToMessageBroker = async () => {
  try {
    // 1. Establish connection
    const amqp = new AMQPClient(process.env.LAVINMQ_HOST); 
    connection = await amqp.connect(); // Establish connection to the message broker - one connection for all channels

    // 2. Open producer and consumer channels
    channel = await connection.channel(100); // One channel for producing & consuming messages

    // 3. Declare exchanges & queues & bindings

      // 3.1 logs_exchange, logs_queue, bindings

        const logsExchange = await channel.exchangeDeclare('logs_exchange', 'topic', {
            durable: true,
            passive: false,
            autoDelete: false,
            internal: false,
          });

        logsQueue = await channel.queue('logs_queue', { // queue name
            durable: true,
            passive: false,
            autoDelete: false,
            exclusive: false,
          });

        await logsQueue.bind('logs_exchange', "logs.#", {
          // no args
        });

        // 3.2 transcription_exchange, transcription_queue, bindings // * use this as a base for queues

          //* Declare exchange
        const transcriptionExchange = await channel.exchangeDeclare('transcription_exchange', 'direct' , { // Name , type
            durable: true,
            passive: false,
            autoDelete: false,
            internal: false,
          })

          //* Declare queue
        transcriptionQueue = await channel.queue('transcription_queue', { // queue name
            durable: true,
            passive: false,
            autoDelete: false,
            exclusive: false,
          });

          //* Bind queue to exchange with routing key
        await transcriptionQueue.bind('transcription_exchange', 'transcription.request', { // queue name, exchange name, routing key
          });
    
  // 4. Set up consumer/s

    const consumer = await transcriptionQueue.subscribe({ noAck: false }, async (msg) => {
      try {
        const contentStr = msg.bodyToString();     
        console.log(contentStr)   
        const content = JSON.parse(contentStr);
        console.log('Processing transcription message:', content);

        switch (content.mediaType) {
          case 'video':
            console.log('Processing video transcription message')
            await requestAnalysisEntryTranscription(content)
            break;
          case 'audio': //* Currently not used
            console.log('Processing audio transcription message')
            // process as required
            break;
          
          default:
            console.log(`[⚠️] Unknown media type: ${content.mediaType}`);
            break;
        }

        // Acknowledge message after processing
        await msg.ack();
      } catch (err) {
        console.error("[⚠️] Error processing transcription message:", err);
        await msg.nack(true); // Requeue on failure
      }
    });
    
    console.log('transcription service successfully connected to LavinMQ message broker')

    return { connection: connection, channel: channel, transcriptionExchange, transcriptionQueue };
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

