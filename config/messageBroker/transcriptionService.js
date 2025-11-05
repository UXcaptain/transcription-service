import { requestAnalysisEntryTranscription } from '../../integrations/AWS/transcriptionJob.js';


export const handleTranscriptionRequestedQueue = async (msg) => {
        const contentStr = msg.bodyToString();

        let transcriptionRequest;

        transcriptionRequest = JSON.parse(contentStr);        

    switch (transcriptionRequest.mediaType) {
        case 'video':
            // console.log('Processing video transcription message') //* Debug
            console.log(transcriptionRequest.outputBucket)
            await requestAnalysisEntryTranscription(transcriptionRequest)
        break;

        default:
            console.log(`[⚠️] Unknown media type: ${transcriptionRequest.mediaType}`);
        break;
        }
}