import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Disease from "../../../models/Disease";

export const dynamic = 'force-dynamic';

function logDBInfo(action: string) {
  const dbName = Disease.db?.name || 'unknown';
  const collectionName = Disease.collection?.name || 'unknown';
  console.log(`[Disease API][${action}] Database: ${dbName}, Collection: ${collectionName}`);
}

export async function GET(req: NextRequest) {
  const conn = await connectDB();
  console.log("[Disease API][GET] Đã kết nối DB:", conn?.connection?.name || conn?.connections?.[0]?.name);
  logDBInfo('GET');
  const diseases = await Disease.find({}).sort({ createdAt: -1 });
  console.log(`[Disease API][GET] Trả về ${diseases.length} bản ghi`);
  return NextResponse.json({ success: true, data: diseases });
}

export async function POST(req: NextRequest) {
  const conn = await connectDB();
  console.log("[Disease API][POST] Đã kết nối DB:", conn?.connection?.name || conn?.connections?.[0]?.name);
  logDBInfo('POST');
  const body = await req.json();
  const doc = await Disease.create(body);
  console.log("[Disease API][POST] Đã thêm:", doc?._id);
  return NextResponse.json({ success: true, data: doc });
} /////

export async function PUT(req: NextRequest) {
  const conn = await connectDB();
  console.log("[Disease API][PUT] Đã kết nối DB:", conn?.connection?.name || conn?.connections?.[0]?.name);
  logDBInfo('PUT');
  const body = await req.json();
  const { id, ...update } = body;
  if (!id) return NextResponse.json({ success: false, error: "Thiếu id" }, { status: 400 });
  const doc = await Disease.findByIdAndUpdate(id, update, { new: true });
  console.log("[Disease API][PUT] Đã cập nhật:", id);
  return NextResponse.json({ success: true, data: doc });
}

export async function DELETE(req: NextRequest) {
  const conn = await connectDB();
  console.log("[Disease API][DELETE] Đã kết nối DB:", conn?.connection?.name || conn?.connections?.[0]?.name);
  logDBInfo('DELETE');///
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Thiếu id" }, { status: 400 });
  const doc = await Disease.findByIdAndDelete(id);
  console.log("[Disease API][DELETE] Đã xoá:", id);
  return NextResponse.json({ success: true, data: doc });
} 