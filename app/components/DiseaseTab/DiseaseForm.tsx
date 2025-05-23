"use client";
import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarena";
import { z } from "zod";
import { FiTrash2 } from "react-icons/fi";

export type DiseaseFormData = {
  name: string;
  phone: string;
  age: string;
  address: string;
  disease: string[];
  note: string;
  page: { id: string; name: string };
};

const diseaseSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  phone: z.string().min(1, "Số điện thoại không được để trống"),
  age: z.string().min(1, "Tuổi không được để trống"),
  address: z.string().min(1, "Địa chỉ không được để trống"),
  disease: z.array(z.string().min(1, "Bệnh không được để trống")),
  note: z.string().optional(),
  page: z.object({ id: z.string().optional(), name: z.string().optional() }),
});

type Props = {
  loading?: boolean;
  onSubmit: (data: DiseaseFormData & { _id?: string }) => void;
  initialData?: DiseaseFormData;
};

export default function DiseaseForm({ loading, onSubmit, initialData }: Props) {
  const [form, setForm] = useState<DiseaseFormData>(
    initialData || {
      name: "",
      phone: "",
      age: "",
      address: "",
      disease: [""],
      note: "",
      page: { id: "", name: "" },
    }
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("page.")) {
      setForm(f => ({ ...f, page: { ...f.page, [name.split(".")[1]]: value } }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleDiseaseChange = (idx: number, value: string) => {
    setForm(f => ({
      ...f,
      disease: f.disease.map((d, i) => (i === idx ? value : d)),
    }));
  };

  const addDiseaseField = () => setForm(f => ({ ...f, disease: [...f.disease, ""] }));

  const removeDiseaseField = (idx: number) => {
    setForm(f => ({
      ...f,
      disease: f.disease.length > 1 ? f.disease.filter((_, i) => i !== idx) : f.disease,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = diseaseSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === "disease" && typeof err.path[1] === "number") {
          fieldErrors[`disease.${err.path[1]}`] = err.message;
        } else if (typeof err.path[0] === "string") {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(initialData && (initialData as any)._id ? { ...form, _id: (initialData as any)._id } : form);
  };

  return (
    <form onSubmit={handleSubmit} className="">
      <div>
        <Label className="font-semibold">Tên</Label>
        <Input name="name" value={form.name} onChange={handleChange} required className={errors.name ? "border-red-500" : ""} />
        {errors.name && <div className="text-red-500 text-xs mt-1 font-medium">{errors.name}</div>}
      </div>
      <div>
        <Label className="font-semibold">Số điện thoại</Label>
        <Input name="phone" value={form.phone} onChange={handleChange} required className={errors.phone ? "border-red-500" : ""} />
        {errors.phone && <div className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</div>}
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label className="font-semibold">Tuổi</Label>
          <Input name="age" value={form.age} onChange={handleChange} required className={errors.age ? "border-red-500" : ""} />
          {errors.age && <div className="text-red-500 text-xs mt-1 font-medium">{errors.age}</div>}
        </div>
        <div className="flex-1">
          <Label className="font-semibold">Địa chỉ</Label>
          <Input name="address" value={form.address} onChange={handleChange} required className={errors.address ? "border-red-500" : ""} />
          {errors.address && <div className="text-red-500 text-xs mt-1 font-medium">{errors.address}</div>}
        </div>
      </div>
      <div>
        <Label className="font-semibold">Bệnh lý</Label>
        <div className="space-y-2">
          {form.disease.map((d, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={d}
                onChange={e => handleDiseaseChange(idx, e.target.value)}
                className={"flex-1 " + (errors[`disease.${idx}`] ? "border-red-500" : "")}
                required
              />
              {form.disease.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDiseaseField(idx)}
                  className="text-red-500 hover:bg-red-100 rounded-full p-2 transition"
                  title="Xoá bệnh này"
                  aria-label="Xoá bệnh này"
                >
                  <FiTrash2 size={18} />
                </button>
              )}
              {idx === form.disease.length - 1 && (
                <Button type="button" onClick={addDiseaseField} className="h-9 px-3 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold border border-gray-300 shadow-sm">
                  + Thêm bệnh
                </Button>
              )}
            </div>
          ))}
        </div>
        {form.disease.map((_, idx) => errors[`disease.${idx}`] && <div key={idx} className="text-red-500 text-xs mt-1 font-medium">{errors[`disease.${idx}`]}</div>)}
      </div>
      <div>
        <Label className="font-semibold">Nội dung</Label>
        <Textarea name="note" value={form.note} onChange={handleChange} />
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label className="font-semibold">Page ID</Label>
          <Input name="page.id" value={form.page.id} onChange={handleChange} />
        </div>
        <div className="flex-1">
          <Label className="font-semibold">Page Name</Label>
          <Input name="page.name" value={form.page.name} onChange={handleChange} />
        </div>
      </div>
      <div className="pt-2">
        <Button type="submit" disabled={loading} className="w-full h-11 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition">
          {loading ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>
    </form>
  );
}
