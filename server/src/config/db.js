import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  // Waits until Atlas accepts the connection, or throws if it can't.
  await mongoose.connect(env.mongodbUri);
  console.log(`MongoDB connected (${mongoose.connection.name})`);
}
