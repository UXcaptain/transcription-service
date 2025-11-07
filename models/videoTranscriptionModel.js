import { connectToMongoDB } from '../database/config.js';

export const insertVideoTranscriptRequestInDb = async (videoTranscriptionRequest) => {
  const db = await connectToMongoDB();

  const videoTranscriptionRequests = db.collection('videoTranscriptionRequests');

  const insertionResult = await videoTranscriptionRequests.insertOne({
    _id: videoTranscriptionRequest.analysisEntryId,
    status: 'PENDING',
    analysisId: videoTranscriptionRequest.analysisId,
    createdAt: new Date(),
  });

  const objectId = insertionResult.insertedId;

  return objectId;
};

export const updateSingleVideoTranscriptRequestInDb = async (videoTranscriptionRequestInsertId) => {
  const db = await connectToMongoDB();

  const videoTranscriptionRequests = db.collection('videoTranscriptionRequests');

  const updateResult = await videoTranscriptionRequests.updateOne(
    { _id: videoTranscriptionRequestInsertId },
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

  const videoTranscriptionsCollection = db.collection('videoTranscriptionRequests');

  const completedTranscriptions = await videoTranscriptionsCollection.find({
    sentToQueue: false,
    status: 'COMPLETED',
  }).toArray();

  return completedTranscriptions;
};

export const getTranscriptionJobDetailsFromDb = async (transcriptionJobDetails) => {
  const db = await connectToMongoDB();

  const videoTranscriptionsCollection = db.collection('videoTranscriptionRequests');

  const transcriptionJobDetailsResult = await videoTranscriptionsCollection.findOne(
    { _id: transcriptionJobDetails },
  );

  return transcriptionJobDetailsResult;
};
