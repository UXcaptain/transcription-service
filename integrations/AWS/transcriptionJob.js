import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';

const transcribeClient = new TranscribeClient({ region: process.env.AWS_REGION });

export const requestAnalysisEntryTranscription = async (transcriptionRequest) => {

  const transcriptionJobName = `analysisEntryTranscription-${transcriptionRequest.analysisEntryId}`;

  const command = new StartTranscriptionJobCommand({
    TranscriptionJobName: transcriptionJobName,
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

export const startTranscriptionPolling = async (transcriptionJobName, checkIntervalMs = 30000) => {
  const checkingInterval = setInterval(async () => {
    const command = new GetTranscriptionJobCommand({
      TranscriptionJobName: transcriptionJobName,
    });

    const transcriptionJobData = await transcribeClient.send(command);

    const jobStatus = transcriptionJobData?.TranscriptionJob.TranscriptionJobStatus;

    if (jobStatus === 'COMPLETED' || jobStatus === 'FAILED') {
      clearInterval(checkingInterval);
      return jobStatus;
    }
  }, checkIntervalMs);
};
