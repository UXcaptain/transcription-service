import { publishToTranscriptionCompletedQueue } from '../config/messageBroker/LavinMQ.js';
import { getS3Object } from '../integrations/AWS/S3.js';
import { listCompletedTranscriptionJobsFromAWS, requestAnalysisEntryTranscription } from '../integrations/AWS/Transcribe.js';
import { updateSingleVideoTranscriptRequestInDb, getTranscriptionJobsDetailsFromDb } from '../models/videoTranscriptionModel.js';

export const handleCompletedVideoTranscriptionJobs = async () => {
  try {
    // Get the completed Jobs from AWS Transcribe
    const completedTranscriptionJobsSummary = await listCompletedTranscriptionJobsFromAWS();

    // Iterate over every item
    for (let i = 0; i < completedTranscriptionJobsSummary.length; i + 1) {
      const transcriptionJob = completedTranscriptionJobsSummary[i];

      try {
        // 1. Fetch JSON from AWS using transcription info (e.g., _id)
        // const jsonData = await fetchJsonFromAWS(transcription._id);

        const transcriptionJobDetails = await getTranscriptionJobsDetailsFromDb(transcriptionJob.TranscriptionJobName);

        const key = `analysis/${transcriptionJobDetails.analysisId}/${transcriptionJobDetails.analysisEntryId}/transcription.json`;

        const transcriptionFile = await getS3Object(key);

        const jsonTranscription = await transcriptionFile.json();

        console.log(jsonTranscription);
        // 2. Parse the JSON
        // const parsedData = JSON.parse(jsonTrasncription);

        // 3. Store parsed data in DB and update status value
        // await storeInDB(parsedData);

        // 4. Send parsed data to event queue
        // await sendToEventQueue(parsedData);
      } catch (error) {
        console.error(`Error processing transcription ${transcriptionJob._id}:`, error);
        // Continue to next item
      }
    }

    const message = {
    //   analysisEntryId: analysisEntryId,
      jsonTranscription: {},
    };

    const stringifiedMessage = JSON.stringify(message);

    publishToTranscriptionCompletedQueue(stringifiedMessage);
  } catch (error) {
    console.log('error updating completed transcription jobs', error);
  }
};

export const transcriptAnalysisEntry = async (transcriptionRequest, videoTranscriptionRequestInsertId) => {
  await requestAnalysisEntryTranscription(transcriptionRequest, videoTranscriptionRequestInsertId);

  await updateSingleVideoTranscriptRequestInDb(videoTranscriptionRequestInsertId);
};

/*

what i need to do is fetch the transcriptions, parse them, store them in DB and send them to the queue -- the question is - Where should each part of the process happen?

1- check completed transcriptionJobs --> as a cron job
2- update the status of the completed jobs in DB --> 
3- fetch the transcriptions & parse them & store them in DB -->
4- send them to the queue

6- cron job to delete already process jobs from AWS

el controller es el que deberia 
1- actualizar la BBDD
2- guardar la transcripcion en la BBDD
3- llamar a la cola

*/
