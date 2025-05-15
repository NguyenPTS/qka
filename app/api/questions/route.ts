import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/models/Question';
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate
    if (!body.question || typeof body.question !== 'string' || !body.question.trim()) {
      return NextResponse.json({ error: 'Trường question là bắt buộc và phải là chuỗi.' }, { status: 400 });
    }
    if (!body.answer || typeof body.answer !== 'string' || !body.answer.trim()) {
      return NextResponse.json({ error: 'Trường answer là bắt buộc và phải là chuỗi.' }, { status: 400 });
    }
    let keywordArr: string[] = [];
    if (Array.isArray(body.keyword)) {
      keywordArr = body.keyword.map((k: string) => String(k).trim()).filter(Boolean);
    } else if (typeof body.keyword === 'string') {
      keywordArr = body.keyword.split(',').map((k: string) => k.trim()).filter(Boolean);
    }
    if (!keywordArr.length) {
      return NextResponse.json({ error: 'Trường keyword là bắt buộc và phải có ít nhất 1 từ khoá.' }, { status: 400 });
    }

    // Validate images array if provided
    let imagesArr: string[] = [];
    if (body.images) {
      if (!Array.isArray(body.images)) {
        return NextResponse.json({ error: 'Trường images phải là một mảng các URL.' }, { status: 400 });
      }
      imagesArr = body.images.map((url: string) => String(url).trim()).filter(Boolean);
    }

    await connectDB();
    const newQuestion = await Question.create({
      question: body.question.trim(),
      keyword: keywordArr,
      answer: body.answer.trim(),
      images: imagesArr,
      createdAt: body.createdAt || new Date()
    });
    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error: any) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    console.log(`Fetching questions: page=${page}, limit=${limit}, sortBy=${sortBy}, sortOrder=${sortOrder}`);

    await connectDB();
    
    // Use mongoose model for querying
    const total = await Question.countDocuments();
    console.log(`Total documents: ${total}`);

    const skip = (page - 1) * limit;
    const sort: { [key: string]: 1 | -1 } = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const questions = await Question.find({})
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`Retrieved ${questions.length} questions`);

    return NextResponse.json({
      questions: questions.map(q => ({
        ...q,
        _id: q._id.toString()
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error in GET /api/questions:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 