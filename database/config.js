import { MongoClient } from 'mongodb';

// Connection URL
const url = process.env.MONGODB_URI;
const client = new MongoClient(url);
let db;

export const connectToMongoDB = async () => {
  if (db) {
    return db;
  }

  try {
    await client.connect();

    db = client.db('transcriptionServiceDB');

    console.log('Connected successfully to mongodb');

    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};
