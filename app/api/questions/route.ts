export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Question from '../../../models/Question';
import { ObjectId } from "mongodb";
import mongoose from 'mongoose';

interface WPQuestion {
  _id?: string;
  id: number;
  date: string;
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  featured_media: number;
  template: string;
  acf: {
    keywords: string[];
    images: {
      url: string;
      alt: string;
    }[];
  };
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
  status: string;
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
  const now = new Date().toISOString();
  return {
    _id: doc._id.toString(),
    id: parseInt(doc._id.toString().substring(0, 8), 16),
    date: now,
    date_gmt: now,
    guid: {
      rendered: `${WP_URL}/questions/${doc._id}`
    },
    modified: now,
    modified_gmt: now,
    slug: doc.question.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    status: 'publish',
    type: 'question',
    link: `${WP_URL}/questions/${doc._id}`,
    title: {
      rendered: doc.question
    },
    content: {
      rendered: doc.answer,
      protected: false
    },
    featured_media: 0,
    template: '',
    acf: {
      keywords: doc.keyword,
      images: doc.images ? doc.images.map(url => ({
        url,
        alt: 'Question image'
      })) : []
    }
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
    console.log('Request body received:', {
      question: body.question?.substring(0, 30) + '...',
      keywordLength: body.keyword?.length,
      answerLength: body.answer?.length,
      imagesCount: body.images?.length,
      source: body.source || 'default',
      createdAt: body.createdAt
    });
    
    // Special handling for questions from 'sale' source
    const isSaleSource = body.source === 'sale';
    
    // Validate required fields
    if (!body.question?.trim()) {
      console.error('Validation error: question field is required');
      return NextResponse.json({ error: 'Trường question là bắt buộc và phải là chuỗi.' }, { status: 400 });
    }
    
    // For non-sale sources, answer is required
    if (!isSaleSource && !body.answer?.trim()) {
      console.error('Validation error: answer field is required');
      return NextResponse.json({ error: 'Trường answer là bắt buộc và phải là chuỗi.' }, { status: 400 });
    }

    // Process keywords
    let keywordArr: string[] = [];
    if (Array.isArray(body.keyword)) {
      keywordArr = body.keyword.map((k: string) => String(k).trim()).filter(Boolean);
    } else if (typeof body.keyword === 'string') {
      keywordArr = body.keyword.split(',').map((k: string) => k.trim()).filter(Boolean);
    }
    
    // For non-sale sources, keywords are required
    if (!isSaleSource && !keywordArr.length) {
      console.error('Validation error: keyword field is required');
      return NextResponse.json({ error: 'Trường keyword là bắt buộc và phải có ít nhất 1 từ khoá.' }, { status: 400 });
    }
    
    // For sale source, allow empty keywords array

    // Process images
    let imagesArr: string[] = [];
    if (body.images) {
      if (!Array.isArray(body.images)) {
        console.error('Validation error: images field must be an array');
        return NextResponse.json({ error: 'Trường images phải là một mảng các URL.' }, { status: 400 });
      }
      imagesArr = body.images.map((url: string) => String(url).trim()).filter(Boolean);
    }

    // Ensure MongoDB connection
    console.log('Ensuring MongoDB connection...');
    await ensureConnection();
    console.log('MongoDB connected successfully');

    // Determine status based on whether it has an answer
    const status = body.answer?.trim() ? 'answered' : 'pending';
    
    // Override status if explicitly provided
    const finalStatus = body.status || status;
    
    console.log('Creating new question with status:', finalStatus);

    const newQuestion = await Question.create({
      question: body.question.trim(),
      keyword: keywordArr,
      answer: body.answer?.trim() || ' ',  // Use space as default for empty answers
      images: imagesArr,
      source: body.source || '',
      createdAt: body.createdAt || new Date(),
      status: finalStatus
    });

    console.log('New question created with ID:', newQuestion._id);

    // Chuyển đổi response về dạng QuestionResponse
    const response: QuestionResponse = {
      _id: newQuestion._id.toString(),
      question: newQuestion.question,
      answer: newQuestion.answer,
      keyword: newQuestion.keyword,
      images: newQuestion.images || [],
      status: newQuestion.status,
      createdAt: formatDate(newQuestion.createdAt)
    };

    console.log('Question saved successfully to MongoDB with ID:', response._id);
    console.log('Question status:', response.status);

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Detailed error in POST /api/questions:', error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error);
    
    return NextResponse.json({ 
      error: 'Failed to create question',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    console.log('Handling GET request for questions');
    const { searchParams } = new URL(request.url);
    
    // Lấy các tham số tìm kiếm từ URL
    const searchQuestion = searchParams.get('searchQuestion');
    const searchKeyword = searchParams.get('searchKeyword');
    
    // Lấy tham số phân trang
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const page = safeParseInt(pageParam, 1);
    const limit = safeParseInt(limitParam, 10);
    
    // Lấy tham số sắp xếp
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    // Lấy tham số nguồn và trạng thái
    const source = searchParams.get('source');
    const status = searchParams.get('status');
    
    console.log('Search params:', {
      page, 
      limit, 
      sortBy, 
      sortOrder,
      source: source || 'all',
      status: status || 'all',
      searchQuestion: searchQuestion || 'none',
      searchKeyword: searchKeyword || 'none'
    });
    
    // Xây dựng query object
    const query: any = {};
    
    // Lọc theo source nếu có
    if (source) {
      query.source = source;
    }
    
    // Lọc theo status nếu có
    if (status) {
      // Xử lý nhiều status được phân tách bởi dấu phẩy
      if (status.includes(',')) {
        const statusArray = status.split(',').map(s => s.trim());
        query.status = { $in: statusArray };
        console.log(`Filtering by multiple statuses: ${statusArray.join(', ')}`);
      } else {
        query.status = status;
        console.log(`Filtering by status: ${status}`);
      }
    }
    
    // Tìm kiếm theo câu hỏi nếu có
    if (searchQuestion) {
      // Sử dụng $regex để tìm kiếm không phân biệt chữ hoa/thường
      query.question = { $regex: searchQuestion, $options: 'i' };
      console.log(`Searching for questions containing: "${searchQuestion}"`);
    }
    
    // Tìm kiếm theo từ khóa nếu có
    if (searchKeyword) {
      // Hỗ trợ tìm kiếm trên cả mảng keyword và string keyword
      // Phân tách searchKeyword thành các từ khóa riêng lẻ nếu có dấu phẩy
      const keywordArray = searchKeyword.split(',').map(k => k.trim());
      
      if (keywordArray.length > 1) {
        // Tìm các bản ghi có ít nhất một từ khóa phù hợp
        const keywordQueries = keywordArray.map(k => {
          // Tạo pattern regex cho mỗi từ khóa
          const pattern = new RegExp(k, 'i');
          return { 
            $or: [
              // Trường hợp keyword là string
              { keyword: { $regex: pattern } },
              // Trường hợp keyword là array
              { keyword: { $elemMatch: { $regex: pattern } } }
            ]
          };
        });
        
        // Thêm điều kiện OR để khớp với bất kỳ từ khóa nào
        query.$or = keywordQueries;
        console.log(`Searching for multiple keywords: ${keywordArray.join(', ')}`);
      } else {
        // Chỉ một từ khóa duy nhất
        const pattern = new RegExp(searchKeyword, 'i');
        query.$or = [
          // Trường hợp keyword là string
          { keyword: { $regex: pattern } },
          // Trường hợp keyword là array
          { keyword: { $elemMatch: { $regex: pattern } } }
        ];
        console.log(`Searching for keyword: "${searchKeyword}"`);
      }
    }

    // Đảm bảo kết nối MongoDB
    await ensureConnection();
    
    // Log thông tin về query
    console.log('Final MongoDB query:', JSON.stringify(query, null, 2));
    
    // Thực hiện truy vấn để lấy tổng số câu hỏi phù hợp với filter
    const total = await Question.countDocuments(query);
    console.log(`Total matching documents: ${total}`);
    
    // Thông tin phân trang
    const pagination = calculatePagination(page, limit, total);
    const skip = (pagination.currentPage - 1) * pagination.itemsPerPage;
    
    // Truy vấn với phân trang và sắp xếp
    let questions = await Question.find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(pagination.itemsPerPage);
    
    // Chuyển đổi dữ liệu trả về
    const formattedQuestions = questions.map(doc => ({
      _id: doc._id.toString(),
      question: doc.question,
      keyword: doc.keyword,
      answer: doc.answer,
      images: doc.images,
      status: doc.status || 'pending', // Default to 'pending' if status is not set
      createdAt: formatDate(doc.createdAt)
    }));
    
    console.log(`Returning ${formattedQuestions.length} questions`);
    
    return NextResponse.json({
      success: true,
      data: {
        questions: formattedQuestions,
        pagination,
        total
      }
    });
  } catch (error) {
    console.error('Error in GET /api/questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
} 