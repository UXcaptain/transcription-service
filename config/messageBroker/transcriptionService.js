import { requestAnalysisEntryTranscription, startTranscriptionPolling } from '../../integrations/AWS/transcriptionJob.js';
import { publishTranscriptionCompletedQueue } from './LavinMQ.js';

export const handleTranscriptionRequestedQueue = async (msg) => {
  const contentStr = msg.bodyToString();
  const transcriptionRequest = JSON.parse(contentStr);

  switch (transcriptionRequest.mediaType) {
    case 'video':
      // console.log('Processing video transcription message') //* Debug
      const transcriptionRequest = await requestAnalysisEntryTranscription(transcriptionRequest);

      const jobStatus = await startTranscriptionPolling('transcriptionJob');

      if (jobStatus.status === 'COMPLETED') {
        
        const message = { // TODO -- fix message sent to transcriptionCompletedQueue - Probably will need to send analysisId and analysisEntryId so that the main service can fetch the transcription.json and store the transcript
        };

        const stringifiedMessage = JSON.stringify(message);

        await publishTranscriptionCompletedQueue(stringifiedMessage);
      }

      else if (jobStatus.status === 'FAILED') {
        console.error(`[⚠️] Transcription job failed for transcriptionId: ${transcriptionRequest.transcriptionId}`);
      }
      break;

    case 'audio': // Prepare for the future, if needed
      // console.log('Processing audio transcription message') //* Debug
      break;

    default:
      console.log(`[⚠️] Unknown media type: ${transcriptionRequest.mediaType}`);
      break;
  }
};
