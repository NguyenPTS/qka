import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Question from '../../../../models/Question';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  // Lấy tất cả câu hỏi có status là 'done' hoặc 'answered'
  const questions = await Question.find({ status: { $in: ['done', 'answered'] } })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ success: true, data: questions });
}
