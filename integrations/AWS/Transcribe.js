import {
  TranscribeClient, StartTranscriptionJobCommand, ListTranscriptionJobsCommand,
  DeleteTranscriptionJobCommand,
} from '@aws-sdk/client-transcribe';
import { getS3Object } from './S3.js';

const transcribeClient = new TranscribeClient({ region: process.env.AWS_REGION });

export const requestAnalysisEntryTranscriptionToAWSTranscribe = async (transcriptionRequest, insertId) => {
  const command = new StartTranscriptionJobCommand({
    TranscriptionJobName: insertId,
    LanguageCode: transcriptionRequest.languageCode,
    Media: {
      MediaFileUri: `s3://${process.env.AWS_BUCKET}/analysis/${transcriptionRequest.analysisId}/${transcriptionRequest.analysisEntryId}/recording.mp4`,
    },
    OutputBucketName: process.env.AWS_BUCKET,
    OutputKey: `analysis/${transcriptionRequest.analysisId}/${transcriptionRequest.analysisEntryId}/transcription.json`,
  });

  const response = await transcribeClient.send(command);

  return response.TranscriptionJob.TranscriptionJobName;
};

export const listCompletedTranscriptionJobsFromAWS = async () => {
  const command = new ListTranscriptionJobsCommand({
    Status: 'COMPLETED',
    MaxResults: 100,

  });

  const completedTranscriptionJobs = await transcribeClient.send(command);
  const completedTranscriptionJobsSummary = completedTranscriptionJobs.TranscriptionJobSummaries; // returns an array

  return completedTranscriptionJobsSummary;
};

export const fetchSingleTranscriptionJob = async (analysisId, analysisEntryId) => {
  const key = process.env.DEPLOY_ENVIRONMENT === 'localhost' ? 'analysis/464d4419-3822-41e6-8d8e-27b1783632df/eabd3179-ece0-4163-8c7e-0e2c728e11e6/transcription.json' : `analysis/${analysisId}/${analysisEntryId}/transcription.json`;

  const transcriptionJobResult = await getS3Object(key);

  return transcriptionJobResult;
};

export const deleteCompletedTranscriptionJobFromAWS = async (transcriptionJobName) => {
  const command = new DeleteTranscriptionJobCommand({
    TranscriptionJobName: transcriptionJobName,
  });

  const deletedTranscriptionJobs = await transcribeClient.send(command);
  // returns an array

  return deletedTranscriptionJobs;
};
