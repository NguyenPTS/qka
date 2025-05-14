import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('question');

    if (!query) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    await connectDB();
    const normalizedQuery = query.toLowerCase().trim();
    // Tìm tất cả document có question hoặc keyword khớp query
    const docs = await Question.find({
      $or: [
        { question: { $regex: normalizedQuery, $options: 'i' } },
        { keyword: { $regex: normalizedQuery, $options: 'i' } }
      ]
    });
    // Lấy tất cả keyword liên quan, loại trùng
    const keywords = Array.from(new Set(docs.flatMap(doc => doc.keyword)));
    return NextResponse.json(keywords);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 