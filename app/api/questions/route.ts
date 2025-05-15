import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';
import { ObjectId } from "mongodb";
import mongoose from 'mongoose';
import { SaleQuestion } from '@/types/sale-question';

interface WPQuestion extends SaleQuestion {
  _id?: string;
}

interface IQuestion {
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

interface MongoQuestion {
  _id: ObjectId;
  question: string;
  answer: string;
  keyword: string[];
  images?: string[];
  createdAt: Date;
}

interface QuestionResponse {
  _id: string;
  question: string;
  answer: string;
  keyword: string[];
  images?: string[];
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startItem: number;
  endItem: number;
}

function safeParseInt(value: string | null, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function calculatePagination(currentPage: number, itemsPerPage: number, totalItems: number): PaginationInfo {
  // Đảm bảo các giá trị là số dương
  const total = Math.max(0, totalItems);
  const limit = Math.max(1, itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(totalPages, Math.max(1, currentPage));

  // Tính toán item bắt đầu và kết thúc
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(startItem + limit - 1, total);

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    startItem,
    endItem
  };
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return '';
    }
    return d.toISOString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

function transformQuestion(doc: MongoQuestion): WPQuestion {
  return {
    _id: doc._id.toString(),
    question: doc.question,
    answer: doc.answer,
    keyword: doc.keyword,
    images: doc.images,
    createdAt: doc.createdAt
  };
}

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

    // Chuyển đổi response về dạng QuestionResponse
    const response: QuestionResponse = {
      _id: newQuestion._id.toString(),
      question: newQuestion.question,
      answer: newQuestion.answer,
      keyword: newQuestion.keyword,
      images: newQuestion.images || [],
      createdAt: formatDate(newQuestion.createdAt)
    };

    console.log('New question created:', response._id);

    return NextResponse.json(response, { status: 201 });
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
    
    // Lấy và validate search params
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse và validate page number
    const page = safeParseInt(searchParams.get('page'), 1);
    const limit = 10; // Cố định 10 items mỗi trang
    const search = searchParams.get('search') || '';
    const keyword = searchParams.get('keyword') || '';

    console.log('Query params:', { page, limit, search, keyword });

    const skip = (page - 1) * limit;

    // Đảm bảo kết nối trước khi query
    await ensureConnection();

    // Build MongoDB query
    const query: Record<string, any> = {};
    
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
    const [total, documents] = await Promise.all([
      Question.countDocuments(query),
      Question.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    // Chuyển đổi dữ liệu an toàn
    const questions = documents.map(doc => ({
      _id: doc._id?.toString() || '',
      question: doc.question || '',
      answer: doc.answer || '',
      keyword: Array.isArray(doc.keyword) ? doc.keyword : [],
      images: Array.isArray(doc.images) ? doc.images : [],
      createdAt: formatDate(doc.createdAt)
    }));

    const pagination = calculatePagination(page, limit, total);
    console.log('Pagination info:', pagination);

    return NextResponse.json({
      questions,
      total,
      pagination
    });

  } catch (error) {
    console.error('Error in GET /api/questions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch questions',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 