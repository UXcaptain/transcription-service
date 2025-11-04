import { requestAnalysisEntryTranscription } from '../../integrations/AWS/transcriptionJob.js';


export const handleTranscriptionRequestedQueue = async (msg) => {
        const contentStr = msg.bodyToString();     
        const content = JSON.parse(contentStr);
    
    switch (content.mediaType) {
        case 'video':
            console.log('Processing video transcription message')
            await requestAnalysisEntryTranscription(content)
        break;

        default:
            console.log(`[⚠️] Unknown media type: ${content.mediaType}`);
        break;
        }
}