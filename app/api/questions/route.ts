import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';
import { ObjectId } from "mongodb";
import mongoose from 'mongoose';
import { SaleQuestion } from '@/types/sale-question';

interface WPQuestion extends SaleQuestion {
  _id?: string;
}

interface IQuestion extends mongoose.Document {
  _id: ObjectId;
  question: string;
  answer: string;
  keyword: string[];
  images?: string[];
  createdAt: Date;
}

const WP_USERNAME = 'thanhqt';
const WP_PASSWORD = 'pharmatech76';
const WP_URL = 'https://wordpress.pharmatech.vn';

async function ensureConnection() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
      console.log('MongoDB connected successfully');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
}

export async function POST(request: Request) {
  try {
    console.log('Starting POST request for question');
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.question?.trim()) {
      return NextResponse.json({ error: 'Trường question là bắt buộc và phải là chuỗi.' }, { status: 400 });
    }
    if (!body.answer?.trim()) {
      return NextResponse.json({ error: 'Trường answer là bắt buộc và phải là chuỗi.' }, { status: 400 });
    }

    // Process keywords
    let keywordArr: string[] = [];
    if (Array.isArray(body.keyword)) {
      keywordArr = body.keyword.map((k: string) => String(k).trim()).filter(Boolean);
    } else if (typeof body.keyword === 'string') {
      keywordArr = body.keyword.split(',').map((k: string) => k.trim()).filter(Boolean);
    }
    if (!keywordArr.length) {
      return NextResponse.json({ error: 'Trường keyword là bắt buộc và phải có ít nhất 1 từ khoá.' }, { status: 400 });
    }

    // Process images
    let imagesArr: string[] = [];
    if (body.images) {
      if (!Array.isArray(body.images)) {
        return NextResponse.json({ error: 'Trường images phải là một mảng các URL.' }, { status: 400 });
      }
      imagesArr = body.images.map((url: string) => String(url).trim()).filter(Boolean);
    }

    // Ensure MongoDB connection
    await ensureConnection();

    const newQuestion = await Question.create({
      question: body.question.trim(),
      keyword: keywordArr,
      answer: body.answer.trim(),
      images: imagesArr,
      createdAt: body.createdAt || new Date()
    });

    console.log('New question created:', newQuestion._id);

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/questions:', error);
    return NextResponse.json({ 
      error: 'Failed to create question',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    console.log('Starting GET request for questions');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const keyword = searchParams.get('keyword') || '';

    console.log('Query params:', { page, limit, search, keyword });

    const skip = (page - 1) * limit;

    // Đảm bảo kết nối trước khi query
    await ensureConnection();

    // Build MongoDB query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } }
      ];
    }

    if (keyword) {
      query.keyword = { 
        $elemMatch: { 
          $regex: keyword, 
          $options: 'i' 
        } 
      };
    }

    console.log('MongoDB query:', JSON.stringify(query, null, 2));

    // Thực hiện song song cả count và find để tối ưu thời gian
    const [total, questions] = await Promise.all([
      Question.countDocuments(query).exec(),
      Question.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IQuestion>()
        .exec()
    ]);

    console.log(`Found ${questions.length} questions for current page`);

    const response = {
      questions: questions.map(q => ({
        ...q,
        _id: q._id.toString(),
        createdAt: new Date(q.createdAt).toISOString()
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/questions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch questions',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 