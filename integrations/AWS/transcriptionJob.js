import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand, GetTranscriptionJobCommand  } from '@aws-sdk/client-transcribe';
import { publishToInsightsQueue } from '../../config/messageBroker/LavinMQ';

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

export const pollTranscriptionJob = async (transcriptionJobName) => {
    try {
        const status = await checkTranscriptionStatus(transcriptionJobName);
        
        if (status === 'COMPLETED') {
            // Publish successful transcription completion to insights queue
            console.log(`Transcription job ${transcriptionJobName} completed successfully`);
            await publishToInsightsQueue({
                type: 'TRANSCRIPTION_COMPLETED',
                transcriptionJobName: transcriptionJobName,
                timestamp: new Date().toISOString()
            });
        } else if (status === 'FAILED') {
            // Publish transcription failure to insights queue
            console.error(`Transcription job ${transcriptionJobName} failed`);
            await publishToInsightsQueue({
                type: 'TRANSCRIPTION_FAILED',
                transcriptionJobName: transcriptionJobName,
                timestamp: new Date().toISOString(),
                error: 'Transcription job failed'
            });
        }
        
        return status;
    } catch (error) {
        console.error('Error polling transcription job:', error);
        // Publish error to insights queue
        await publishToInsightsQueue({
            type: 'TRANSCRIPTION_POLLING_ERROR',
            transcriptionJobName: transcriptionJobName,
            timestamp: new Date().toISOString(),
            error: error.message
        });
        throw error;
    }
};

export const startTranscriptionPolling = async (transcriptionJobName, checkIntervalMs = 30000) => {
    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            try {
                const status = await pollTranscriptionJob(transcriptionJobName);
                
                if (status === 'COMPLETED' || status === 'FAILED') {
                    clearInterval(interval);
                    resolve(status);
                }
            } catch (error) {
                clearInterval(interval);
                reject(error);
            }
        }, checkIntervalMs);
    });
};