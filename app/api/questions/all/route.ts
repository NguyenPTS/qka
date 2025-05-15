import { NextResponse, NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';

export const dynamic = 'force-dynamic'; // Đánh dấu route này là dynamic

export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/questions/all - Nhận request');
    
    // Lấy params từ searchParams của NextRequest
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const skip = (page - 1) * pageSize;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sort') === 'asc' ? 1 : -1;

    await connectDB();
    console.log('[API] Đã kết nối DB');
    
    const total = await Question.countDocuments();
    console.log(`[API] Tổng số câu hỏi: ${total}`);
    
    const questions = await Question.find({})
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(pageSize)
      .lean();
      
    console.log(`[API] Trả về ${questions.length} câu hỏi, sortBy=${sortBy}, sort=${sortOrder}`);
    return NextResponse.json({ data: questions, total });
  } catch (error: any) {
    console.error('[API] Lỗi khi fetch all questions:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 