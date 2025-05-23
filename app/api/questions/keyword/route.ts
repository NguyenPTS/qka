import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Question from '../../../../models/Question';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('question');

    console.log('Keyword search query:', query);

    if (!query) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    await connectDB();
    
    const normalizedQuery = query.toLowerCase().trim();
    console.log('Normalized query:', normalizedQuery);
    
    // Chia câu query thành các từ riêng biệt để tìm kiếm
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 2);
    console.log('Query words:', queryWords);
    
    // Tìm tất cả document có question hoặc keyword khớp với bất kỳ từ nào trong query
    const docs = await Question.find({
      $or: [
        // Tìm trong câu hỏi với từng từ trong query
        ...queryWords.map(word => ({ question: { $regex: word, $options: 'i' } })),
        // Tìm trong keywords với từng từ trong query
        ...queryWords.map(word => ({ keyword: { $regex: word, $options: 'i' } })),
        // Tìm với toàn bộ câu query
        { question: { $regex: normalizedQuery, $options: 'i' } },
        { keyword: { $regex: normalizedQuery, $options: 'i' } }
      ],
      // Chỉ tìm những câu hỏi đã có câu trả lời
      answer: { $exists: true, $ne: '' }
    }).lean();
    
    console.log(`Found ${docs.length} matching documents`);

    // Lấy tất cả keyword liên quan, loại trùng
    const allKeywords = docs.flatMap(doc => Array.isArray(doc.keyword) ? doc.keyword : []);
    const uniqueKeywords = Array.from(new Set(allKeywords));
    
    console.log(`Extracted ${uniqueKeywords.length} unique keywords`);
    
    return NextResponse.json(uniqueKeywords);
  } catch (error: any) {
    console.error('Keyword search error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 