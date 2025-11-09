import { CronJob } from 'cron';
import { handleCompletedVideoTranscriptionJobs } from '../controllers/transcriptionController.js';

export const getCompletedTranscriptionJobsScheduler = new CronJob('* * * * *', async () => {
  try {
    await handleCompletedVideoTranscriptionJobs();
  } catch (error) {
    console.error('Error checking transcription job status:', error);
  }
});
