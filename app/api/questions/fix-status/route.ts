import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Question from '../../../../models/Question';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Starting to fix missing status fields');
    await connectDB();
    
    // Tìm tất cả các câu hỏi không có trường status hoặc status rỗng
    const questionsWithoutStatus = await Question.find({
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: '' }
      ]
    }).lean();
    
    console.log(`Found ${questionsWithoutStatus.length} questions without status field`);
    
    let updatedCount = 0;
    
    // Cập nhật từng câu hỏi
    for (const q of questionsWithoutStatus) {
      // Xác định status dựa trên nội dung câu trả lời
      const status = q.answer && q.answer.trim() && q.answer.trim() !== ' ' ? 'answered' : 'pending';
      
      // Cập nhật câu hỏi
      await Question.updateOne(
        { _id: q._id },
        { $set: { status: status } }
      );
      
      updatedCount++;
      
      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount}/${questionsWithoutStatus.length} questions`);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} questions`);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} questions with missing status field`,
      totalFixed: updatedCount,
      totalFound: questionsWithoutStatus.length
    });
  } catch (error) {
    console.error('Error fixing status fields:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix status fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 