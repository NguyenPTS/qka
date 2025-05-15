"use client";

import { useState, useEffect, useCallback } from "react";
import React from "react";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs as ShadcnTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Label,
  Textarea,
  Button,
  Input
} from "@/components/ui";
import {
  ImageIcon,
  PlusCircle,
  Trash2,
  Edit,
  RefreshCw
} from "lucide-react";

interface Question {
  _id: string;
  question: string;
  keyword: string[];
  answer: string;
}

interface CrudTableProps {
  crudQuestions: Question[];
  handleCrudEdit: (q: Question) => void;
  handleCrudDelete: (id: string) => void;
}

const CrudTable = React.memo(function CrudTable({ crudQuestions, handleCrudEdit, handleCrudDelete }: CrudTableProps) {
  return (
    <div className="mt-10 rounded-2xl shadow-xl max-w-5xl mt-1">
      <table className="min-w-full">
        <thead className="bg-blue-100">
          <tr>
            <th className="font-bold text-blue-700 text-base py-3">Question</th>
            <th className="font-bold text-blue-700 text-base py-3">Keyword</th>
            <th className="font-bold text-blue-700 text-base py-3">Answer</th>
            <th className="font-bold text-blue-700 text-base py-3 text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {crudQuestions?.map((q: Question) => (
            <tr key={q._id} className="hover:bg-blue-50 transition">
              <td className="align-top py-3">{q.question}</td>
              <td className="align-top py-3">
                <div className="flex flex-wrap gap-0.5">
                  {(Array.isArray(q.keyword) ? q.keyword : [q.keyword]).map((kw, idx) => (
                    <span
                      key={idx}
                      className="font-semibold text-sm border border-blue-200 px-2 py-1 rounded-md"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </td>
              <td className="align-top py-3">
                <div
                  className="max-height-200 overflow-y-auto bg-gray-50 border border-gray-200 rounded-md p-2"
                >
                  {q.answer}
                </div>
              </td>
              <td className="align-top py-3 text-center">
                <Button
                  className="mr-2 !rounded-md !py-1 !px-3 !text-sm transition-transform duration-100 active:scale-95"
                  onClick={() => handleCrudEdit(q)}
                >
                  <Edit size={16} className="inline mr-1" /> Sửa
                </Button>
                <Button
                  className="!rounded-md !py-1 !px-3 !text-sm hover:!bg-red-100 hover:!border-red-500 transition-transform duration-100 active:scale-95"
                  onClick={() => handleCrudDelete(q._id)}
                >
                  <Trash2 size={16} className="inline mr-1" /> Xoá
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default function Home() {
  const [tab, setTab] = useState('0');
  const [prevTab, setPrevTab] = useState('0');

  // --- SEARCH STATE & LOGIC ---
  const [question, setQuestion] = useState("");
  const [keyword, setKeyword] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleQuestionSubmit = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setHasSearched(true);
    setSelectedKeywords([]);
    setQuestions([]);
    try {
      const response = await fetch(
        `/api/questions/keyword?question=${encodeURIComponent(question)}`
      );
      const data = await response.json();
      if (response.ok) {
        setKeyword(data);
      } else {
        setError(data.error || "Failed to fetch keywords");
      }
    } catch (error) {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordToggle = async (keyword: string) => {
    setLoading(true);
    setError("");
    try {
      const newSelectedKeywords = selectedKeywords.includes(keyword)
        ? selectedKeywords.filter((k) => k !== keyword)
        : [...selectedKeywords, keyword];
      setSelectedKeywords(newSelectedKeywords);
      if (newSelectedKeywords.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }
      const keywordsParam = newSelectedKeywords
        .map((k) => encodeURIComponent(k))
        .join(",");
      const response = await fetch(
        `/api/questions/search?keywords=${keywordsParam}`
      );
      const data = await response.json();
      if (response.ok) {
        setQuestions(data);
      } else {
        setError(data.error || "Failed to fetch questions");
      }
    } catch (error) {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuestion("");
    setKeyword([]);
    setSelectedKeywords([]);
    setQuestions([]);
    setError("");
    setHasSearched(false);
  };

  // --- CRUD STATE & LOGIC ---
  const [crudQuestions, setCrudQuestions] = useState<Question[]>([]);
  const [crudTotal, setCrudTotal] = useState(0);
  const [crudPage, setCrudPage] = useState(1);
  const crudPageSize = 10;
  const [form, setForm] = useState({ question: "", keyword: "", answer: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pendingSortBy, setPendingSortBy] = useState<'createdAt' | 'updatedAt'>(sortBy);
  const [pendingSortOrder, setPendingSortOrder] = useState<'asc' | 'desc'>(sortOrder);
  const [isLocked, setIsLocked] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchCrudQuestions = async (page = 1, sortByParam = sortBy, sortOrderParam = sortOrder) => {
    const res = await fetch(`/api/questions/all?page=${page}&pageSize=${crudPageSize}&sortBy=${sortByParam}&sort=${sortOrderParam}`);
    const data = await res.json();
    setCrudQuestions(data.data);
    setCrudTotal(data.total);
  };
  useEffect(() => {
    if (tab === "1") fetchCrudQuestions(crudPage, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [tab, crudPage, sortBy, sortOrder]);

  const handleCrudChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [e.target.name]: e.target.value })), []);
  const handleCrudTextAreaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setForm(f => ({ ...f, [e.target.name]: e.target.value })), []);

  const handleCrudSubmit = async () => {
    if (editingId) {
      await fetch(`/api/questions/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          keyword: form.keyword.split(",").map((k) => k.trim())
        }),
      });
      setSuccessMsg("Cập nhật câu hỏi thành công!");
    } else {
      await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          keyword: form.keyword.split(",").map((k) => k.trim())
        }),
      });
      setSuccessMsg("Thêm câu hỏi thành công!");
    }
    setForm({ question: "", keyword: "", answer: "" });
    setEditingId(null);
    fetchCrudQuestions(crudPage, sortBy, sortOrder);
  };

  const handleCrudEdit = useCallback((q: Question) => {
    setForm({
      question: q.question,
      keyword: Array.isArray(q.keyword) ? q.keyword.join(", ") : q.keyword,
      answer: q.answer,
    });
    setEditingId(q._id);
    setEditOpen(true);
  }, []);

  const handleEditClose = () => {
    setEditOpen(false);
    setEditingId(null);
    setForm({ question: "", keyword: "", answer: "" });
  };

  const handleCrudDelete = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteId) {
      await fetch(`/api/questions/${deleteId}`, { method: "DELETE" });
      fetchCrudQuestions(crudPage, sortBy, sortOrder);
      setDeleteId(null);
      setDeleteOpen(false);
      setSuccessMsg("Xóa câu hỏi thành công!");
    }
  }, [deleteId, crudPage, sortBy, sortOrder]);

  const cancelDelete = useCallback(() => {
    setDeleteId(null);
    setDeleteOpen(false);
  }, []);

  const handleTabChange = (_: any, value: string) => {
    setPrevTab(tab);
    setTab(value);
    if (value === "1" && isLocked) {
      setShowPasswordDialog(true);
    }
  };

  useEffect(() => {
    if (tab === "1" && isLocked && !showPasswordDialog) {
      setShowPasswordDialog(true);
    }
  }, [tab, isLocked, showPasswordDialog]);

  const [subTab, setSubTab] = useState('pending');

  // Thêm các state và handler cho form sale
  const [saleNewQuestion, setSaleNewQuestion] = useState("");
  const [saleSelectedImages, setSaleSelectedImages] = useState<File[]>([]);
  const [saleImagePreviewUrls, setSaleImagePreviewUrls] = useState<string[]>([]);
  const [saleQuestions, setSaleQuestions] = useState<any[]>([]);
  const [saleAnswers, setSaleAnswers] = useState<Record<string, string>>({});
  const [saleCurrentTab, setSaleCurrentTab] = useState<'pending' | 'done'>("pending");

  const handleSaleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSaleSelectedImages((prev) => [...prev, ...filesArray]);
      const newPreviewUrls = filesArray.map((file) => URL.createObjectURL(file));
      setSaleImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    }
  };
  const removeSaleImage = (index: number) => {
    setSaleSelectedImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(saleImagePreviewUrls[index]);
    setSaleImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };
  const addSaleQuestion = () => {
    if (!saleNewQuestion.trim()) return;
    const newQuestionImages = saleImagePreviewUrls.map((url, index) => ({ id: `img-${Date.now()}-${index}`, url }));
    const newQuestionItem = {
      id: `q-${Date.now()}`,
      text: saleNewQuestion,
      images: newQuestionImages,
      status: "pending",
      createdAt: new Date(),
    };
    setSaleQuestions((prev) => [newQuestionItem, ...prev]);
    setSaleNewQuestion("");
    setSaleSelectedImages([]);
    setSaleImagePreviewUrls([]);
  };
  const handleSaleAnswerChange = (questionId: string, value: string) => {
    setSaleAnswers((prev) => ({ ...prev, [questionId]: value }));
  };
  const answerSaleQuestion = (questionId: string) => {
    const answer = saleAnswers[questionId];
    if (!answer?.trim()) return;
    setSaleQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, status: "done", answer } : q)));
    setSaleAnswers((prev) => { const newAnswers = { ...prev }; delete newAnswers[questionId]; return newAnswers; });
  };
  const deleteSaleQuestion = (questionId: string) => {
    setSaleQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };
  const resetSaleToPending = (questionId: string) => {
    setSaleQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, status: "pending", answer: undefined } : q)));
  };
  const saleFilteredQuestions = saleQuestions.filter((q) => q.status === saleCurrentTab);

  // Thêm state cho filter tìm kiếm
  const [searchQuestion, setSearchQuestion] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  return (
    <div className="flex justify-center w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl px-4 py-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-8">Quản lý câu hỏi</h1>
        <ShadcnTabs value={tab} onValueChange={setTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="0">Tìm kiếm câu hỏi</TabsTrigger>
            <TabsTrigger value="1">Quản lý câu hỏi</TabsTrigger>
            <TabsTrigger value="2">Thêm câu hỏi bởi sale</TabsTrigger>
          </TabsList>
          <TabsContent value="0">
          {/* --- SEARCH UI --- */}
            <h2 className="text-2xl font-bold mb-4">Tìm kiếm câu hỏi</h2>
            <div className="p-4 mb-4 bg-white rounded-lg">
              <input
                type="text"
                placeholder="Type your question and press Enter..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleQuestionSubmit()}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <div className="mt-2 flex gap-2">
                <Button onClick={handleQuestionSubmit} disabled={loading}>
                {loading ? "Searching..." : "Find Keywords"}
              </Button>
                <Button onClick={handleClear} disabled={loading || !hasSearched} className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-100">
                  Clear
                </Button>
              </div>
            </div>
          {error && (
              <div className="mb-2 text-red-500">{error}</div>
          )}
          {hasSearched && !loading && keyword.length === 0 && (
              <div className="mb-2 text-blue-500">
              No keywords found for your question. Please try a different question.
              </div>
          )}
          {keyword.length > 0 && (
              <div className="p-4 mb-4 bg-white rounded-lg">
                <h3 className="text-base font-bold mb-2">Related Keywords ({keyword.length}) - Selected: {selectedKeywords.length}</h3>
                <div className="flex flex-wrap gap-2">
                {keyword.map((kw) => (
                    <button
                    key={kw}
                    onClick={() => handleKeywordToggle(kw)}
                      className={`px-2 py-1 border ${selectedKeywords.includes(kw) ? 'border-blue-500' : 'border-gray-200'} rounded-md ${selectedKeywords.includes(kw) ? 'bg-blue-50' : ''}`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
          )}
          {selectedKeywords.length > 0 && (
              <div className="p-4 mb-4 bg-white rounded-lg">
                <h3 className="text-base font-bold mb-2">Selected Keywords:</h3>
                <div className="flex flex-wrap gap-2">
                {selectedKeywords.map((kw) => (
                    <button
                    key={kw}
                      onClick={() => handleKeywordToggle(kw)}
                      className="px-2 py-1 border border-gray-200 rounded-md"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
          )}
          {selectedKeywords.length > 0 && !loading && questions.length === 0 && (
              <div className="text-blue-500">
              No questions found for the selected keywords: <strong>{selectedKeywords.join(", ")}</strong>
              </div>
          )}
          {questions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-base font-bold mb-2">Questions and Answers ({questions.length} results)</h3>
                <div className="flex flex-col gap-4">
                {questions?.map((question) => (
                    <div key={question._id} className="p-4 bg-white rounded-lg">
                      <h4 className="text-base font-bold mb-2">{question.question}</h4>
                      <div className="mb-2">
                        <span className="font-semibold text-sm text-gray-500">Keywords: </span>
                        {question.keyword.map((k, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              !selectedKeywords.includes(k) && handleKeywordToggle(k)
                            }
                            className={`px-2 py-1 ${selectedKeywords.includes(k) ? 'bg-blue-50' : ''} border ${selectedKeywords.includes(k) ? 'border-blue-500' : 'border-gray-200'} rounded-md`}
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2">
                        <span className="font-semibold text-sm text-gray-500">Answer:</span>
                        <div className="mt-1 p-2 border border-gray-200 rounded-md">
                        {question.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          )}
          {loading && (
              <div className="text-center mt-2 text-gray-500">
                Loading...
              </div>
            )}
          </TabsContent>
          <TabsContent value="1">
            {/* --- Quản lý câu hỏi --- */}
            {tab === "1" && isLocked && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">Nhập mật khẩu để truy cập</h2>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setShowPasswordDialog(false);
                        setTab(prevTab.toString());
                        setPasswordInput("");
                        setPasswordError("");
                      }}
                      className="px-4 py-2 bg-gray-200 rounded-md"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={() => {
                        if (passwordInput === "ChiPhuong") {
                          setIsLocked(false);
                          setShowPasswordDialog(false);
                          setPasswordInput("");
                          setPasswordError("");
                        } else {
                          setPasswordError("Mật khẩu không đúng!");
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                      Xác nhận
                    </button>
                  </div>
                </div>
              </div>
            )}
            {tab === "1" && !isLocked && (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setIsLocked(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md"
                  >
                    Khoá lại
                  </button>
                </div>
                <div className="border-b border-gray-200 mb-4">
                  <ShadcnTabs value={subTab} onValueChange={value => setSubTab(value)}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="pending">Đang chờ</TabsTrigger>
                      <TabsTrigger value="done">Đã trả lời</TabsTrigger>
                      <TabsTrigger value="all">Tất cả</TabsTrigger>
                      <TabsTrigger value="add">Thêm câu hỏi</TabsTrigger>
                    </TabsList>
                  </ShadcnTabs>
                </div>
                {/* Nội dung từng tab phụ */}
                {subTab !== 'add' && (
                  <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                    <div className="flex gap-2 items-center p-2 border border-gray-200 rounded-md flex-wrap">
                      <input
                        type="text"
                        placeholder="Tìm kiếm câu hỏi"
                        value={searchQuestion}
                        onChange={e => setSearchQuestion(e.target.value)}
                        className="p-2 border border-gray-200 rounded-md min-w-[180px]"
                      />
                      <input
                        type="text"
                        placeholder="Tìm kiếm keyword"
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        className="p-2 border border-gray-200 rounded-md min-w-[180px]"
                      />
                      <select
                        value={pendingSortBy}
                        onChange={(e) => setPendingSortBy(e.target.value as 'createdAt' | 'updatedAt')}
                        className="p-2 border border-gray-200 rounded-md"
                      >
                        <option value="createdAt">Ngày tạo</option>
                        <option value="updatedAt">Ngày cập nhật</option>
                      </select>
                      <select
                        value={pendingSortOrder}
                        onChange={(e) => setPendingSortOrder(e.target.value as 'asc' | 'desc')}
                        className="p-2 border border-gray-200 rounded-md"
                      >
                        <option value="desc">Mới nhất</option>
                        <option value="asc">Cũ nhất</option>
                      </select>
                      <button
                        onClick={() => {
                          setSortBy(pendingSortBy);
                          setSortOrder(pendingSortOrder);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md"
                      >
                        Áp dụng
                      </button>
                      <button
                        onClick={() => {
                          setPendingSortBy('createdAt');
                          setPendingSortOrder('desc');
                          setSortBy('createdAt');
                          setSortOrder('desc');
                          setSearchQuestion("");
                          setSearchKeyword("");
                        }}
                        className="px-4 py-2 bg-gray-200 rounded-md"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                {/* Hiển thị kết quả tìm kiếm bên dưới filter nếu có từ khoá */}
                {subTab !== 'add' && (searchQuestion.trim() !== '' || searchKeyword.trim() !== '') && (
                  <div className="mb-6">
                    <div className="text-lg font-semibold text-blue-700 mb-2">Kết quả tìm kiếm</div>
                    {(() => {
                      let filtered = crudQuestions;
                      if (searchQuestion.trim()) {
                        filtered = filtered.filter(q => q.question.toLowerCase().includes(searchQuestion.trim().toLowerCase()));
                      }
                      if (searchKeyword.trim()) {
                        filtered = filtered.filter(q => (Array.isArray(q.keyword) ? q.keyword : [q.keyword]).some(kw => kw.toLowerCase().includes(searchKeyword.trim().toLowerCase())));
                      }
                      // Không filter theo trạng thái, chỉ lọc theo tìm kiếm
                      // Sort lại theo sortBy/sortOrder
                      filtered = [...filtered].sort((a, b) => {
                        if (sortBy === 'createdAt') {
                          return sortOrder === 'desc'
                            ? new Date(b._id).getTime() - new Date(a._id).getTime()
                            : new Date(a._id).getTime() - new Date(b._id).getTime();
                        } else {
                          return sortOrder === 'desc'
                            ? new Date(((b as any)?.updatedAt || b._id)).getTime() - new Date(((a as any)?.updatedAt || a._id)).getTime()
                            : new Date(((a as any)?.updatedAt || a._id)).getTime() - new Date(((b as any)?.updatedAt || b._id)).getTime();
                        }
                      });
                      if (filtered.length === 0) {
                        return <div className="text-blue-500">Không tìm thấy kết quả phù hợp.</div>;
                      }
                      return <CrudTable crudQuestions={filtered} handleCrudEdit={handleCrudEdit} handleCrudDelete={handleCrudDelete} />;
                    })()}
                  </div>
                )}
                {subTab === 'add' ? (
                <div className="max-w-md mx-auto p-8 mb-10 rounded-2xl shadow-lg">
                  <h2 className="text-center text-2xl font-bold text-blue-700 mb-6">
              Thêm câu hỏi mới
                  </h2>
                  <div className="flex flex-col gap-4">
                    <input
                      type="text"
                      placeholder="Question"
                name="question"
                value={form.question}
                onChange={handleCrudChange}
                      className="p-2 border border-gray-200 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Keyword (cách nhau bởi dấu phẩy)"
                name="keyword"
                value={form.keyword}
                onChange={handleCrudChange}
                      className="p-2 border border-gray-200 rounded-md"
                    />
                    <textarea
                      placeholder="Answer"
                name="answer"
                value={form.answer}
                onChange={handleCrudTextAreaChange}
                required
                      className="p-2 border border-gray-200 rounded-md"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                  onClick={() => setForm({ question: '', keyword: '', answer: '' })}
                  disabled={editingId !== null}
                        className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  Clear
                      </button>
                      <button
                  onClick={async () => { await handleCrudSubmit(); }}
                  disabled={editingId !== null}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  THÊM
                      </button>
                    </div>
                  </div>
                </div>
                ) : (
                  // Các tab còn lại giữ nguyên logic lọc bảng
                  (() => {
                    let filtered = crudQuestions;
                    if (subTab === 'pending') filtered = filtered.filter(q => !q.answer);
                    else if (subTab === 'done') filtered = filtered.filter(q => q.answer);
                    // Sau khi filter, sort lại theo sortBy/sortOrder
                    filtered = [...filtered].sort((a, b) => {
                      if (sortBy === 'createdAt') {
                        return sortOrder === 'desc'
                          ? new Date(b._id).getTime() - new Date(a._id).getTime()
                          : new Date(a._id).getTime() - new Date(b._id).getTime();
                      } else {
                        return sortOrder === 'desc'
                          ? new Date(((b as any)?.updatedAt || b._id)).getTime() - new Date(((a as any)?.updatedAt || a._id)).getTime()
                          : new Date(((a as any)?.updatedAt || a._id)).getTime() - new Date(((b as any)?.updatedAt || b._id)).getTime();
                      }
                    });
                    return (
                      <CrudTable crudQuestions={filtered} handleCrudEdit={handleCrudEdit} handleCrudDelete={handleCrudDelete} />
                    );
                  })()
                )}
                <div className="flex justify-center items-center mt-8 gap-6">
                  <button
                    onClick={() => setCrudPage((p) => Math.max(1, p - 1))}
              disabled={crudPage === 1}
                    className="w-5 h-5 text-base border border-blue-400 hover:bg-blue-100 transition-transform duration-100 active:scale-95"
            >
              &lt;
                  </button>
            <span className="text-lg font-semibold text-blue-700"> Trang {crudPage} / {Math.ceil(crudTotal / crudPageSize) || 1}</span>
                  <button
                    onClick={() => setCrudPage((p) => p + 1)}
              disabled={crudPage >= Math.ceil(crudTotal / crudPageSize)}
                    className="w-10 h-10 text-base border border-blue-400 hover:bg-blue-100 transition-transform duration-100 active:scale-95"
            >
              &gt;
                  </button>
                </div>
                <div className="mt-8 flex justify-center">
                  {successMsg && (
                    <div className="p-2 bg-green-100 text-green-700 rounded-md">
                      {successMsg}
                    </div>
                  )}
                </div>
                <div className="mt-8 flex justify-center gap-4">
                  {deleteOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="bg-white p-8 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">Xác nhận xóa</h2>
                        <p>Bạn có chắc chắn muốn xóa câu hỏi này?</p>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={cancelDelete}
                            className="px-4 py-2 bg-gray-200 rounded-md"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-md"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {editOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg max-w-2xl w-full">
                      <h2 className="text-xl font-bold mb-4">Cập nhật câu hỏi</h2>
                      <div className="flex flex-col gap-4">
                        <input
                          type="text"
                          placeholder="Question"
                          name="question"
                          value={form.question}
                          onChange={handleCrudChange}
                          className="p-2 border border-gray-200 rounded-md"
                        />
                        <input
                          type="text"
                          placeholder="Keyword (cách nhau bởi dấu phẩy)"
                          name="keyword"
                          value={form.keyword}
                          onChange={handleCrudChange}
                          className="p-2 border border-gray-200 rounded-md"
                        />
                        <textarea
                          placeholder="Answer"
                          name="answer"
                          value={form.answer}
                          onChange={handleCrudTextAreaChange}
                          required
                          className="p-2 border border-gray-200 rounded-md min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleEditClose}
                            className="px-4 py-2 bg-gray-200 rounded-md"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleCrudSubmit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md"
                          >
                            Cập nhật
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          <TabsContent value="2">
            {/* --- Thêm câu hỏi bởi sale --- */}
            <div className="container mx-auto py-10">
              <h1 className="text-3xl font-bold mb-8">Quản lý câu hỏi bởi sale</h1>
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">Thêm câu hỏi mới</h2>
                <p className="text-base text-muted-foreground">Nhập câu hỏi và tải lên hình ảnh (nếu có)</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="sale-question">Câu hỏi</label>
                  <textarea
                    id="sale-question"
                    placeholder="Nhập câu hỏi của bạn..."
                    value={saleNewQuestion}
                    onChange={(e) => setSaleNewQuestion(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <label htmlFor="sale-images">Hình ảnh</label>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById("sale-image-upload")?.click()}
                      className="flex items-center gap-2 border border-input bg-background"
                    >
                      <ImageIcon size={16} />
                      Chọn hình ảnh
                    </button>
                    <input
                      id="sale-image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleSaleImageSelect}
                      className="hidden"
                    />
                  </div>
                  {saleImagePreviewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {saleImagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Preview ${index}`}
                            className="w-full h-32 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeSaleImage(index)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addSaleQuestion}
                  disabled={!saleNewQuestion.trim()}
                  className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <PlusCircle size={16} />
                  Thêm câu hỏi
                </button>
              </div>
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-2">Danh sách câu hỏi</h2>
                <p className="text-base text-muted-foreground">Quản lý và trả lời các câu hỏi</p>
              </div>
              <ShadcnTabs value={saleCurrentTab} onValueChange={value => setSaleCurrentTab(value as 'pending' | 'done')}>
                <TabsList className="mb-4">
                  <TabsTrigger value="pending">Đang chờ</TabsTrigger>
                  <TabsTrigger value="done">Đã trả lời</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                  {saleFilteredQuestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Không có câu hỏi nào đang chờ</div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2">Câu hỏi</th>
                          <th className="px-4 py-2">Hình ảnh</th>
                          <th className="px-4 py-2">Trả lời</th>
                          <th className="px-4 py-2 w-[150px]">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleFilteredQuestions.map((question) => (
                          <tr key={question.id}>
                            <td className="font-medium px-4 py-2">{question.text}</td>
                            <td className="px-4 py-2">
                              {question.images.length > 0 ? (
                                <div className="flex gap-2">
                                  {question.images.map((img: any, index: number) => (
                                    <img
                                      key={img.id}
                                      src={img.url || "/placeholder.svg"}
                                      alt={`Image ${index + 1}`}
                                      className="w-12 h-12 object-cover rounded-md"
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Không có hình ảnh</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <textarea
                                placeholder="Nhập câu trả lời..."
                                value={saleAnswers[question.id] || ""}
                                onChange={(e) => handleSaleAnswerChange(question.id, e.target.value)}
                                className="min-h-[80px]"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => answerSaleQuestion(question.id)}
                                  disabled={!saleAnswers[question.id]?.trim()}
                                  className="w-full bg-green-600 text-white hover:bg-green-700"
                                >
                                  Trả lời
                                </button>
                                <button
                                  onClick={() => deleteSaleQuestion(question.id)}
                                  className="w-full bg-red-600 text-white hover:bg-red-700"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </TabsContent>
                <TabsContent value="done">
                  {saleFilteredQuestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Không có câu hỏi nào đã trả lời</div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2">Câu hỏi</th>
                          <th className="px-4 py-2">Hình ảnh</th>
                          <th className="px-4 py-2">Câu trả lời</th>
                          <th className="px-4 py-2 w-[200px]">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleFilteredQuestions.map((question) => (
                          <tr key={question.id}>
                            <td className="font-medium px-4 py-2">{question.text}</td>
                            <td className="px-4 py-2">
                              {question.images.length > 0 ? (
                                <div className="flex gap-2">
                                  {question.images.map((img: any, index: number) => (
                                    <img
                                      key={img.id}
                                      src={img.url || "/placeholder.svg"}
                                      alt={`Image ${index + 1}`}
                                      className="w-12 h-12 object-cover rounded-md"
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Không có hình ảnh</span>
                              )}
                            </td>
                            <td className="px-4 py-2">{question.answer}</td>
                            <td className="px-4 py-2">
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => {
                                    handleSaleAnswerChange(question.id, question.answer || "");
                                    resetSaleToPending(question.id);
                                  }}
                                  className="w-full flex items-center gap-1 border border-input bg-background"
                                >
                                  <Edit size={14} />
                                  Sửa
                                </button>
                                <button
                                  onClick={() => resetSaleToPending(question.id)}
                                  className="w-full flex items-center gap-1 border border-input bg-background"
                                >
                                  <RefreshCw size={14} />
                                  Chuyển về Pending
                                </button>
                                <button
                                  onClick={() => deleteSaleQuestion(question.id)}
                                  className="w-full bg-red-600 text-white hover:bg-red-700"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </TabsContent>
              </ShadcnTabs>
            </div>
          </TabsContent>
        </ShadcnTabs>
      </div>
    </div>
  );
}
