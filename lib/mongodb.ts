import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

console.log('MongoDB URI:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@')); // Ẩn mật khẩu trong log

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    if (cached.conn) {
      console.log('Using cached connection');
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
      };

      console.log('Creating new connection...');
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('MongoDB connected successfully');
        return mongoose;
      });
    }

    try {
      cached.conn = await cached.promise;
      console.log('Connection established');
      return cached.conn;
    } catch (e) {
      cached.promise = null;
      console.error('Failed to establish connection:', e);
      throw e;
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default connectDB; 