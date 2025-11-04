import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { publishToInsightsQueue } from '../../config/messageBroker/LavinMQ';

const sfnClient = new SFNClient({ region: process.env.AWS_REGION });

export const requestAnalysisEntryTranscription = async (transcriptionRequest) => {
    console.log('Starting transcription job for analysis entry Id & analysis Id:', transcriptionRequest.analysisEntryId, transcriptionRequest.analysisId, )

    const input = {
        transcriptionJobName: `analysisEntryTranscription-${transcriptionRequest.analysisEntryId}`,
        mediaFileUri: `s3://${transcriptionRequest.bucket}/analysis/${transcriptionRequest.analysisId}/${transcriptionRequest.analysisEntryId}/recording.mp4`,
        outputBucket: transcriptionRequest.bucket,
        languageCode: transcriptionRequest.languageCode,
        outputKey: `analysis/${transcriptionRequest.analysisId}/${transcriptionRequest.analysisEntryId}/transcription.json`,
    };
    
    const command = new StartExecutionCommand({
        stateMachineArn: process.env.AWS_TRANSCRIPTIONJOB_MACHINE_ARN,
        input: JSON.stringify(input),
        name: `analysisEntry-${transcriptionRequest.analysisEntryId}-${Date.now()}`,
    });
    
    const response = await sfnClient.send(command);
    
    return response.executionArn;
};

export const pollTranscriptionJob = async (executionArn) => {
    const command = new DescribeExecutionCommand({
        executionArn,
    });

    const response = await sfnClient.send(command);

    publishToInsightsQueue(); // TODO - complete this setup

    return response.status;
};