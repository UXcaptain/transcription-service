import { CronJob } from 'cron';
import { publishToTranscriptionCompletedQueue } from '../config/messageBroker/LavinMQ.js';
import {
  getTranscriptionJobsInCompletedStatusNotPublishedToQueue,
  markTranscriptionAsPublishedToQueue,
} from '../models/transcriptionModel.js';

export const republishCompletedTranscriptionJobsToQueueScheduler = new CronJob('5 * * * *', async () => {
  try {
    const jobsArrayInCompletedStatusButNotPublishedToQueue = await getTranscriptionJobsInCompletedStatusNotPublishedToQueue();

    for (const job of jobsArrayInCompletedStatusButNotPublishedToQueue) {
      await publishToTranscriptionCompletedQueue(job._id, job.results.segments);

      await markTranscriptionAsPublishedToQueue(job._id);
    }
  } catch (error) {
    console.error('Error checking transcription job status:', error);
  }
});
