import { publishToTranscriptionCompletedQueue } from '../config/messageBroker/LavinMQ.js';
import { getS3Object } from '../integrations/AWS/S3.js';

export const handleCompletedVideoTranscriptionJobs = async () => {
  try {
    // Get the completed Jobs from AWS Transcribe
    const completedTranscriptionJobsSummary = await listCompletedTranscriptionJobsFromAWS();

    // Iterate over every item
    const message = {
    //   analysisEntryId: analysisEntryId,
      jsonTranscription: {},
    };

    const stringifiedMessage = JSON.stringify(message);

    publishToTranscriptionCompletedQueue(stringifiedMessage);
  } catch (error) {
    console.log('error updating completed transcription jobs', error);
  }
};

export const transcriptAnalysisEntry = async (transcriptionRequest, videoTranscriptionRequestInsertId) => {
  await requestAnalysisEntryTranscription(transcriptionRequest, videoTranscriptionRequestInsertId);

  await updateSingleVideoTranscriptRequestInDb(videoTranscriptionRequestInsertId);
};
