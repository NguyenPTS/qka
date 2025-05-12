import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keywordsParam = searchParams.get('keywords');

    if (!keywordsParam) {
      return NextResponse.json({ error: 'Keywords are required' }, { status: 400 });
    }

    const keywords = keywordsParam.split(',');
    await connectDB();

    // Chỉ lấy các câu hỏi chứa TẤT CẢ các keyword đã chọn
    const questions = await Question.find({
      keyword: { $all: keywords }
    }).lean();

    return NextResponse.json(questions);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 