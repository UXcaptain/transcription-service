import { ObjectId } from 'mongodb';
import { connectToMongoDB } from '../database/config.js';

export const updateCompletedVideoTranscriptionJobsInDb = async (videoTranscriptionjobIds) => {
  const db = await connectToMongoDB();

  const videoTranscriptionsCollection = db.collection('videoTranscriptionRequests');

  const bulkOps = videoTranscriptionjobIds.map((item) => ({
    updateOne: {
      filter: { _id: ObjectId.createFromHexString(item.TranscriptionJobName), status: 'IN_PROGRESS' },
      update: {
        $set: {
          CompletionTime: item.CompletionTime,
          updatedAt: new Date(),
          status: item.TranscriptionJobStatus,
          sentToQueue: false,
        },
      },
      upsert: false,
    },
  }));

  try {
    const result = await videoTranscriptionsCollection.bulkWrite(bulkOps);
    return result;
  } catch (err) {
    return console.error('Bulk update error:', err);
  }
};

export const insertVideoTranscriptRequestInDb = async (videoTranscriptionRequest) => {
  const db = await connectToMongoDB();

  const videoTranscriptionRequests = db.collection('videoTranscriptionRequests');

  const insertionResult = await videoTranscriptionRequests.insertOne({
    status: 'PENDING',
    analysisId: videoTranscriptionRequest.analysisId,
    analysisEntryId: videoTranscriptionRequest.analysisEntryId,
    createdAt: new Date(),
  });

  const objectId = insertionResult.insertedId.toString();

  return objectId;
};

export const updateSingleVideoTranscriptRequestInDb = async (videoTranscriptionRequestInsertId) => {
  const db = await connectToMongoDB();

  const videoTranscriptionRequests = db.collection('videoTranscriptionRequests');

  const updateResult = await videoTranscriptionRequests.updateOne(
    { _id: ObjectId.createFromHexString(videoTranscriptionRequestInsertId) },
    {
      $set: {
        status: 'IN_PROGRESS',
        updatedAt: new Date(),
      },
    },
  );

  return updateResult; // TODO -- CHECK IF THIS WORKS
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
