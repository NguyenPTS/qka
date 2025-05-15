import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Question from '../../../../models/Question';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const question = await Question.findById(id).lean();
    if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(question);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    await connectDB();

    // Chuẩn bị dữ liệu cập nhật
    const updateData: any = {};
    
    // Nếu có question, cập nhật question
    if (body.question) {
      updateData.question = body.question;
    }

    // Nếu có keyword, cập nhật keyword
    if (body.keyword) {
      updateData.keyword = Array.isArray(body.keyword) 
        ? body.keyword 
        : body.keyword.split(',').map((k: string) => k.trim());
    }

    // Nếu có answer, cập nhật answer
    if (body.answer) {
      updateData.answer = body.answer;
    }

    // Nếu có images, cập nhật images
    if (body.images) {
      updateData.images = body.images;
    }

    // Nếu có status, cập nhật status
    if (body.status) {
      updateData.status = body.status;
    }

    const updated = await Question.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating question:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    console.log(`[API] DELETE /api/questions/${id} - Bắt đầu xoá câu hỏi`);
    await connectDB();
    const deleted = await Question.findByIdAndDelete(id).lean();
    if (!deleted) {
      console.log(`[API] DELETE /api/questions/${id} - Không tìm thấy câu hỏi để xoá`);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.log(`[API] DELETE /api/questions/${id} - Đã xoá thành công`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[API] Lỗi khi xoá câu hỏi ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 