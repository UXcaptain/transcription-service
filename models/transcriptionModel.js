import { connectToMongoDB } from '../database/config.js';

export const insertTranscriptionRequestInDb = async (transcriptionRequest) => {
  const db = await connectToMongoDB();

  const transcriptionRequests = db.collection('transcriptionRequests');

  const insertionResult = await transcriptionRequests.insertOne({
    _id: transcriptionRequest.analysisEntryId,
    status: 'PENDING',
    analysisId: transcriptionRequest.analysisId,
    createdAt: new Date(),
    type: transcriptionRequest.mediaType,
  });

  const objectId = insertionResult.insertedId;

  return objectId;
};

export const updateSingleTranscriptionRequestInDb = async (transcriptionRequestInsertId) => {
  const db = await connectToMongoDB();

  const transcriptionRequests = db.collection('transcriptionRequests');

  const updateResult = await transcriptionRequests.updateOne(
    { _id: transcriptionRequestInsertId },
    {
      $set: {
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
      },
    },
  );

  return updateResult;
};

export const getCompletedTranscriptions = async () => {
  const db = await connectToMongoDB();

  const transcriptionsCollection = db.collection('transcriptionRequests');

  const completedTranscriptions = await transcriptionsCollection.find({
    sentToQueue: false,
    status: 'COMPLETED',
  }).toArray();

  return completedTranscriptions;
};

export const getSingleTranscriptionJobDetailsFromDb = async (transcriptionJobDetails) => {
  const db = await connectToMongoDB();

  const transcriptionsCollection = db.collection('transcriptionRequests');

  const transcriptionJobDetailsResult = await transcriptionsCollection.findOne(
    { _id: transcriptionJobDetails },
  );

  return transcriptionJobDetailsResult;
};

export const storeNormalizedTranscriptionInDb = async (transcriptionJobInsertId, normalizedTranscriptionJob) => {
  const db = await connectToMongoDB();

  const transcriptionsCollection = db.collection('transcriptionRequests');

  const updateResult = await transcriptionsCollection.updateOne(
    { _id: transcriptionJobInsertId },
    {
      $set: {
        status: 'COMPLETED',
        transcriptionData: normalizedTranscriptionJob.results.segments,
        updatedAt: new Date(),
        publishedToQueue: false,
      },
    },
  );

  return updateResult;
};

export const markTranscriptionAsPublishedToQueue = async (transcriptionJobInsertId) => {
  const db = await connectToMongoDB();

  const transcriptionsCollection = db.collection('transcriptionRequests');

  const updateResult = await transcriptionsCollection.updateOne(
    { _id: transcriptionJobInsertId },
    {
      $set: {
        publishedToQueue: false,
        updatedAt: new Date(),
      },
    },
  );

  return updateResult;
};

export const getTranscriptionJobsInCompletedStatusNotPublishedToQueue = async () => {
  const db = await connectToMongoDB();

  const transcriptionsCollection = db.collection('transcriptionRequests');

  const transcriptionJobs = await transcriptionsCollection.find({
    status: 'COMPLETED',
    publishedToQueue: false,
  }).toArray();

  return transcriptionJobs;
};
