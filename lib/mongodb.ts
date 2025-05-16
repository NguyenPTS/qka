import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  try {
    // Get MongoDB URI from environment variable or use default for development
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable');
    }

    console.log('MongoDB URI:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));

    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} of ${maxRetries} to connect to MongoDB...`);
        
        if (cached.conn) {
          // Test existing connection
          try {
            await mongoose.connection.db.admin().ping();
            console.log('Using cached connection - verified with ping');
            return cached.conn;
          } catch (e) {
            console.log('Cached connection failed ping test, creating new connection');
            cached.conn = null;
            cached.promise = null;
          }
        }

        if (!cached.promise) {
          const opts = {
            bufferCommands: false,
            connectTimeoutMS: 10000, // 10 seconds
            socketTimeoutMS: 45000,  // 45 seconds
            serverSelectionTimeoutMS: 10000, // 10 seconds
            heartbeatFrequencyMS: 5000,     // 5 seconds
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 30000,
            waitQueueTimeoutMS: 10000,
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
          
          // Test the connection
          await mongoose.connection.db.admin().ping();
          console.log('Connection verified with ping');
          
          return cached.conn;
        } catch (e) {
          cached.promise = null;
          lastError = e;
          console.error(`Failed to establish connection (attempt ${retryCount + 1}):`, e);
          throw e;
        }
      } catch (error) {
        lastError = error;
        retryCount++;
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff with max 10s
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
    throw lastError || new Error('Failed to connect to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Add event listeners for connection issues
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

export default connectDB; 