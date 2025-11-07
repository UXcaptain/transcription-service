import { CronJob } from 'cron';
import { updateCompletedVideoTranscriptionJobs } from '../controllers/videoTranscriptionController.js';

export const getCompletedTranscriptionJobsScheduler = new CronJob('* * * * *', async () => {
  try {
    updateCompletedVideoTranscriptionJobs();
  } catch (error) {
    console.error('Error checking transcription job status:', error);
  }
});
