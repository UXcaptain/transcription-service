import { getCompletedTranscriptionJobsScheduler } from './getCompletedTranscriptionJobsScheduler.js';
import { republishCompletedTranscriptionJobsToQueueScheduler } from './republishCompletedTranscriptionJobsToQueueScheduler.js';

export const startCronJobs = () => {
  try {
    getCompletedTranscriptionJobsScheduler.start();
    republishCompletedTranscriptionJobsToQueueScheduler.start();

    console.log('Cron jobs started');
  } catch (error) {
    console.log(`error starting cron jobs: ${error.message}`, error);
  }
};
