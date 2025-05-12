import { NextResponse } from 'next/server';
import mongoose, { PipelineStage } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';

interface DatabaseError extends Error {
  message: string;
}

interface SearchError extends Error {
  message: string;
  pipeline?: unknown;
  stage?: unknown;
}

export async function GET(request: Request) {
  try {
    console.log('=== Starting keyword search ===');
    const { searchParams } = new URL(request.url);
    const question = searchParams.get('question');

    if (!question) {
      console.log('No question provided');
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    console.log('Input question:', question);
    
    try {
      console.log('Connecting to MongoDB...');
      await connectDB();
      console.log('MongoDB connection successful');
    } catch (error) {
      const dbError = error as DatabaseError;
      console.error('MongoDB connection failed:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: dbError.message 
      }, { status: 500 });
    }

    try {
      // Chuẩn hóa câu hỏi đầu vào
      const normalizedQuestion = question.toLowerCase().trim();
      console.log('Normalized question:', normalizedQuestion);
      
      // Tạo các cụm từ tìm kiếm
      const words = normalizedQuestion.split(/\s+/);
      console.log('Words:', words);
      
      const searchTerms: string[] = [];
      
      // Thêm từng từ đơn lẻ (nếu độ dài > 2)
      for (let i = 0; i < words.length; i++) {
        if (words[i].length > 2) {
          searchTerms.push(words[i]);
        }
      }
      
      // Thêm cụm 2 từ liên tiếp
      for (let i = 0; i < words.length - 1; i++) {
        searchTerms.push(`${words[i]} ${words[i + 1]}`);
      }
      
      // Thêm cụm 3 từ liên tiếp
      for (let i = 0; i < words.length - 2; i++) {
        searchTerms.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      }

      console.log('Generated search terms:', searchTerms);

      // Tìm kiếm với điều kiện linh hoạt hơn
      const pipeline: PipelineStage[] = [
        {
          $match: {
            $or: [
              // Tìm chính xác cụm từ
              { 
                question: { 
                  $regex: normalizedQuestion,
                  $options: 'i'
                } 
              },
              // Tìm theo từng cụm từ
              {
                question: {
                  $regex: searchTerms.join('|'),
                  $options: 'i'
                }
              }
            ]
          }
        },
        // Tách mảng keyword
        { 
          $unwind: {
            path: '$keyword'
          }
        },
        // Gom nhóm và tính điểm cho mỗi keyword
        { 
          $group: {
            _id: '$keyword',
            keyword: { $first: '$keyword' },
            count: { $sum: 1 }
          }
        },
        // Sắp xếp theo số lần xuất hiện
        {
          $sort: {
            count: -1
          }
        } as PipelineStage,
        // Giới hạn số lượng keyword trả về
        {
          $limit: 10
        },
        // Định dạng kết quả
        {
          $project: {
            _id: 0,
            keyword: 1
          }
        }
      ];

      console.log('Executing aggregation pipeline:', JSON.stringify(pipeline, null, 2));

      const questions = await Question.aggregate(pipeline);
      console.log('Aggregation result:', JSON.stringify(questions, null, 2));

      const keywords = questions.map(q => q.keyword);
      console.log('Final keywords:', keywords);
      console.log('=== Keyword search completed ===');

      return NextResponse.json(keywords);
    } catch (error) {
      const searchError = error as SearchError;
      console.error('Error during search:', searchError);
      return NextResponse.json({ 
        error: 'Search failed', 
        details: searchError.message,
        pipeline: searchError.pipeline,
        stage: searchError.stage 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('=== Error in keyword API ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message
    }, { status: 500 });
  }
} 