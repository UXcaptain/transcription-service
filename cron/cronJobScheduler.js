import { getCompletedTranscriptionJobsScheduler } from './getCompletedTranscriptionJobsScheduler.js';
import { sendToTranscriptionCompletedQueue } from './sendToTranscriptionCompletedQueue.js';

export const startCronJobs = () => {
  try {
    getCompletedTranscriptionJobsScheduler.start();
    sendToTranscriptionCompletedQueue.start();

    console.log('Cron jobs started');
  } catch (error) {
    console.log(`error starting cron jobs: ${error.message}`, error);
  }
};
