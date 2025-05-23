"use client";
import { Card } from "../ui/card";
import { FiEdit, FiTrash, FiInbox } from "react-icons/fi";

export type Disease = {
  _id?: string;
  name: string;
  phone: string;
  age: string;
  address: string;
  disease: string[];
  note: string;
  page: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  data: Disease[];
  onEdit?: (d: Disease) => void;
  onDelete?: (d: Disease) => void;
};

export default function DiseaseList({ data, onEdit, onDelete }: Props) {
  if (!data.length)
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <FiInbox size={48} className="mb-2" />
        <div className="text-lg font-medium">Không có dữ liệu bệnh lý</div>
      </div>
    );
  return (
    <div className="space-y-6">
      {data.map(d => (
        <Card
          key={d._id || d.name + d.phone}
          className="p-5 relative rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition group bg-white"
        >
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            {onEdit && (
              <button
                className="text-blue-600 hover:bg-blue-100 rounded-full p-2 transition focus:outline-none focus:ring-2 focus:ring-blue-300"
                onClick={() => onEdit(d)}
                title="Sửa"
                aria-label="Sửa"
              >
                <FiEdit size={22} />
              </button>
            )}
            {onDelete && (
              <button
                className="text-red-600 hover:bg-red-100 rounded-full p-2 transition focus:outline-none focus:ring-2 focus:ring-red-300"
                onClick={() => onDelete(d)}
                title="Xoá"
                aria-label="Xoá"
              >
                <FiTrash size={22} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            <div><span className="font-semibold text-gray-700">Tên:</span> {d.name}</div>
            <div><span className="font-semibold text-gray-700">SĐT:</span> {d.phone}</div>
            <div><span className="font-semibold text-gray-700">Tuổi:</span> {d.age}</div>
            <div><span className="font-semibold text-gray-700">Địa chỉ:</span> {d.address}</div>
            <div className="sm:col-span-2"><span className="font-semibold text-gray-700">Bệnh lý:</span> {d.disease?.join(", ")}</div>
            <div className="sm:col-span-2">
              <span className="font-semibold text-gray-700">Nội dung:</span>
              <div
                className="mt-1 bg-gray-50 rounded-lg px-3 py-2 text-sm Roboto whitespace-pre-line text-gray-700 border border-gray-100 min-h-[32px]"
              >
                {d.note?.trim() ? d.note : <span className="italic text-gray-400">Không có ghi chú</span>}
              </div>
            </div>
            <div><span className="font-semibold text-gray-700">Page:</span> {d.page?.name}</div>
            <div className="text-xs text-gray-400 flex items-end">{d.createdAt ? `Ngày tạo: ${new Date(d.createdAt).toLocaleString("vi-VN")}` : ""}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
