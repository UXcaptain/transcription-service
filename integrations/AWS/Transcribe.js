import {
  TranscribeClient, StartTranscriptionJobCommand, ListTranscriptionJobsCommand,
} from '@aws-sdk/client-transcribe';

const transcribeClient = new TranscribeClient({ region: process.env.AWS_REGION });

export const requestAnalysisEntryTranscription = async (transcriptionRequest, insertId) => {
  const command = new StartTranscriptionJobCommand({
    TranscriptionJobName: insertId,
    LanguageCode: transcriptionRequest.languageCode,
    Media: {
      MediaFileUri: `s3://${transcriptionRequest.outputBucket}/analysis/${transcriptionRequest.analysisId}/${transcriptionRequest.analysisEntryId}/recording.mp4`,
    },
    OutputBucketName: transcriptionRequest.outputBucket,
    OutputKey: `analysis/${transcriptionRequest.analysisId}/${transcriptionRequest.analysisEntryId}/transcription.json`,
  });

  const response = await transcribeClient.send(command);

  return response.TranscriptionJob.TranscriptionJobName;
};

export const listCompletedTranscriptionJobsFromAWS = async () => {
  const command = new ListTranscriptionJobsCommand({
    Status: 'COMPLETED',
    // MaxResults: 100,
    MaxResults: 3, //* debug

  });

  const completedTranscriptionJobs = await transcribeClient.send(command);
  const completedTranscriptionJobsSummary = completedTranscriptionJobs.TranscriptionJobSummaries; // returns an array

  return completedTranscriptionJobsSummary;
};
