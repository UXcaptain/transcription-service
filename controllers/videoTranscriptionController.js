import { getCompletedTranscriptionJobs, requestAnalysisEntryTranscription } from '../integrations/AWS/transcriptionJob.js';
import { updateCompletedVideoTranscriptionJobsInDb, updateSingleVideoTranscriptRequestInDb } from '../models/videoTranscriptionModel.js';

export const handleCompletedVideoTranscriptionJobs = async () => {
  try {
    // Get the completed Jobs from AWS Transcribe
    const completedTranscriptionJobsSummary = await listCompletedTranscriptionJobsFromAWS();

    await updateCompletedVideoTranscriptionJobsInDb(completedTranscriptionJobsSummary);
  } catch (error) {
    console.log('error updating completed transcription jobs', error);
  }
};

export const transcriptAnalysisEntry = async (transcriptionRequest, videoTranscriptionRequestInsertId) => {
  await requestAnalysisEntryTranscription(transcriptionRequest, videoTranscriptionRequestInsertId);

  await updateSingleVideoTranscriptRequestInDb(videoTranscriptionRequestInsertId);
};
