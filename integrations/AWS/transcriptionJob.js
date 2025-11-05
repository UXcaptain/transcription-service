import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';

const transcribeClient = new TranscribeClient({ region: process.env.AWS_REGION });

export const requestAnalysisEntryTranscription = async (transcriptionRequest) => {
    console.log(`Starting transcription job for analysisId ${transcriptionRequest.analysisId} & analysis entryId: ${transcriptionRequest.analysisEntryId}`)

    const transcriptionJobName = `analysisEntryTranscription-${transcriptionRequest.analysisEntryId}`;
    
    const command = new StartTranscriptionJobCommand({
        TranscriptionJobName: transcriptionJobName,
        LanguageCode: transcriptionRequest.languageCode,
        Media: {
            MediaFileUri: `s3://${transcriptionRequest.outputBucket}/analysis/${transcriptionRequest.analysisId}/${transcriptionRequest.analysisEntryId}/recording.mp4`
        },
        OutputBucketName: transcriptionRequest.outputBucket,
        OutputKey: `analysis/${transcriptionRequest.analysisId}/${transcriptionRequest.analysisEntryId}/transcription.json`,
    });
    
    const response = await transcribeClient.send(command);
    
    return response.TranscriptionJob?.TranscriptionJobName;
};

export const getTranscriptionJob = async (transcriptionJobName) => {
    const command = new GetTranscriptionJobCommand({
        TranscriptionJobName: transcriptionJobName
    });

    const response = await transcribeClient.send(command);
    
    return response.TranscriptionJob;
};

export const checkTranscriptionStatus = async (transcriptionJobName) => {
    const job = await getTranscriptionJob(transcriptionJobName);
    return job?.TranscriptionJobStatus || 'FAILED';
};
