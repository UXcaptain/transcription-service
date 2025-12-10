import { publishToTranscriptionCompletedQueue } from '../config/messageBroker/LavinMQ.js';
import {
  deleteCompletedTranscriptionJobFromAWS,
  fetchSingleTranscriptionJob,
  listCompletedTranscriptionJobsFromAWS, requestAnalysisEntryTranscriptionToAWSTranscribe,
} from '../integrations/AWS/Transcribe.js';
import {
  updateSingleTranscriptionRequestInDb,
  getSingleTranscriptionJobDetailsFromDb,
  storeNormalizedTranscriptionInDb,
  markTranscriptionAsPublishedToQueue,
} from '../models/transcriptionModel.js';
import { normalizeTranscript } from '../utils/transcriptionJobDataNormalizer.js';

export const handleCompletedVideoTranscriptionJobs = async () => {
  try {
    // Get the completed Jobs from AWS Transcribe
    const completedTranscriptionJobsSummary = await listCompletedTranscriptionJobsFromAWS();

    if (completedTranscriptionJobsSummary.length === 0) {
      console.log('no completed transcription jobs available to process');
      return;
    }
    // Iterate over every item
    for (let i = 0; i < completedTranscriptionJobsSummary.length; i + 1) {
      const transcriptionJob = completedTranscriptionJobsSummary[i];

      await processTranscriptionJob(transcriptionJob);
    }
    return;
  } catch (error) {
    console.log('error processing transcription jobs', error);
  }
};

export const requestAnalysisEntryTranscription = async (transcriptionRequest, transcriptionRequestInsertId) => {
  await requestAnalysisEntryTranscriptionToAWSTranscribe(transcriptionRequest, transcriptionRequestInsertId);

  await updateSingleTranscriptionRequestInDb(transcriptionRequestInsertId);
};

const processTranscriptionJob = async (transcriptionJob) => {
  try {
    // 1. Get transcription job details from database
    const transcriptionJobDetails = await getSingleTranscriptionJobDetailsFromDb(transcriptionJob.TranscriptionJobName);

    // Deleted from AWS if already processed - Shouldnt happen if AWS Transcribe job deletion is working properly

    // if (transcriptionJobDetails.status === 'COMPLETED') { // I just need to handle here duplicate returned entries - reposting them to the queue is a retry job for another function
    //   console.log(`Skipping already processed job: ${transcriptionJob.TranscriptionJobName}`);
    //   return await deleteCompletedTranscriptionJobFromAWS(transcriptionJob.TranscriptionJobName);
    // }

    // 2. Construct S3 key and fetch transcription file from AWS
    const transcriptionJobResult = await fetchSingleTranscriptionJob(transcriptionJobDetails.analysisId, transcriptionJobDetails._id);

    // 3. Normalize transcription job result

    const normalizedTranscriptionJob = await normalizeTranscript(transcriptionJobResult);

    // 4. Store normalized transcript in DB and update status to COMPLETED
    await storeNormalizedTranscriptionInDb(transcriptionJob.TranscriptionJobName, normalizedTranscriptionJob);

    // try {
    //   await deleteCompletedTranscriptionJobFromAWS(transcriptionJob.TranscriptionJobName);
    // } catch (error) {
    //   console.log(`failed to delete transcription job ${transcriptionJob.TranscriptionJobName}`, error);
    // This is not an issue since it will be caught by a CRON-based retry mechanism
    // }

    try {
      // 5. Send normalized transcript to event queue
      await publishToTranscriptionCompletedQueue(transcriptionJobDetails._id, normalizedTranscriptionJob.results.segments);

      // 6. Mark as published to queue in database
      await markTranscriptionAsPublishedToQueue(transcriptionJob.TranscriptionJobName);
    } catch (error) {
      console.log('error publishing transcription job to queue', error);
    }

    return console.log(`Successfully processed transcription job: ${transcriptionJob.TranscriptionJobName}`);
  } catch (error) {
    console.error(`Error processing transcription ${transcriptionJob.TranscriptionJobName}:`, error);
  }
};
