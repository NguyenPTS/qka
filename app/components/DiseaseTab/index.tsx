"use client";
import { useEffect, useState } from "react";
import DiseaseForm, { DiseaseFormData } from "./DiseaseForm";
import DiseaseList, { Disease } from "./DiseaseList";
import Modal from "../ui/Modal";
import { Button } from "../ui/button";
import SearchDisease, { DiseaseSearchFilter } from "./SearchDisease";

export default function DiseaseTab() {
  const [data, setData] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<Disease | null>(null);
  const [pageFilter, setPageFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [searchFilter, setSearchFilter] = useState<DiseaseSearchFilter>({});

  // Fetch data
  const fetchData = () => {
    setLoading(true);
    fetch("/api/disease")
      .then(res => res.json())
      .then(res => setData(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Submit handler
  const handleSubmit = async (form: DiseaseFormData & { _id?: string }) => {
    setLoading(true);
    console.log('[DiseaseTab] Submitting form:', form);
    let res;
    if (editData?._id) {
      res = await fetch("/api/disease", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editData._id }),
      });
    } else {
      res = await fetch("/api/disease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    const data = await res.json();
    console.log('[DiseaseTab] API response:', data);
    setOpen(false);
    setEditData(null);
    fetchData();
  };

  const handleEdit = (d: Disease) => {
    setEditData(d);
    setOpen(true);
  };

  const handleDelete = async (d: Disease) => {
    if (!window.confirm(`Xoá bệnh lý "${d.name}"?`)) return;
    setLoading(true);
    const res = await fetch(`/api/disease?id=${d._id}`, { method: "DELETE" });
    const data = await res.json();
    console.log('[DiseaseTab] Delete response:', data);
    fetchData();
  };

  // Lọc dữ liệu theo page và search
  let filteredData = pageFilter === "all" ? data : data.filter(d => d.page?.name === pageFilter);
  // Lọc theo search
  if (searchFilter.name) filteredData = filteredData.filter(d => d.name.toLowerCase().includes(searchFilter.name!.toLowerCase()));
  if (searchFilter.phone) filteredData = filteredData.filter(d => d.phone.includes(searchFilter.phone!));
  if (searchFilter.disease) filteredData = filteredData.filter(d => d.disease.some(b => b.toLowerCase().includes(searchFilter.disease!.toLowerCase())));
  // Sắp xếp theo thời gian tạo mới nhất lên đầu
  const sortedData = [...filteredData].sort((a, b) => {
    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tB - tA;
  });
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const pagedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  // Reset về trang 1 khi filter thay đổi
  useEffect(() => { setCurrentPage(1); }, [pageFilter, data]);
  useEffect(() => { setCurrentPage(1); }, [searchFilter]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Quản lý bệnh lý</h2>
      <SearchDisease value={searchFilter} onChange={setSearchFilter} />
      <div className="mb-4 flex items-center gap-2">
        <label className="font-medium">Lọc theo page:</label>
        <select
          className="border rounded px-2 py-1"
          value={pageFilter}
          onChange={e => setPageFilter(e.target.value)}
        >
          <option value="all">Tất cả</option>
          {Array.from(new Set(data.map(d => d.page?.name).filter(Boolean))).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
      <Button onClick={() => { setOpen(true); setEditData(null); }} className="mb-4">+ Thêm bệnh lý</Button>
      <Modal open={open} onClose={() => { setOpen(false); setEditData(null); }}>
        <DiseaseForm loading={loading} onSubmit={handleSubmit} initialData={editData || undefined} />
      </Modal>
      <h3 className="font-bold mb-2">Danh sách bệnh lý</h3>
      {loading ? <div>Đang tải...</div> : <>
        <DiseaseList data={pagedData} onEdit={handleEdit} onDelete={handleDelete} />
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              className="px-3 py-1 rounded border bg-gray-50 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`px-3 py-1 rounded border ${page === currentPage ? 'bg-blue-600 text-white font-bold' : 'bg-gray-50'}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded border bg-gray-50 disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </div>
        )}
      </>}
    </div>
  );
} 