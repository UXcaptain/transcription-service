import { publishToTranscriptionCompletedQueue } from '../config/messageBroker/LavinMQ.js';
import { getS3Object } from '../integrations/AWS/S3.js';
import { listCompletedTranscriptionJobsFromAWS, requestAnalysisEntryTranscription } from '../integrations/AWS/Transcribe.js';

export const handleCompletedVideoTranscriptionJobs = async () => {
  try {
    // Get the completed Jobs from AWS Transcribe
    const completedTranscriptionJobsSummary = await listCompletedTranscriptionJobsFromAWS();

    // Iterate over every item
    for (let i = 0; i < completedTranscriptionJobsSummary.length; i + 1) {
      const transcriptionJob = completedTranscriptionJobsSummary[i];


      try {
        // 1. Fetch JSON from AWS using transcription info (e.g., _id)
        // const jsonData = await fetchJsonFromAWS(transcription._id);

        const transcriptionJobDetails = await getTranscriptionJobsDetailsFromDb(transcriptionJob.TranscriptionJobName);

        const key = `analysis/${transcriptionJobDetails.analysisId}/${transcriptionJobDetails.analysisEntryId}/transcription.json`;

        const jsonTranscription = await getS3Object(key);

        console.log(jsonTranscription);
      } catch (error) {
        console.error(`Error processing transcription ${transcriptionJob._id}:`, error);
        // Continue to next item
      }
    }

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
