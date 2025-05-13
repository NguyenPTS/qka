import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';

export async function GET(request: Request, context: { params: { id: string } }) {
  const { params } = context;
  try {
    await connectDB();
    const question = await Question.findById(params.id).lean();
    if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(question);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { params } = context;
  try {
    const body = await request.json();
    await connectDB();
    const updated = await Question.findByIdAndUpdate(
      params.id,
      {
        question: body.question,
        keyword: Array.isArray(body.keyword) ? body.keyword : (body.keyword || '').split(',').map((k: string) => k.trim()),
        answer: body.answer,
      },
      { new: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: any }) {
  const params = await context.params;
  try {
    console.log(`[API] DELETE /api/questions/${params.id} - Bắt đầu xoá câu hỏi`);
    await connectDB();
    const deleted = await Question.findByIdAndDelete(params.id).lean();
    if (!deleted) {
      console.log(`[API] DELETE /api/questions/${params.id} - Không tìm thấy câu hỏi để xoá`);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.log(`[API] DELETE /api/questions/${params.id} - Đã xoá thành công`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[API] Lỗi khi xoá câu hỏi ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 