import { NextResponse, NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const skip = (page - 1) * pageSize;
    await connectDB();
    const total = await Question.countDocuments();
    const questions = await Question.find({})
      .skip(skip)
      .limit(pageSize)
      .lean();
    return NextResponse.json({ data: questions, total });
  } catch (error: any) {
    console.error('[API] Lỗi khi fetch all questions:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 