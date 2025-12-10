import { publishToTranscriptionCompletedQueue } from '../config/messageBroker/LavinMQ.js';
import { getS3Object } from '../integrations/AWS/S3.js';
import {
  deleteCompletedTranscriptionJobFromAWS,
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
    } else {
    // Iterate over every item
      for (let i = 0; i < completedTranscriptionJobsSummary.length; i + 1) {
        const transcriptionJob = completedTranscriptionJobsSummary[i];

        try {
        // 1. Get transcription job details from database
          const transcriptionJobDetails = await getSingleTranscriptionJobDetailsFromDb(transcriptionJob.TranscriptionJobName); //* Need this step for later usage of analysis details

          if (!transcriptionJobDetails) {
            throw Error(`job ${transcriptionJob.TranscriptionJobName} details dont exist in DB`);
          }

          // Skip if already processed - Shouldnt happen if AWS Transcribe job deletion is working properly
          if (transcriptionJobDetails.publishedToQueue) { // ? What should the condition be?
            console.log(`Skipping already processed job: ${transcriptionJob.TranscriptionJobName}`);

          //   try { // * Delete the transcription job from AWS Transcribe since it has already been completed/published
          //     await deleteCompletedTranscriptionJobFromAWS(transcriptionJob.TranscriptionJobName);
          //   } catch (error) {
          //     console.log(`failed to delete transcription job ${transcriptionJob.TranscriptionJobName}`, error);
          //   }
          //   return;
          }

          /*
            ? what im trying to do here is to see if i should process the transcription job or not? maybe it makes sense to reconcile via cron jobs or directly check for both completion and queue publishing conditions?
          */

          // 2. Construct S3 key and fetch transcription file from AWS
          // const key = `analysis/${transcriptionJobDetails.analysisId}/${transcriptionJobDetails._id}/transcription.json`;
          const key = 'analysis/464d4419-3822-41e6-8d8e-27b1783632df/eabd3179-ece0-4163-8c7e-0e2c728e11e6/transcription.json'; //* Debug - Point to the same transcription always

          const transcriptionJobResult = await getS3Object(key);

          // 3. Normalize transcription job result

          const normalizedTranscriptionJob = await normalizeTranscript(transcriptionJobResult);

          // 4. Store normalized transcript in DB and update status to COMPLETED
          await storeNormalizedTranscriptionInDb(transcriptionJob.TranscriptionJobName, normalizedTranscriptionJob);

          // try {
          //   await deleteCompletedTranscriptionJobFromAWS(transcriptionJob.TranscriptionJobName);
          // } catch (error) {
          //   console.log(`failed to delete transcription job ${transcriptionJob.TranscriptionJobName}`, error);
          // }

          // 5. Send normalized transcript to event queue

          await publishToTranscriptionCompletedQueue(transcriptionJobDetails._id, normalizedTranscriptionJob.results.segments);

          // 6. Mark as published to queue in database
          await markTranscriptionAsPublishedToQueue(transcriptionJob.TranscriptionJobName);

          return console.log(`Successfully processed transcription job: ${transcriptionJob.TranscriptionJobName}`);
        } catch (error) {
          console.error(`Error processing transcription ${transcriptionJob.TranscriptionJobName}:`, error);
        // Continue to next item
        }
      }
    }
  } catch (error) {
    console.log('error updating completed transcription jobs', error);
  }
};

export const requestAnalysisEntryTranscription = async (transcriptionRequest, transcriptionRequestInsertId) => {
  await requestAnalysisEntryTranscriptionToAWSTranscribe(transcriptionRequest, transcriptionRequestInsertId);

  await updateSingleTranscriptionRequestInDb(transcriptionRequestInsertId);
};
