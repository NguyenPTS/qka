import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test MongoDB connection
    await connectDB();
    
    return NextResponse.json({ 
      status: 'healthy',
      mongodb: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 