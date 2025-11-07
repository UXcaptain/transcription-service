import { getCompletedTranscriptionJobsScheduler } from './getCompletedTranscriptionJobsScheduler.js';

export const startCronJobs = () => {
  try {
    getCompletedTranscriptionJobsScheduler.start();

    console.log('Cron jobs started');
  } catch (error) {
    console.log(`error starting cron jobs: ${error.message}`, error);
  }
};
