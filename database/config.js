import { MongoClient } from 'mongodb';

// Connection URL
const url = process.env.MONGODB_URI;
const client = new MongoClient(url);

export const connectToMongoDB = async () => {
  let db;

  if (!db) {
    try {
      await client.connect();

      const transcriptionServiceDb = client.db('transcriptionServiceDB');

      console.log('Connected successfully to mongodb'); // TODO - check why this is being called everytime

      return transcriptionServiceDb;
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  return db;
};
