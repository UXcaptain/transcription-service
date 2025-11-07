import { AMQPClient } from '@cloudamqp/amqp-client';
import { insertVideoTranscriptRequestInDb } from '../../models/videoTranscriptionModel.js';
import { transcriptAnalysisEntry } from '../../controllers/videoTranscriptionController.js';

let connection;
let channel;
let transcriptionRequestedQueue;
let transcriptionCompletedQueue;

const startConsumers = async () => {
  try {
    // TranscriptionRequestedConsumer
    await transcriptionRequestedQueue.subscribe({ noAck: false }, async (msg) => {
      try {
        const contentStr = msg.bodyToString();
        const transcriptionRequest = JSON.parse(contentStr);

        const videoTranscriptionRequestInsertId = await insertVideoTranscriptRequestInDb(transcriptionRequest);

        try {
          await transcriptAnalysisEntry(transcriptionRequest, videoTranscriptionRequestInsertId);
        } catch (error) {
          console.log('error requesting transcription', error);
          // TODO - add cron to retry failed transcription requests
        }

        await msg.ack(); // Message will be acked if the message is stored in DB successfully
      } catch (error) {
        console.log('error processing message', error);
        await msg.nack(true); // Requeue on failure // TODO - ADD backoff strategy to prevent infinite loops
        // await msg.nack(true); //* NOT Requeue on failure - For debugging and avoiding infite loops
      }
    });

    console.log('consumers started successfully');
  } catch (err) {
    console.log('error starting consumers', err);
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

    const analysisExchange = await channel.exchangeDeclare('analysis_exchange', 'topic', {
      durable: true,
      passive: false,
      autoDelete: false,
      internal: false,
    });

    // 3.2 declare queues

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

    // 3.3 Bind queues to exchange with routing key
    await transcriptionRequestedQueue.bind('analysis_exchange', 'analysis.analysisEntry.transcription.requested', {
    });

    await transcriptionCompletedQueue.bind('analysis_exchange', 'analysis.analysisEntry.transcription.completed', {
    });

    // 4. Set up consumer/s

    await startConsumers();

    console.log('transcription service successfully connected to LavinMQ message broker');
    return {
      connection: connection, channel: channel, analysisExchange, transcriptionRequestedQueue: transcriptionRequestedQueue,
    };
  } catch (e) {
    console.error('ERROR', e);
    e.connection?.close();
    return setTimeout(connectToMessageBroker, 1000); // will try to reconnect in 1s
  }
};

export const publishTranscriptionCompletedQueue = async (message) => {
  try {
    await transcriptionCompletedQueue.publish(message);
  } catch (err) {
    console.error('Error publishing transcription completed message:', err);
  }
};

export const publishDebuggingCallToTranscriptionRequestedQueue = async () => {
  const message = {
    analysisEntryId: '4179f2eb-2405-44f5-a86d-d15c1d21eb5b',
    analysisId: '70744eb2-f265-4713-959c-4dbeecabe901',
    timestamp: new Date().toISOString(),
    mediaType: 'video',
    languageCode: 'es-ES',
    outputBucket: 'dev-analysis-entry-storage',
  };

  const stringifiedMessage = JSON.stringify(message);

  setTimeout(() => {
    transcriptionRequestedQueue.publish(stringifiedMessage);
  }, 5000);
};
