import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';

export async function GET(request: Request) {
  try {
    console.log('=== Starting question search ===');
    const { searchParams } = new URL(request.url);
    const keywordsParam = searchParams.get('keywords');

    if (!keywordsParam) {
      console.log('No keywords provided');
      return NextResponse.json({ error: 'Keywords are required' }, { status: 400 });
    }

    const keywords = keywordsParam.split(',');
    console.log('Input keywords:', keywords);
    
    try {
      console.log('Connecting to MongoDB...');
      await connectDB();
      console.log('MongoDB connection successful');
    } catch (dbError) {
      console.error('MongoDB connection failed:', dbError);
      throw dbError;
    }

    try {
      // Thử in ra một số câu hỏi đầu tiên để kiểm tra cấu trúc dữ liệu
      console.log('Fetching sample questions...');
      const sampleQuestions = await Question.find().limit(2).lean();
      console.log('Sample questions from DB:', JSON.stringify(sampleQuestions, null, 2));
    } catch (sampleError) {
      console.error('Error fetching sample questions:', sampleError);
      // Không throw lỗi ở đây vì đây chỉ là log debug
    }

    try {
      // Tìm kiếm câu hỏi với các keyword và sắp xếp theo độ liên quan
      const questions = await Question.aggregate([
        {
          $match: {
            keyword: { $in: keywords }  // Tìm câu hỏi có chứa bất kỳ keyword nào
          }
        },
        // Tính điểm liên quan cho mỗi câu hỏi
        {
          $addFields: {
            // Đếm số lượng keyword match
            matchedKeywords: {
              $size: {
                $setIntersection: ['$keyword', keywords]
              }
            },
            // Tính điểm liên quan
            relevanceScore: {
              $sum: [
                // Điểm cho số lượng keyword match (2 điểm mỗi keyword)
                {
                  $multiply: [
                    {
                      $size: {
                        $setIntersection: ['$keyword', keywords]
                      }
                    },
                    2
                  ]
                },
                // Điểm cho độ dài câu trả lời
                { 
                  $cond: [
                    { $gt: [{ $strLenCP: '$answer' }, 100] },
                    1,
                    0
                  ]
                }
              ]
            }
          }
        },
        // Sắp xếp theo số lượng keyword match và điểm liên quan
        {
          $sort: {
            matchedKeywords: -1,
            relevanceScore: -1
          }
        }
      ]);

      console.log('Found questions:', JSON.stringify(questions, null, 2));
      console.log('Number of questions found:', questions.length);
      console.log('=== Question search completed ===');

      return NextResponse.json(questions);
    } catch (searchError) {
      console.error('Error during search:', searchError);
      throw searchError;
    }
  } catch (error: any) {
    console.error('=== Error in search API ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
} 