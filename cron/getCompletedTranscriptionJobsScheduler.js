import { CronJob } from 'cron';
import { handleCompletedVideoTranscriptionJobs } from '../controllers/transcriptionController.js';

export const getCompletedTranscriptionJobsScheduler = new CronJob('15 * * * *', async () => {
  try {
    await handleCompletedVideoTranscriptionJobs();
  } catch (error) {
    console.error('Error checking transcription job status:', error);
  }
});
