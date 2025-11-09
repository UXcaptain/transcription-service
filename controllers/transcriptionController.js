import { publishToTranscriptionCompletedQueue } from '../config/messageBroker/LavinMQ.js';
import { getS3Object } from '../integrations/AWS/S3.js';
import { deleteCompletedTranscriptionJobsFromAWS, listCompletedTranscriptionJobsFromAWS, requestAnalysisEntryTranscription } from '../integrations/AWS/Transcribe.js';
import {
  updateSingleTranscriptionRequestInDb, getSingleTranscriptionJobDetailsFromDb, storeParsedTranscriptionInDb, markTranscriptionAsPublishedToQueue,
} from '../models/transcriptionModel.js';

export const handleCompletedVideoTranscriptionJobs = async () => {
  try {
    // Get the completed Jobs from AWS Transcribe
    const completedTranscriptionJobsSummary = await listCompletedTranscriptionJobsFromAWS();

    // Iterate over every item
    for (let i = 0; i < completedTranscriptionJobsSummary.length; i++) {
      const transcriptionJob = completedTranscriptionJobsSummary[i];

      try {
        // 1. Get transcription job details from database
        const transcriptionJobDetails = await getSingleTranscriptionJobDetailsFromDb(transcriptionJob.TranscriptionJobName);

        if (!transcriptionJobDetails) {
          throw Error(`job ${transcriptionJob.TranscriptionJobName} details dont exist in DB`);
        }

        // Skip if already processed - Shouldnt happen too often if AWS Transcribe job deletion CRON is working properly
        if (transcriptionJobDetails.publishedToQueue) {
          console.log(`Skipping already processed job: ${transcriptionJob.TranscriptionJobName}`);
          return;
        }

        // 2. Construct S3 key and fetch transcription file from AWS
        const key = `analysis/${transcriptionJobDetails.analysisId}/${transcriptionJobDetails._id}/transcription.json`;

        const transcriptionJobDataStructure = await getS3Object(key);

        // 3. Parse the transcription data structure
        const parsedTranscriptionJobDataStructure = JSON.parse(transcriptionJobDataStructure);

        // 4. Store parsed data in DB and update status to COMPLETED
        await storeParsedTranscriptionInDb(transcriptionJob.TranscriptionJobName, parsedTranscriptionJobDataStructure);

        try {
          await deleteCompletedTranscriptionJobsFromAWS(transcriptionJob.TranscriptionJobName);
        } catch (error) {
          console.log(`failed to delete transcription job ${transcriptionJob.TranscriptionJobName}`, error);
        }

        // 5. Send parsed data to event queue
        const message = {
          analysisEntryId: transcriptionJobDetails._id,
          transcriptionData: parsedTranscriptionJobDataStructure.results,
        };

        const stringifiedMessage = JSON.stringify(message);
        publishToTranscriptionCompletedQueue(stringifiedMessage);

        // 6. Mark as published to queue in database
        await markTranscriptionAsPublishedToQueue(transcriptionJob.TranscriptionJobName);

        console.log(`Successfully processed transcription job: ${transcriptionJob.TranscriptionJobName}`);
      } catch (error) {
        console.error(`Error processing transcription ${transcriptionJob.TranscriptionJobName}:`, error);
        // Continue to next item
      }
    }
  } catch (error) {
    console.log('error updating completed transcription jobs', error);
  }
};

export const transcriptAnalysisEntry = async (transcriptionRequest, transcriptionRequestInsertId) => {
  await requestAnalysisEntryTranscription(transcriptionRequest, transcriptionRequestInsertId);

  await updateSingleTranscriptionRequestInDb(transcriptionRequestInsertId);
};
