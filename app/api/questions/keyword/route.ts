import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const question = searchParams.get('question');

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    await connectDB();
    const normalizedQuestion = question.toLowerCase().trim();
    // Tìm document đầu tiên khớp với câu hỏi (dùng regex linh hoạt)
    const doc = await Question.findOne({
      question: { $regex: normalizedQuestion, $options: 'i' }
    });
    if (!doc) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(doc.keyword || []);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 