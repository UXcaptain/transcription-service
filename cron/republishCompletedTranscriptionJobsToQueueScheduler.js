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
      try {
        await publishToTranscriptionCompletedQueue(job._id, job.transcriptionData.segments, job.transcriptionData.fullTranscript);

        // Only mark as published if publishing succeeded
        await markTranscriptionAsPublishedToQueue(job._id);
      } catch (error) {
        console.error(`Failed to publish transcription job ${job._id} to queue:`, error.message);
        // Job will remain unpublished and be retried in the next iteration
      }
    }
  } catch (error) {
    console.error('Error checking transcription job status:', error);
  }
});
