import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Question from '../../../../models/Question';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keywordsParam = searchParams.get('keywords');

    if (!keywordsParam) {
      return NextResponse.json({ error: 'Keywords are required' }, { status: 400 });
    }

    const keywords = keywordsParam.split(',');
    await connectDB();

    console.log('Searching for keywords:', keywords);

    // Tìm kiếm với điều kiện mở rộng: chỉ cần khớp với một từ khóa
    // hoặc nếu câu hỏi chứa từ khóa
    const questions = await Question.find({
      $or: [
        // Tìm trong mảng keyword của câu hỏi
        { keyword: { $in: keywords } },
        // Tìm trong nội dung câu hỏi
        ...keywords.map(kw => ({ question: { $regex: kw, $options: 'i' } }))
      ],
      // Đảm bảo có câu trả lời không trống
      answer: { $exists: true, $ne: '' }
    }).lean();

    console.log(`Found ${questions.length} questions matching any keywords or content`);

    // Lọc thêm để đảm bảo answer không chỉ là khoảng trắng
    const filteredQuestions = questions.filter(q => 
      q.answer && q.answer.trim() !== '' && q.answer.trim() !== ' '
    );

    console.log(`After filtering empty answers: ${filteredQuestions.length} questions`);

    return NextResponse.json(filteredQuestions);
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 