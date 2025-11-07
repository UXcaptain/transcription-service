import { CronJob } from 'cron';
import { getCompletedTranscriptions } from '../models/videoTranscriptionModel.js';
import { publishTranscriptionCompletedQueue } from '../config/messageBroker/LavinMQ.js';

export const sendToTranscriptionCompletedQueue = new CronJob('* * * * *', async () => {
  try {
    const completedTranscriptions = await getCompletedTranscriptions();

    for (let i = 0; i < completedTranscriptions.length; i + 1) {
      const transcription = completedTranscriptions[i];

      const message = {

      };

      const stringifiedMessage = message.toString();

      await publishTranscriptionCompletedQueue(stringifiedMessage);
      // await some async operation with transcription, e.g. sending to queue
    }

    // Send to queue
  } catch (error) {
    console.error('Error checking transcription job status:', error);
  }
});
